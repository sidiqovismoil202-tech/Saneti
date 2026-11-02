/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Scissors, LogOut } from 'lucide-react';
import { ConfirmModal } from './ConfirmModal';

interface HeaderProps {
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onLogout }) => {
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between">
          {/* Logo va Sex nomi */}
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-sm">
              <Scissors className="w-5 h-5 -rotate-45" />
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-900 leading-tight">
                Chevar Sexi
              </h1>
              <p className="text-xs text-indigo-600 font-medium">
                Ishchilar hisobi tizimi
              </p>
            </div>
          </div>

          {/* Chiqish tugmasi */}
          <button
            type="button"
            onClick={() => setShowLogoutConfirm(true)}
            className="min-h-[44px] px-3 py-2 rounded-xl text-slate-600 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 transition flex items-center gap-1.5 text-xs font-semibold"
            title="Tizimdan chiqish"
          >
            <LogOut className="w-4 h-4 text-slate-500" />
            <span className="hidden xs:inline">Chiqish</span>
          </button>
        </div>
      </header>

      {/* Chiqishni tasdiqlash modali */}
      <ConfirmModal
        isOpen={showLogoutConfirm}
        title="Tizimdan chiqish"
        message="Rostdan ham tizimdan chiqmoqchimisiz? Qayta kirish uchun parol kiritiladi."
        confirmLabel="Chiqish"
        cancelLabel="Bekor qilish"
        isDestructive={false}
        onConfirm={() => {
          setShowLogoutConfirm(false);
          onLogout();
        }}
        onCancel={() => setShowLogoutConfirm(false)}
      />
    </>
  );
};
