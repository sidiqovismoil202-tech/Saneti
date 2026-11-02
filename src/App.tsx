/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import type { AppTab, Worker } from './types';
import { ToastProvider, useToast } from './components/common/Toast';
import { Header } from './components/common/Header';
import { BottomNav } from './components/common/BottomNav';
import { LoginScreen, checkIsAuthenticated, logoutUser } from './components/auth/LoginScreen';
import { WorkerList } from './components/workers/WorkerList';
import { AttendanceList } from './components/attendance/AttendanceList';
import { PricesView } from './components/prices/PricesView';
import { BackupView } from './components/backup/BackupView';
import { getWorkers, seedInitialDataIfEmpty } from './storage';

function MainApp() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => checkIsAuthenticated());
  const [activeTab, setActiveTab] = useState<AppTab>('workers');
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [isInitializing, setIsInitializing] = useState<boolean>(true);
  const { showToast } = useToast();

  // Boshlang'ich ma'lumotlarni yuklash va bo'sh bo'lsa to'ldirish
  const refreshWorkers = useCallback(async () => {
    try {
      const data = await getWorkers(true); // barcha faollar va arxivdagilar
      setWorkers(data);
    } catch {
      showToast("Ishchilar ro'yxatini yuklab bo'lmadi", 'error');
    }
  }, [showToast]);

  useEffect(() => {
    const initApp = async () => {
      try {
        await seedInitialDataIfEmpty();
        await refreshWorkers();
      } catch (err) {
        console.error('Tizimni yuklashda xatolik:', err);
      } finally {
        setIsInitializing(false);
      }
    };

    initApp();
  }, [refreshWorkers]);

  // Chiqish
  const handleLogout = () => {
    logoutUser();
    setIsAuthenticated(false);
    showToast("Tizimdan chiqildi", 'info');
  };

  // 1-Bo'lim: Parol sahifasi (avtorizatsiyadan o'tmaguncha boshqa narsa ko'rinmaydi)
  if (!isAuthenticated) {
    return <LoginScreen onSuccess={() => setIsAuthenticated(true)} />;
  }

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-3"></div>
        <p className="text-sm font-bold text-slate-700">Tizim yuklanmoqda...</p>
      </div>
    );
  }

  const activeWorkersCount = workers.filter(w => !w.isArchived).length;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col antialiased selection:bg-indigo-500 selection:text-white">
      {/* Yuqori panel */}
      <Header onLogout={handleLogout} />

      {/* Asosiy kontent */}
      <main className="flex-1">
        {activeTab === 'workers' && (
          <WorkerList workers={workers} onRefresh={refreshWorkers} />
        )}

        {activeTab === 'attendance' && (
          <AttendanceList workers={workers} />
        )}

        {activeTab === 'prices' && (
          <PricesView />
        )}

        {activeTab === 'backup' && (
          <BackupView onDataChanged={refreshWorkers} totalWorkers={workers.length} />
        )}
      </main>

      {/* Pastki doimiy navigatsiya paneli */}
      <BottomNav
        activeTab={activeTab}
        onTabChange={setActiveTab}
        workersCount={activeWorkersCount}
      />
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <MainApp />
    </ToastProvider>
  );
}
