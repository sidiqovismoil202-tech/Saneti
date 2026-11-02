/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Check, X, Clock, User } from 'lucide-react';
import type { Worker, AttendanceStatus } from '../../types';

interface AttendanceRowProps {
  worker: Worker;
  status: AttendanceStatus | undefined;
  onStatusChange: (workerId: string, newStatus: AttendanceStatus | null) => void;
}

export const AttendanceRow = React.memo<AttendanceRowProps>(({
  worker,
  status,
  onStatusChange,
}) => {
  const isPresent = status === 'keldi';
  const isAbsent = status === 'kelmadi';
  const isHalfDay = status === 'yarim_kun';

  const handleToggle = (clickedStatus: AttendanceStatus) => {
    // Agar allaqachon shu holatda bo'lsa, bosilganda bekor qiladi (null)
    if (status === clickedStatus) {
      onStatusChange(worker.id, null);
    } else {
      onStatusChange(worker.id, clickedStatus);
    }
  };

  return (
    <div className={`p-3.5 rounded-2xl bg-white border transition shadow-xs ${
      status ? 'border-slate-300' : 'border-slate-200/90'
    }`}>
      {/* Ishchi ismi va roli */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
            isPresent ? 'bg-emerald-100 text-emerald-700' :
            isAbsent ? 'bg-rose-100 text-rose-700' :
            isHalfDay ? 'bg-amber-100 text-amber-700' :
            'bg-slate-100 text-slate-500'
          }`}>
            <User className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h4 className="text-sm font-bold text-slate-900 truncate">
              {worker.fullName}
            </h4>
            <span className="text-[11px] text-slate-500 font-medium">
              {worker.role}
            </span>
          </div>
        </div>

        {/* Holat indikatori */}
        <div>
          {isPresent && (
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
              <Check className="w-3 h-3 stroke-[3]" /> Keldi
            </span>
          )}
          {isAbsent && (
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200">
              <X className="w-3 h-3 stroke-[3]" /> Kelmadi
            </span>
          )}
          {isHalfDay && (
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
              <Clock className="w-3 h-3 stroke-[2.5]" /> Yarim kun
            </span>
          )}
          {!status && (
            <span className="text-[11px] font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
              Belgilanmagan
            </span>
          )}
        </div>
      </div>

      {/* 3 ta Katta tugma (balandligi kamida 48px) */}
      <div className="grid grid-cols-3 gap-2">
        {/* 1. Keldi (Yashil) */}
        <button
          type="button"
          onClick={() => handleToggle('keldi')}
          className={`min-h-[48px] rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition active:scale-98 ${
            isPresent
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-200 ring-2 ring-emerald-600 ring-offset-1'
              : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200/80'
          }`}
          aria-pressed={isPresent}
        >
          <Check className="w-4 h-4 stroke-[2.5]" />
          <span>Keldi</span>
        </button>

        {/* 2. Yarim kun (Sariq / Amber) */}
        <button
          type="button"
          onClick={() => handleToggle('yarim_kun')}
          className={`min-h-[48px] rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition active:scale-98 ${
            isHalfDay
              ? 'bg-amber-500 text-white shadow-md shadow-amber-200 ring-2 ring-amber-500 ring-offset-1'
              : 'bg-amber-50 text-amber-900 hover:bg-amber-100 border border-amber-200/80'
          }`}
          aria-pressed={isHalfDay}
        >
          <Clock className="w-4 h-4 stroke-[2.5]" />
          <span>Yarim kun</span>
        </button>

        {/* 3. Kelmadi (Qizil / Rose) */}
        <button
          type="button"
          onClick={() => handleToggle('kelmadi')}
          className={`min-h-[48px] rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition active:scale-98 ${
            isAbsent
              ? 'bg-rose-600 text-white shadow-md shadow-rose-200 ring-2 ring-rose-600 ring-offset-1'
              : 'bg-rose-50 text-rose-800 hover:bg-rose-100 border border-rose-200/80'
          }`}
          aria-pressed={isAbsent}
        >
          <X className="w-4 h-4 stroke-[2.5]" />
          <span>Kelmadi</span>
        </button>
      </div>
    </div>
  );
});

AttendanceRow.displayName = 'AttendanceRow';
