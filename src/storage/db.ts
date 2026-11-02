/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import Dexie, { type Table } from 'dexie';
import type { Worker, AttendanceRecord, ShiftRateHistoryItem, JobType } from '../types';

/**
 * Tikuvchilik sexi IndexedDB ma'lumotlar bazasi klassi (Dexie)
 */
export class TailorWorkshopDatabase extends Dexie {
  workers!: Table<Worker, string>;
  attendance!: Table<AttendanceRecord, string>;
  shiftRates!: Table<ShiftRateHistoryItem, string>;
  jobTypes!: Table<JobType, string>;

  constructor() {
    super('ChevarWorkshopDB');
    
    // Versiya va jadval indekslari
    this.version(1).stores({
      workers: 'id, fullName, phone, role, isArchived, createdAt',
      // Davomat: id, date, workerId va birgalikda [date+workerId] noyob indeksi
      attendance: 'id, date, workerId, [date+workerId], status',
      shiftRates: 'id, effectiveDate, createdAt',
      jobTypes: 'id, title, isArchived, createdAt',
    });
  }
}

// Baza nusxasi
export const db = new TailorWorkshopDatabase();
