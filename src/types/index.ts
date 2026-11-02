/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Ishchi lavozimlari
export type WorkerRole = 'Tikuvchi' | 'Bichuvchi' | 'Dazmolchi' | 'Yordamchi';

// Davomat holatlari
export type AttendanceStatus = 'keldi' | 'kelmadi' | 'yarim_kun';

// Ishchi modeli
export interface Worker {
  id: string;
  fullName: string;
  phone: string; // +998 XX XXX XX XX yoki bo'sh
  role: WorkerRole;
  isArchived: boolean;
  createdAt: string; // ISO
  updatedAt: string; // ISO
}

// Davomat yozuvi modeli
export interface AttendanceRecord {
  id: string; // `${date}_${workerId}`
  date: string; // YYYY-MM-DD
  workerId: string;
  status: AttendanceStatus;
  updatedAt: string;
}

// Smena narxi tarixi
export interface ShiftRateHistoryItem {
  id: string;
  rate: number; // so'mda, masalan 120000
  effectiveDate: string; // YYYY-MM-DD - qaysi sanadan boshlab amal qiladi
  createdAt: string;
}

// Ish turi (dona narxi bilan)
export interface JobType {
  id: string;
  title: string; // Ko'ylak, Shim, Kurtka...
  pieceRate: number; // Dona narxi, masalan 15000
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

// Dastur bo'limlari (Tablar)
export type AppTab = 'workers' | 'attendance' | 'prices' | 'backup';
