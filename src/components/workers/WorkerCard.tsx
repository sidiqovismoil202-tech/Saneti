/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Phone, Edit3, Archive, RotateCcw, User } from 'lucide-react';
import type { Worker, WorkerRole } from '../../types';

interface WorkerCardProps {
  worker: Worker;
  onEdit: (worker: Worker) => void;
  onArchive: (worker: Worker) => void;
  onRestore?: (worker: Worker) => void;
  isArchivedView?: boolean;
}

// Lavozimlarga mos rang va belgilar
const ROLE_BADGES: Record<WorkerRole, { bg: string; text: string; border: string }> = {
  Tikuvchi: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  Bichuvchi: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  Dazmolchi: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  Yordamchi: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
};

export const WorkerCard = React.memo<WorkerCardProps>(({
  worker,
  onEdit,
  onArchive,
  onRestore,
  isArchivedView = false,
}) => {
  const roleStyle = ROLE_BADGES[worker.role] || {
    bg: 'bg-slate-50',
    text: 'text-slate-700',
    border: 'border-slate-200',
  };

  return (
    <div className={`p-4 rounded-2xl bg-white border shadow-xs transition hover:shadow-md ${
      isArchivedView ? 'border-slate-200 opacity-75 bg-slate-50/50' : 'border-slate-200/80'
    }`}>
      <div className="flex items-start justify-between gap-3">
        {/* Chap qism: Ishchi ma'lumotlari */}
        <div className="flex items-start gap-3 min-w-0">
          <div className="w-11 h-11 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center shrink-0 mt-0.5">
            <User className="w-5 h-5" />
          </div>

          <div className="min-w-0">
            <h4 className="text-base font-bold text-slate-900 truncate">
              {worker.fullName}
            </h4>

            {/* Telefon raqami */}
            {worker.phone ? (
              <a
                href={`tel:${worker.phone.replace(/\s+/g, '')}`}
                className="inline-flex items-center gap-1.5 text-xs text-slate-600 hover:text-indigo-600 mt-0.5 font-medium"
              >
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                <span>{worker.phone}</span>
              </a>
            ) : (
              <span className="text-xs text-slate-400 italic block mt-0.5">
                Telefon kiritilmagan
              </span>
            )}

            {/* Lavozim nishoni */}
            <div className="mt-2">
              <span className={`inline-block px-2.5 py-0.5 text-xs font-semibold rounded-md border ${roleStyle.bg} ${roleStyle.text} ${roleStyle.border}`}>
                {worker.role}
              </span>
            </div>
          </div>
        </div>

        {/* O'ng qism: Amallar tugmalari */}
        <div className="flex items-center gap-1 shrink-0">
          {!isArchivedView ? (
            <>
              <button
                type="button"
                onClick={() => onEdit(worker)}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center p-2 rounded-xl text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition"
                title="Tahrirlash"
                aria-label="Tahrirlash"
              >
                <Edit3 className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => onArchive(worker)}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                title="O'chirish (Arxivlash)"
                aria-label="O'chirish"
              >
                <Archive className="w-4 h-4" />
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => onRestore && onRestore(worker)}
              className="min-h-[44px] px-3 py-2 flex items-center gap-1.5 rounded-xl text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition text-xs font-semibold"
              title="Faollarga qaytarish"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Qaytarish</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
});

WorkerCard.displayName = 'WorkerCard';
