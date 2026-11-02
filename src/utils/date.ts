/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// O'zbekcha oy nomlari (Lotin yozuvida)
export const UZBEK_MONTHS = [
  'Yanvar',
  'Fevral',
  'Mart',
  'Aprel',
  'May',
  'Iyun',
  'Iyul',
  'Avgust',
  'Sentabr',
  'Oktabr',
  'Noyabr',
  'Dekabr',
];

// O'zbekcha hafta kunlari nomlari
export const UZBEK_WEEKDAYS = [
  'Yakshanba',
  'Dushanba',
  'Seshanba',
  'Chorshanba',
  'Payshanba',
  'Juma',
  'Shanba',
];

/**
 * Toshkent (UTC+5) vaqti bo'yicha bugungi sanani YYYY-MM-DD ko'rinishida qaytaradi.
 * new Date().toISOString() ishlatilmaydi!
 */
export function getTashkentTodayString(): string {
  // Toshkent vaqti bo'yicha sana komponentlarini olish
  const now = new Date();
  
  // Formatlash parametrlari (Asia/Tashkent vaqt mintaqasi)
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Tashkent',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  
  const parts = formatter.formatToParts(now);
  let year = '';
  let month = '';
  let day = '';

  for (const part of parts) {
    if (part.type === 'year') year = part.value;
    if (part.type === 'month') month = part.value;
    if (part.type === 'day') day = part.value;
  }

  // Agar biron sababga ko'ra Intl ishlamasa, mahalliy vaqt komponentlarini olish
  if (!year || !month || !day) {
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  return `${year}-${month}-${day}`;
}

/**
 * Berilgan sanaga kun qo'shish yoki ayirish (+1, -1)
 * @param dateStr 'YYYY-MM-DD'
 * @param days Qo'shiladigan kunlar soni (masalan 1 yoki -1)
 */
export function shiftDays(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  // Mahalliy vaqt bo'yicha Date obyekti yaratish
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + days);

  const resY = date.getFullYear();
  const resM = String(date.getMonth() + 1).padStart(2, '0');
  const resD = String(date.getDate()).padStart(2, '0');

  return `${resY}-${resM}-${resD}`;
}

/**
 * Sanani o'zbekcha chiroyli ko'rinishda chiqarish:
 * Masalan: "2-Noyabr, 2026 (Dushanba)"
 */
export function formatUzbekDisplayDate(dateStr: string): string {
  if (!dateStr || !dateStr.includes('-')) return dateStr;
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  
  const dayNum = d;
  const monthName = UZBEK_MONTHS[m - 1] || '';
  const weekdayName = UZBEK_WEEKDAYS[date.getDay()] || '';

  return `${dayNum}-${monthName}, ${y} (${weekdayName})`;
}

/**
 * Sanani qisqa o'zbekcha ko'rinishda chiqarish:
 * Masalan: "2-Noyabr, 2026"
 */
export function formatShortUzbekDate(dateStr: string): string {
  if (!dateStr || !dateStr.includes('-')) return dateStr;
  const [y, m, d] = dateStr.split('-').map(Number);
  const monthName = UZBEK_MONTHS[m - 1] || '';
  return `${d}-${monthName}, ${y}`;
}
