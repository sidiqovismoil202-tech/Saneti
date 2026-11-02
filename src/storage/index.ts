/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { db } from './db';
import type {
  Worker,
  WorkerRole,
  AttendanceRecord,
  AttendanceStatus,
  ShiftRateHistoryItem,
  JobType,
} from '../types';
import { getTashkentTodayString } from '../utils/date';

/**
 * Noyob ID yaratish yordamchisi (vaqt + tasodifiy)
 */
export function generateUniqueId(prefix = 'id'): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

// ==========================================
// 1. ISHCHILAR BILAN ISHLASH (WORKERS)
// ==========================================

/**
 * Barcha ishchilarni olish
 * @param includeArchived Arxivlanganlarni ham qo'shish yoki faqat faollar
 */
export async function getWorkers(includeArchived = false): Promise<Worker[]> {
  try {
    let workersList: Worker[];
    if (includeArchived) {
      workersList = await db.workers.toArray();
    } else {
      workersList = await db.workers.filter(w => !w.isArchived).toArray();
    }
    // Ism-familiya bo'yicha alifbo tartibida saralash
    return workersList.sort((a, b) => a.fullName.localeCompare(b.fullName, 'uz'));
  } catch (error) {
    console.error('Ishchilarni yuklashda xatolik:', error);
    throw new Error("Ma'lumotni yuklab bo'lmadi. Qaytadan urinib ko'ring.");
  }
}

/**
 * Bir xil telefon raqamli boshqa ishchi borligini tekshirish
 */
export async function checkDuplicatePhone(phone: string, currentWorkerId?: string): Promise<Worker | null> {
  const cleanPhone = phone.trim();
  if (!cleanPhone) return null;
  
  try {
    const existing = await db.workers
      .filter(w => !w.isArchived && w.phone === cleanPhone && w.id !== currentWorkerId)
      .first();
    return existing || null;
  } catch (error) {
    console.error('Telefon raqamini tekshirishda xatolik:', error);
    return null;
  }
}

/**
 * Yangi ishchi qo'shish yoki mavjudini tahrirlash
 */
export async function saveWorker(
  workerData: Omit<Worker, 'createdAt' | 'updatedAt'> & { createdAt?: string }
): Promise<Worker> {
  try {
    const now = new Date().toISOString();
    const isNew = !workerData.id;
    const workerId = workerData.id || generateUniqueId('wrk');

    const workerToSave: Worker = {
      id: workerId,
      fullName: workerData.fullName.trim(),
      phone: workerData.phone ? workerData.phone.trim() : '',
      role: workerData.role,
      isArchived: Boolean(workerData.isArchived),
      createdAt: isNew ? now : (workerData.createdAt || now),
      updatedAt: now,
    };

    await db.workers.put(workerToSave);
    return workerToSave;
  } catch (error) {
    console.error('Ishchini saqlashda xatolik:', error);
    throw new Error("Ma'lumotni saqlab bo'lmadi. Qaytadan urinib ko'ring.");
  }
}

/**
 * Ishchini arxivlash (o'chirish o'rniga soft delete) yoki arxivdan qaytarish
 */
