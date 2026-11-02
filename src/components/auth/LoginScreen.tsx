/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Lock, Eye, EyeOff, Scissors, ShieldAlert } from 'lucide-react';

// ========================================================
// DIQQAT: Tizimga kirish uchun boshlang'ich parol.
// Egasi tomonidan o'zgartirilishi mumkin:
export const MASTER_PASSWORD = '1234'; // <-- BU YERDA PAROLNI O'ZGARTIRING
// ========================================================

const SESSION_KEY = 'chevar_auth_session';
const ATTEMPTS_KEY = 'chevar_failed_attempts';
const LOCKOUT_KEY = 'chevar_lockout_until';

interface LoginScreenProps {
  onSuccess: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onSuccess }) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [failedAttempts, setFailedAttempts] = useState<number>(0);
  const [remainingCooldown, setRemainingCooldown] = useState<number>(0);

  // Saqlangan urinishlar va vaqtinchalik blokirovkanni tekshirish
  useEffect(() => {
    const storedAttempts = parseInt(localStorage.getItem(ATTEMPTS_KEY) || '0', 10);
    setFailedAttempts(storedAttempts);

    const lockoutUntil = parseInt(localStorage.getItem(LOCKOUT_KEY) || '0', 10);
    const now = Date.now();
    if (lockoutUntil > now) {
      setRemainingCooldown(Math.ceil((lockoutUntil - now) / 1000));
    }
  }, []);

  // Blokirovka taymeri (30 soniya)
  useEffect(() => {
    if (remainingCooldown <= 0) return;

    const timer = setInterval(() => {
      setRemainingCooldown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          localStorage.removeItem(LOCKOUT_KEY);
          localStorage.setItem(ATTEMPTS_KEY, '0');
          setFailedAttempts(0);
          setErrorMessage('');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [remainingCooldown]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (remainingCooldown > 0) return;

    if (password === MASTER_PASSWORD) {
      // To'g'ri parol kiritildi
      sessionStorage.setItem(SESSION_KEY, 'authenticated');
      localStorage.removeItem(ATTEMPTS_KEY);
      localStorage.removeItem(LOCKOUT_KEY);
      setErrorMessage('');
      onSuccess();
    } else {
      // Noto'g'ri parol
      const newAttempts = failedAttempts + 1;
      setFailedAttempts(newAttempts);
      localStorage.setItem(ATTEMPTS_KEY, String(newAttempts));

      if (newAttempts >= 5) {
        // 5 marta xato kiritilsa - 30 soniyalik cheklov
        const lockoutTime = Date.now() + 30 * 1000;
        localStorage.setItem(LOCKOUT_KEY, String(lockoutTime));
        setRemainingCooldown(30);
        setErrorMessage("5 marta xato kiritildi. Xavfsizlik yuzasidan 30 soniya kuting.");
      } else {
        setErrorMessage("Parol noto'g'ri. Qaytadan urinib ko'ring.");
      }
      setPassword('');
    }
  };

  const isLocked = remainingCooldown > 0;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center mb-3">
          <div className="w-16 h-16 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md">
            <Scissors className="w-8 h-8 -rotate-45" />
          </div>
        </div>
        <h2 className="text-center text-2xl font-extrabold text-slate-900 tracking-tight">
          Chevar Sexi
        </h2>
        <p className="mt-1 text-center text-sm text-slate-600">
          Ishchilar hisobi va boshqaruv tizimi
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-xl rounded-2xl border border-slate-100 sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label 
                htmlFor="password" 
                className="block text-sm font-semibold text-slate-700 mb-2"
              >
                Kirish paroli
              </label>
              
              <div className="relative rounded-xl">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="h-5 w-5" />
                </div>
                
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  disabled={isLocked}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errorMessage && !isLocked) setErrorMessage('');
                  }}
                  placeholder="Parolni kiriting (standart: 1234)"
                  className="block w-full min-h-[48px] pl-11 pr-12 rounded-xl border border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-base disabled:bg-slate-100 disabled:cursor-not-allowed"
                />

                <button
                  type="button"
                  disabled={isLocked}
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 min-h-[48px] min-w-[48px] justify-center transition"
                  aria-label={showPassword ? "Parolni yashirish" : "Parolni ko'rsatish"}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>

              {/* Xatolik xabari yoki vaqt cheklovi */}
              {errorMessage && (
                <div className="mt-2.5 flex items-start gap-2 text-sm text-rose-600 bg-rose-50 p-2.5 rounded-lg border border-rose-100 animate-in fade-in">
                  <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Kutish taymeri */}
              {isLocked && (
                <div className="mt-2.5 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-center font-medium text-sm">
                  Iltimos, kuting: <span className="font-bold text-base text-amber-900">{remainingCooldown}</span> soniya
                </div>
              )}
            </div>

            <div>
              <button
                type="submit"
                disabled={isLocked || !password.trim()}
                className="w-full min-h-[48px] flex justify-center items-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-base font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 focus:outline-hidden focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Tizimga kirish
              </button>
            </div>
          </form>

          <div className="mt-6 pt-4 border-t border-slate-100 text-center">
            <span className="text-xs text-slate-400">
              Standart parol: <span className="font-mono font-semibold text-slate-600">1234</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export function checkIsAuthenticated(): boolean {
  return sessionStorage.getItem(SESSION_KEY) === 'authenticated';
}

export function logoutUser(): void {
  sessionStorage.removeItem(SESSION_KEY);
}
