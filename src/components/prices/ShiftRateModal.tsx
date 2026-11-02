/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { X, Calendar, DollarSign } from 'lucide-react';
import { formatNumberWithSpaces, parseRawNumber, formatCurrency } from '../../utils/format';
import { getTashkentTodayString } from '../../utils/date';

interface ShiftRateModalProps {
  isOpen: boolean;
  currentRate: number;
  onClose: () => void;
  onSave: (effectiveDate: string, rate: number) => Promise<void>;
}

export const ShiftRateModal: React.FC<ShiftRateModalProps> = ({
  isOpen,
  currentRate,
  onClose,
  onSave,
}) => {
  const [rateInput, setRateInput] = useState(() => (currentRate > 0 ? String(currentRate) : '120000'));
  const [effectiveDate, setEffectiveDate] = useState(() => getTashkentTodayString());
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleRateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value.replace(/\D/g, '');
    setRateInput(rawVal);
    if (error) setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numericRate = parseRawNumber(rateInput);

    if (numericRate <= 0) {
      setError("Narx 0 dan katta bo'lishi kerak");
      return;
    }

    if (!effectiveDate) {
      setError("Iltimos, amal qilish boshlanish sanasini tanlang");
      return;
    }

    try {
      setIsSubmitting(true);
      await onSave(effectiveDate, numericRate);
      onClose();
    } catch {
      // Xatolik ota komponentda useToast orqali ko'rsatiladi
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
            Yangi smena narxi belgilash
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
          {/* Smena narxi */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              Bir kunlik (smena) narxi (so'mda) <span className="text-rose-500">*</span>
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
                placeholder="120 000"
                className={`block w-full min-h-[48px] pl-11 pr-16 rounded-xl border text-slate-900 font-bold text-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 ${
                  error ? 'border-rose-400 bg-rose-50/30' : 'border-slate-300'
                }`}
              />
              <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-xs font-bold text-slate-400">
                so'm
              </div>
            </div>
            {error && (
              <p className="mt-1.5 text-xs text-rose-600 font-medium">
                {error}
              </p>
            )}
            <p className="mt-1 text-xs text-slate-400">
              Masalan: 120 000 yoki 150 000 so'm
            </p>
          </div>

          {/* Qaysi sanadan boshlab amal qiladi */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              Qaysi sanadan boshlab amal qiladi? <span className="text-rose-500">*</span>
            </label>
            <div className="relative rounded-xl">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Calendar className="h-5 w-5" />
              </div>
              <input
                type="date"
                required
                value={effectiveDate}
                onChange={(e) => setEffectiveDate(e.target.value)}
                className="block w-full min-h-[48px] pl-11 pr-4 rounded-xl border border-slate-300 text-slate-900 text-base focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <p className="mt-1.5 text-xs text-slate-500">
              Eski oylar va kunlar o'sha davrdagi eski narx bilan hisob-kitob qilinadi.
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
