/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { X, User, Phone, Briefcase, AlertTriangle } from 'lucide-react';
import type { Worker, WorkerRole } from '../../types';
import { formatPhoneNumber, isValidUzbekPhone } from '../../utils/format';
import { checkDuplicatePhone } from '../../storage';

interface WorkerModalProps {
  isOpen: boolean;
  workerToEdit: Worker | null;
  onClose: () => void;
  onSave: (workerData: { id?: string; fullName: string; phone: string; role: WorkerRole }) => Promise<void>;
}

const ROLES: WorkerRole[] = ['Tikuvchi', 'Bichuvchi', 'Dazmolchi', 'Yordamchi'];

export const WorkerModal: React.FC<WorkerModalProps> = ({
  isOpen,
  workerToEdit,
  onClose,
  onSave,
}) => {
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<WorkerRole>('Tikuvchi');
  const [nameError, setNameError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modal ochilganda yoki tahrirlash obyekti o'zgarganda to'ldirish
  useEffect(() => {
    if (workerToEdit) {
      setFullName(workerToEdit.fullName);
      setPhone(workerToEdit.phone || '');
      setRole(workerToEdit.role);
    } else {
      setFullName('');
      setPhone('');
      setRole('Tikuvchi');
    }
    setNameError('');
    setPhoneError('');
    setDuplicateWarning(null);
  }, [workerToEdit, isOpen]);

  // Telefon raqami o'zgarganda dublikat tekshiruvi (debounced)
  useEffect(() => {
    if (!phone || phone.replace(/\D/g, '').length < 12) {
      setDuplicateWarning(null);
      return;
    }

    const timer = setTimeout(async () => {
      const duplicate = await checkDuplicatePhone(phone, workerToEdit?.id);
      if (duplicate) {
        setDuplicateWarning(`Diqqat! Bu raqam allaqachon "${duplicate.fullName}" (${duplicate.role}) ga biriktirilgan.`);
      } else {
        setDuplicateWarning(null);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [phone, workerToEdit]);

  if (!isOpen) return null;

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setPhone(formatted);
    if (phoneError) setPhoneError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 1. Ism tekshiruvi
    const cleanName = fullName.trim();
    if (!cleanName) {
      setNameError("Iltimos, ishchining ismini kiriting");
      return;
    }
    if (cleanName.length < 2) {
      setNameError("Ism kamida 2 ta harfdan iborat bo'lishi kerak");
      return;
    }

    // 2. Telefon tekshiruvi (agar kiritilgan bo'lsa)
    if (phone && !isValidUzbekPhone(phone)) {
      setPhoneError("Telefon raqamini to'liq kiriting: +998 XX XXX XX XX");
      return;
    }

    try {
      setIsSubmitting(true);
      await onSave({
        id: workerToEdit ? workerToEdit.id : undefined,
        fullName: cleanName,
        phone,
        role,
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
        {/* Modal sarlavhasi */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h3 className="text-lg font-bold text-slate-900">
            {workerToEdit ? "Ishchini tahrirlash" : "+ Yangi ishchi qo'shish"}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
            aria-label="Yopish"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Forma */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Ism-familiya */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              Ism-familiya <span className="text-rose-500">*</span>
            </label>
            <div className="relative rounded-xl">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <User className="h-5 w-5" />
              </div>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => {
                  setFullName(e.target.value);
                  if (nameError) setNameError('');
                }}
                placeholder="Masalan: Dilnoza Karimova"
                className={`block w-full min-h-[48px] pl-11 pr-4 rounded-xl border text-slate-900 placeholder-slate-400 text-base focus:outline-hidden focus:ring-2 focus:ring-indigo-500 ${
                  nameError ? 'border-rose-400 bg-rose-50/30' : 'border-slate-300'
                }`}
              />
            </div>
            {nameError && (
              <p className="mt-1.5 text-xs text-rose-600 font-medium">
                {nameError}
              </p>
            )}
          </div>

          {/* Telefon */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              Telefon raqami <span className="text-slate-400 font-normal text-xs">(majburiy emas)</span>
            </label>
            <div className="relative rounded-xl">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Phone className="h-5 w-5" />
              </div>
              <input
                type="tel"
                value={phone}
                onChange={handlePhoneChange}
                placeholder="+998 90 123 45 67"
                className={`block w-full min-h-[48px] pl-11 pr-4 rounded-xl border text-slate-900 placeholder-slate-400 text-base focus:outline-hidden focus:ring-2 focus:ring-indigo-500 ${
                  phoneError ? 'border-rose-400 bg-rose-50/30' : 'border-slate-300'
                }`}
              />
            </div>
            {phoneError && (
              <p className="mt-1.5 text-xs text-rose-600 font-medium">
                {phoneError}
              </p>
            )}
            {duplicateWarning && (
              <div className="mt-2 flex items-start gap-1.5 text-xs text-amber-700 bg-amber-50 p-2 rounded-lg border border-amber-200">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>{duplicateWarning}</span>
              </div>
            )}
          </div>

          {/* Lavozim tanlash */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              Lavozim <span className="text-rose-500">*</span>
            </label>
            <div className="relative rounded-xl">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Briefcase className="h-5 w-5" />
              </div>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as WorkerRole)}
                className="block w-full min-h-[48px] pl-11 pr-4 rounded-xl border border-slate-300 text-slate-900 text-base focus:outline-hidden focus:ring-2 focus:ring-indigo-500 bg-white"
              >
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Tugmalar */}
          <div className="pt-3 flex gap-3">
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