export async function toggleArchiveWorker(workerId: string, archive: boolean): Promise<void> {
  try {
    const worker = await db.workers.get(workerId);
    if (!worker) {
      throw new Error("Ishchi topilmadi");
    }
    await db.workers.update(workerId, {
      isArchived: archive,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Ishchini arxivlashda xatolik:', error);
    throw new Error("Ma'lumotni saqlab bo'lmadi. Qaytadan urinib ko'ring.");
  }
}

// ==========================================
// 2. DAVOMAT BILAN ISHLASH (ATTENDANCE)
// ==========================================

/**
 * Berilgan sana uchun davomat yozuvlarini olish
 * Xaritada qaytaradi: { [workerId]: 'keldi' | 'kelmadi' | 'yarim_kun' }
 */
export async function getAttendanceForDate(dateStr: string): Promise<Record<string, AttendanceStatus>> {
  try {
    const records = await db.attendance.where('date').equals(dateStr).toArray();
    const map: Record<string, AttendanceStatus> = {};
    for (const rec of records) {
      map[rec.workerId] = rec.status;
    }
    return map;
  } catch (error) {
    console.error('Davomatni yuklashda xatolik:', error);
    throw new Error("Davomat ma'lumotlarini yuklab bo'lmadi. Qaytadan urinib ko'ring.");
  }
}

/**
 * Bitta ishchining ma'lum kungi davomatini belgilash yoki o'chirish (bekor qilish)
 * status === null bo'lsa, yozuv o'chiriladi (belgilanmagan holatga qaytadi)
 */
export async function setWorkerAttendance(
  dateStr: string,
  workerId: string,
  status: AttendanceStatus | null
): Promise<void> {
  const recordId = `${dateStr}_${workerId}`;
  try {
    if (status === null) {
      await db.attendance.delete(recordId);
    } else {
      const record: AttendanceRecord = {
        id: recordId,
        date: dateStr,
        workerId,
        status,
        updatedAt: new Date().toISOString(),
      };
      await db.attendance.put(record);
    }
  } catch (error) {
    console.error('Davomatni saqlashda xatolik:', error);
    throw new Error("Ma'lumotni saqlab bo'lmadi. Qaytadan urinib ko'ring.");
  }
}

/**
 * Faqat belgilanmagan ishchilarni ommaviy "Keldi" deb belgilash
 */
export async function bulkSetAttendancePresent(
  dateStr: string,
  unassignedWorkerIds: string[]
): Promise<void> {
  if (unassignedWorkerIds.length === 0) return;
  try {
    const now = new Date().toISOString();
    const recordsToInsert: AttendanceRecord[] = unassignedWorkerIds.map(workerId => ({
      id: `${dateStr}_${workerId}`,
      date: dateStr,
      workerId,
      status: 'keldi',
      updatedAt: now,
    }));
    await db.attendance.bulkPut(recordsToInsert);
  } catch (error) {
    console.error('Ommaviy davomat saqlashda xatolik:', error);
    throw new Error("Ma'lumotni saqlab bo'lmadi. Qaytadan urinib ko'ring.");
  }
}

// ==========================================
// 3. SMENA NARXI TARIXI (SHIFT RATES)
// ==========================================

/**
 * Smena narxi tarixini olish (yangi sanadan eskiga qarab)
 */
export async function getShiftRateHistory(): Promise<ShiftRateHistoryItem[]> {
  try {
    const rates = await db.shiftRates.toArray();
    // Eng yangi sanadan boshlab saralash
    return rates.sort((a, b) => b.effectiveDate.localeCompare(a.effectiveDate));
  } catch (error) {
    console.error('Smena narxlarini yuklashda xatolik:', error);
    throw new Error("Ma'lumotni yuklab bo'lmadi. Qaytadan urinib ko'ring.");
  }
}

/**
 * Yangi smena narxi qo'shish
 */
export async function addShiftRate(
  effectiveDate: string,
  rate: number
): Promise<ShiftRateHistoryItem> {
  try {
    if (rate <= 0) {
      throw new Error("Narx 0 dan katta bo'lishi kerak");
    }
    const item: ShiftRateHistoryItem = {
      id: generateUniqueId('rate'),
      rate: Math.floor(rate),
      effectiveDate,
      createdAt: new Date().toISOString(),
    };
    await db.shiftRates.put(item);
    return item;
  } catch (error) {
    console.error('Smena narxini saqlashda xatolik:', error);
    throw new Error("Ma'lumotni saqlab bo'lmadi. Qaytadan urinib ko'ring.");
  }
}

/**
 * Berilgan sana uchun o'sha paytda amal qilgan smena narxini topish
 */
export async function getEffectiveShiftRateForDate(targetDate: string): Promise<number> {
  try {
    const history = await getShiftRateHistory();
    // effectiveDate <= targetDate bo'lgan eng birinchi (eng yaqin) narxni olamiz
    const matched = history.find(item => item.effectiveDate <= targetDate);
    if (matched) return matched.rate;
    // Agar topilmasa eng eski mavjud narx yoki 100 000 standart
    return history[history.length - 1]?.rate || 100000;
  } catch {
    return 100000;
  }
}

// ==========================================
// 4. ISH TURLARI (JOB TYPES / PIECE RATE)
// ==========================================

/**
 * Barcha ish turlarini olish
 */
export async function getJobTypes(includeArchived = false): Promise<JobType[]> {
  try {
    let list: JobType[];
    if (includeArchived) {
      list = await db.jobTypes.toArray();
    } else {
      list = await db.jobTypes.filter(j => !j.isArchived).toArray();
    }
    return list.sort((a, b) => a.title.localeCompare(b.title, 'uz'));
  } catch (error) {
    console.error('Ish turlarini yuklashda xatolik:', error);
    throw new Error("Ma'lumotni yuklab bo'lmadi. Qaytadan urinib ko'ring.");
  }
}

/**
 * Ish turini saqlash yoki yangilash
 */
export async function saveJobType(
  data: Omit<JobType, 'createdAt' | 'updatedAt'> & { createdAt?: string }
): Promise<JobType> {
  try {
    const now = new Date().toISOString();
    const isNew = !data.id;
    const id = data.id || generateUniqueId('job');

    const item: JobType = {
      id,
      title: data.title.trim(),
      pieceRate: Math.max(0, Math.floor(data.pieceRate)),
      isArchived: Boolean(data.isArchived),
      createdAt: isNew ? now : (data.createdAt || now),
      updatedAt: now,
    };

    await db.jobTypes.put(item);
    return item;
  } catch (error) {
    console.error('Ish turini saqlashda xatolik:', error);
    throw new Error("Ma'lumotni saqlab bo'lmadi. Qaytadan urinib ko'ring.");
  }
}

/**
 * Ish turini arxivlash yoki arxivdan chiqarish
 */
export async function toggleArchiveJobType(id: string, archive: boolean): Promise<void> {
  try {
    const item = await db.jobTypes.get(id);
    if (!item) throw new Error("Ish turi topilmadi");
    await db.jobTypes.update(id, {
      isArchived: archive,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Ish turini arxivlashda xatolik:', error);
    throw new Error("Ma'lumotni saqlab bo'lmadi. Qaytadan urinib ko'ring.");
  }
}

// ==========================================
// 5. ZAXIRA & MA'LUMOTLARNI YUKLASH / SINASH
// ==========================================

/**
 * Bazadagi barcha ma'lumotlarni JSON matn sifatida eksport qilish
 */
export async function exportAllData(): Promise<string> {
  const workers = await db.workers.toArray();
  const attendance = await db.attendance.toArray();
  const shiftRates = await db.shiftRates.toArray();
  const jobTypes = await db.jobTypes.toArray();

  const backupPayload = {
    version: 1,
    exportedAt: new Date().toISOString(),
    workers,
    attendance,
    shiftRates,
    jobTypes,
  };

  return JSON.stringify(backupPayload, null, 2);
}

/**
 * JSON fayldan ma'lumotlarni tiklash (Import)
 */
export async function importAllData(jsonString: string): Promise<{
  workersCount: number;
  attendanceCount: number;
  shiftRatesCount: number;
  jobTypesCount: number;
}> {
  try {
    const data = JSON.parse(jsonString);
    if (!data.workers && !data.shiftRates && !data.jobTypes) {
      throw new Error("Fayl formati noto'g'ri");
    }

    if (Array.isArray(data.workers) && data.workers.length > 0) {
      await db.workers.bulkPut(data.workers);
    }
    if (Array.isArray(data.attendance) && data.attendance.length > 0) {
      await db.attendance.bulkPut(data.attendance);
    }
    if (Array.isArray(data.shiftRates) && data.shiftRates.length > 0) {
      await db.shiftRates.bulkPut(data.shiftRates);
    }
    if (Array.isArray(data.jobTypes) && data.jobTypes.length > 0) {
      await db.jobTypes.bulkPut(data.jobTypes);
    }

    return {
      workersCount: data.workers?.length || 0,
      attendanceCount: data.attendance?.length || 0,
      shiftRatesCount: data.shiftRates?.length || 0,
      jobTypesCount: data.jobTypes?.length || 0,
    };
  } catch (error) {
    console.error('Zaxiradan tiklashda xatolik:', error);
    throw new Error("Zaxira nusxasini tiklab bo'lmadi. Fayl shikastlangan bo'lishi mumkin.");
  }
}

/**
 * Boshlang'ich ma'lumotlar bilan to'ldirish (agar baza bo'sh bo'lsa)
 */
export async function seedInitialDataIfEmpty(): Promise<void> {
  const workersCount = await db.workers.count();
  const shiftRatesCount = await db.shiftRates.count();
  const jobTypesCount = await db.jobTypes.count();

  const today = getTashkentTodayString();

  // Boshlang'ich smena narxi
  if (shiftRatesCount === 0) {
    await db.shiftRates.put({
      id: generateUniqueId('rate'),
      rate: 120000, // 120 000 so'm standart
      effectiveDate: today,
      createdAt: new Date().toISOString(),
    });
  }

  // Boshlang'ich ish turlari (chevar sexi namunalari)
  if (jobTypesCount === 0) {
    const defaultJobTypes: JobType[] = [
      {
        id: generateUniqueId('job'),
        title: "Ko'ylak",
        pieceRate: 15000,
        isArchived: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: generateUniqueId('job'),
        title: 'Shim',
        pieceRate: 20000,
        isArchived: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: generateUniqueId('job'),
        title: 'Kurtka',
        pieceRate: 40000,
        isArchived: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: generateUniqueId('job'),
        title: 'Nimcha (Jilet)',
        pieceRate: 25000,
        isArchived: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: generateUniqueId('job'),
        title: 'Kostyum',
        pieceRate: 65000,
        isArchived: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];
    await db.jobTypes.bulkPut(defaultJobTypes);
  }

  // Boshlang'ich bir nechta realistik ishchilar
  if (workersCount === 0) {
    const sampleWorkers: Worker[] = [
      {
        id: generateUniqueId('wrk'),
        fullName: 'Dilnoza Karimova',
        phone: '+998 90 123 45 67',
        role: 'Tikuvchi',
        isArchived: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: generateUniqueId('wrk'),
        fullName: 'Mohira Yoqubova',
        phone: '+998 91 234 56 78',
        role: 'Tikuvchi',
        isArchived: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: generateUniqueId('wrk'),
        fullName: 'Rustam Salimov',
        phone: '+998 93 345 67 89',
        role: 'Bichuvchi',
        isArchived: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: generateUniqueId('wrk'),
        fullName: 'Nodira Azimova',
        phone: '+998 94 456 78 90',
        role: 'Dazmolchi',
        isArchived: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: generateUniqueId('wrk'),
        fullName: 'Zilola Ergasheva',
        phone: '+998 97 567 89 01',
        role: 'Tikuvchi',
        isArchived: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: generateUniqueId('wrk'),
        fullName: 'Sanjar Turgʻunov',
        phone: '+998 99 678 90 12',
        role: 'Yordamchi',
        isArchived: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];
    await db.workers.bulkPut(sampleWorkers);
  }
}

/**
 * 500+ ishchini tezlikni sinash uchun generatsiya qilish
 * (Foydalanuvchi sinov maqsadida 500 ta namunaviy ishchi qo'shishi uchun)
 */
export async function generateDemoWorkers(targetCount = 500): Promise<number> {
  const ismlar = [
    'Malika', 'Shahlo', 'Nargiza', 'Gulchehra', 'Munisa', 'Feruza', 'Kamola', 'Umida', 
    'Nodira', 'Madina', 'Sarvinoz', 'Goʻzal', 'Zuhra', 'Fotima', 'Rayhon', 'Laylo',
    'Jasur', 'Akmal', 'Botir', 'Bobur', 'Alisher', 'Otabek', 'Sherzod', 'Aziz'
  ];
  const familiyalar = [
    'Aliyeva', 'Karimova', 'Saidova', 'Rahimova', 'Yusupova', 'Ismoilova', 'Mirzayeva', 
    'Toʻxtayeva', 'Nazarova', 'Qosimova', 'Vohidova', 'Sodiqova', 'Ahmedova', 'Umarova'
  ];
  const rollar: WorkerRole[] = ['Tikuvchi', 'Tikuvchi', 'Tikuvchi', 'Bichuvchi', 'Dazmolchi', 'Yordamchi'];

  const now = new Date().toISOString();
  const bulkWorkers: Worker[] = [];

  for (let i = 1; i <= targetCount; i++) {
    const ism = ismlar[Math.floor(Math.random() * ismlar.length)];
    const familiya = familiyalar[Math.floor(Math.random() * familiyalar.length)];
    const rol = rollar[Math.floor(Math.random() * rollar.length)];
    const suffix = i <= 9 ? `00${i}` : i <= 99 ? `0${i}` : `${i}`;
    
    // Telefon raqami
    const phone = `+998 90 ${(100 + (i % 900)).toString()} ${suffix.substring(0, 2)} ${suffix.substring(1, 3)}`;

    bulkWorkers.push({
      id: generateUniqueId(`bulk_${i}`),
      fullName: `${ism} ${familiya} (#${i})`,
      phone,
      role: rol,
      isArchived: false,
      createdAt: now,
      updatedAt: now,
    });
  }

  await db.workers.bulkPut(bulkWorkers);
  return bulkWorkers.length;
}

/**
 * Barcha ma'lumotlarni tozalash (faqat sinovdan keyin qayta tiklash uchun)
 */
export async function clearAllDatabase(): Promise<void> {
  await db.workers.clear();
  await db.attendance.clear();
  await db.shiftRates.clear();
  await db.jobTypes.clear();
  await seedInitialDataIfEmpty();
}
