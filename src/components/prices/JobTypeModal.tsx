/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { X, Tag, DollarSign } from 'lucide-react';
import type { JobType } from '../../types';
import { formatNumberWithSpaces, parseRawNumber } from '../../utils/format';

interface JobTypeModalProps {
  isOpen: boolean;
  jobTypeToEdit: JobType | null;
  onClose: () => void;
  onSave: (data: { id?: string; title: string; pieceRate: number }) => Promise<void>;
}

export const JobTypeModal: React.FC<JobTypeModalProps> = ({
  isOpen,
  jobTypeToEdit,
  onClose,
  onSave,
}) => {
  const [title, setTitle] = useState('');
  const [rateInput, setRateInput] = useState('');
  const [titleError, setTitleError] = useState('');
  const [rateError, setRateError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (jobTypeToEdit) {
      setTitle(jobTypeToEdit.title);
      setRateInput(String(jobTypeToEdit.pieceRate));
    } else {
      setTitle('');
      setRateInput('15000');
    }
    setTitleError('');
    setRateError('');
  }, [jobTypeToEdit, isOpen]);

  if (!isOpen) return null;

  const handleRateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value.replace(/\D/g, '');
    setRateInput(rawVal);
    if (rateError) setRateError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const cleanTitle = title.trim();
    if (!cleanTitle) {
      setTitleError("Iltimos, ish turi nomini kiriting");
      return;
    }

    const numericRate = parseRawNumber(rateInput);
    if (numericRate <= 0) {
      setRateError("Narx 0 dan katta bo'lishi kerak");
      return;
    }

    try {
      setIsSubmitting(true);
      await onSave({
        id: jobTypeToEdit ? jobTypeToEdit.id : undefined,
        title: cleanTitle,
        pieceRate: numericRate,
      });
      onClose();
    } catch {
      // Xatolik useToast orqali ota komponentda ko'rsatiladi
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden"
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h3 className="text-lg font-bold text-slate-900">
            {jobTypeToEdit ? "Ish turini tahrirlash" : "+ Yangi ish turi qo'shish"}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Ish turi nomi */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              Ish turi nomi <span className="text-rose-500">*</span>
            </label>
            <div className="relative rounded-xl">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Tag className="h-5 w-5" />
              </div>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  if (titleError) setTitleError('');
                }}
                placeholder="Masalan: Ko'ylak, Shim, Kurtka, Nimcha"
                className={`block w-full min-h-[48px] pl-11 pr-4 rounded-xl border text-slate-900 placeholder-slate-400 text-base focus:outline-hidden focus:ring-2 focus:ring-indigo-500 ${
                  titleError ? 'border-rose-400 bg-rose-50/30' : 'border-slate-300'
                }`}
              />
            </div>
            {titleError && (
              <p className="mt-1.5 text-xs text-rose-600 font-medium">
                {titleError}
              </p>
            )}
          </div>

          {/* 1 dona uchun narx */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              Bitta dona uchun narx (so'mda) <span className="text-rose-500">*</span>
            </label>
            <div className="relative rounded-xl">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <DollarSign className="h-5 w-5" />
              </div>
              <input
                type="text"
                inputMode="numeric"
                required
                value={formatNumberWithSpaces(rateInput)}
                onChange={handleRateChange}
                placeholder="15 000"
                className={`block w-full min-h-[48px] pl-11 pr-16 rounded-xl border text-slate-900 font-bold text-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 ${
                  rateError ? 'border-rose-400 bg-rose-50/30' : 'border-slate-300'
                }`}
              />
              <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-xs font-bold text-slate-400">
                so'm
              </div>
            </div>
            {rateError && (
              <p className="mt-1.5 text-xs text-rose-600 font-medium">
                {rateError}
              </p>
            )}
            <p className="mt-1 text-xs text-slate-400">
              Ishchi tikkan har bir dona uchun hisoblanadigan summa
            </p>
          </div>

          {/* Tugmalar */}
          <div className="pt-2 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="w-1/2 min-h-[48px] px-4 rounded-xl border border-slate-300 bg-white text-slate-700 font-semibold hover:bg-slate-100 transition text-base flex items-center justify-center"
            >
              Bekor qilish
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-1/2 min-h-[48px] px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition text-base shadow-sm flex items-center justify-center disabled:opacity-50"
            >
              {isSubmitting ? "Saqlanmoqda..." : "Saqlash"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
