/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import { Search, UserPlus, Users, Archive, Filter, ChevronDown, CheckCircle2 } from 'lucide-react';
import type { Worker, WorkerRole } from '../../types';
import { WorkerCard } from './WorkerCard';
import { WorkerModal } from './WorkerModal';
import { ConfirmModal } from '../common/ConfirmModal';
import { useToast } from '../common/Toast';
import { saveWorker, toggleArchiveWorker } from '../../storage';

interface WorkerListProps {
  workers: Worker[];
  onRefresh: () => Promise<void>;
}

const ITEMS_PER_PAGE = 50;

export const WorkerList: React.FC<WorkerListProps> = ({ workers, onRefresh }) => {
  const { showToast } = useToast();

  // Holatlar
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [workerToEdit, setWorkerToEdit] = useState<Worker | null>(null);
  const [workerToArchive, setWorkerToArchive] = useState<Worker | null>(null);
  
  // Qidiruv va filtrlar
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [showArchived, setShowArchived] = useState(false);

  // Sahifalash (500+ ishchi uchun)
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);

  // 300 ms debounce qidiruv uchun
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setVisibleCount(ITEMS_PER_PAGE); // Qidiruv o'zgarganda birinchi sahifaga qaytish
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Faollar va arxivlanganlar
  const activeWorkers = useMemo(() => workers.filter(w => !w.isArchived), [workers]);
  const archivedWorkers = useMemo(() => workers.filter(w => w.isArchived), [workers]);

  // Hozirgi tanlangan rejimdagi ishchilar ro'yxati
  const targetList = showArchived ? archivedWorkers : activeWorkers;

  // Qidiruv va rol bo'yicha filtrlash
  const filteredWorkers = useMemo(() => {
    const cleanSearch = debouncedSearch.toLowerCase().trim();
    return targetList.filter(w => {
      const matchSearch =
        !cleanSearch ||
        w.fullName.toLowerCase().includes(cleanSearch) ||
        (w.phone && w.phone.includes(cleanSearch));

      const matchRole = selectedRole === 'all' || w.role === selectedRole;

      return matchSearch && matchRole;
    });
  }, [targetList, debouncedSearch, selectedRole]);

  // Sahifalangan qism
  const paginatedWorkers = useMemo(() => {
    return filteredWorkers.slice(0, visibleCount);
  }, [filteredWorkers, visibleCount]);

  // Ishchini saqlash (qo'shish yoki tahrirlash)
  const handleSaveWorker = async (workerData: { id?: string; fullName: string; phone: string; role: WorkerRole }) => {
    try {
      await saveWorker({
        id: workerData.id || '',
        fullName: workerData.fullName,
        phone: workerData.phone,
        role: workerData.role,
        isArchived: false,
      });
      showToast(workerData.id ? "Ishchi ma'lumotlari yangilandi" : "Yangi ishchi qo'shildi", 'success');
      await onRefresh();
    } catch {
      showToast("Ma'lumotni saqlab bo'lmadi. Qaytadan urinib ko'ring.", 'error');
      throw new Error();
    }
  };

  // Ishchini arxivlash (o'chirish)
  const handleConfirmArchive = async () => {
    if (!workerToArchive) return;
    try {
      await toggleArchiveWorker(workerToArchive.id, true);
      showToast(`${workerToArchive.fullName} arxivga o'tkazildi`, 'info');
      setWorkerToArchive(null);
      await onRefresh();
    } catch {
      showToast("Ma'lumotni saqlab bo'lmadi. Qaytadan urinib ko'ring.", 'error');
    }
  };

  // Ishchini arxivdan qaytarish
  const handleRestoreWorker = async (worker: Worker) => {
    try {
      await toggleArchiveWorker(worker.id, false);
      showToast(`${worker.fullName} faol ishchilar ro'yxatiga qaytarildi`, 'success');
      await onRefresh();
    } catch {
      showToast("Ma'lumotni saqlab bo'lmadi. Qaytadan urinib ko'ring.", 'error');
    }
  };

  return (
    <div className="pb-24 pt-4 px-4 max-w-3xl mx-auto">
      {/* 1. Yuqori sarlavha va Umumiy hisob */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-extrabold text-slate-900">
              {showArchived ? "Arxivdagi ishchilar" : "Ishchilar ro'yxati"}
            </h2>
            <span className="bg-indigo-100 text-indigo-800 text-xs font-bold px-2.5 py-0.5 rounded-full border border-indigo-200">
              Jami: {showArchived ? archivedWorkers.length : activeWorkers.length} ta
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Sexdagi barcha xodimlarni boshqarish
          </p>
        </div>

        {/* Yangi ishchi qo'shish tugmasi */}
        <button
          type="button"
          onClick={() => {
            setWorkerToEdit(null);
            setIsModalOpen(true);
          }}
          className="min-h-[48px] px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold shadow-md shadow-indigo-200 transition flex items-center justify-center gap-2 text-base shrink-0"
        >
          <UserPlus className="w-5 h-5" />
          <span>+ Ishchi qo'shish</span>
        </button>
      </div>

      {/* 2. Arxiv va Faollar o'rtasida o'tish tablari */}
      <div className="flex gap-2 mb-4 p-1 bg-slate-200/70 rounded-xl">
        <button
          type="button"
          onClick={() => {
            setShowArchived(false);
            setVisibleCount(ITEMS_PER_PAGE);
          }}
          className={`flex-1 min-h-[44px] rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition ${
            !showArchived ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Faol ishchilar ({activeWorkers.length})</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setShowArchived(true);
            setVisibleCount(ITEMS_PER_PAGE);
          }}
          className={`flex-1 min-h-[44px] rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition ${
            showArchived ? 'bg-white text-rose-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Archive className="w-4 h-4" />
          <span>Arxivdagilar ({archivedWorkers.length})</span>
        </button>
      </div>

      {/* 3. Qidiruv va Lavozim bo'yicha filtrlar */}
      <div className="space-y-2.5 mb-5 bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs">
        {/* Qidiruv maydoni (300ms debounce) */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search className="h-5 w-5" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Ism yoki telefon bo'yicha qidiruv..."
            className="w-full min-h-[48px] pl-11 pr-4 rounded-xl border border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 text-base"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-xs font-semibold text-slate-400 hover:text-slate-600"
            >
              Tozalash
            </button>
          )}
        </div>

        {/* Lavozim bo'yicha tezkor tugmalar */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 no-scrollbar text-xs font-semibold">
          <div className="flex items-center gap-1 text-slate-400 pr-1 pl-1">
            <Filter className="w-3.5 h-3.5" />
          </div>
          {[
            { id: 'all', label: 'Barchasi' },
            { id: 'Tikuvchi', label: 'Tikuvchilar' },
            { id: 'Bichuvchi', label: 'Bichuvchilar' },
            { id: 'Dazmolchi', label: 'Dazmolchilar' },
            { id: 'Yordamchi', label: 'Yordamchilar' },
          ].map(f => (
            <button
              key={f.id}
              type="button"
              onClick={() => setSelectedRole(f.id)}
              className={`min-h-[38px] px-3.5 py-1.5 rounded-xl whitespace-nowrap transition ${
                selectedRole === f.id
                  ? 'bg-slate-900 text-white font-bold'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* 4. Ro'yxat yoki Bo'sh holat */}
      {filteredWorkers.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center shadow-xs">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 text-slate-400 mx-auto flex items-center justify-center mb-3">
            <Users className="w-8 h-8" />
          </div>
          {searchTerm || selectedRole !== 'all' ? (
            <>
              <h3 className="text-base font-bold text-slate-800">
                Qidiruv bo'yicha ishchi topilmadi
              </h3>
              <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                Qidiruv so'zini yoki tanlangan lavozim filtrini o'zgartirib ko'ring
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('');
                  setSelectedRole('all');
                }}
                className="mt-4 px-4 py-2 min-h-[40px] text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition"
              >
                Filtrlarni bekor qilish
              </button>
            </>
          ) : showArchived ? (
            <>
              <h3 className="text-base font-bold text-slate-800">
                Arxivda ishchilar yo'q
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                O'chirilgan ishchilar shu yerda saqlanadi
              </p>
            </>
          ) : (
            <>
              <h3 className="text-base font-bold text-slate-800">
                Hozircha ishchilar yo'q. Birinchi ishchini qo'shing.
              </h3>
              <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                Tugmani bosib sexingizning birinchi ishchisini ro'yxatga kiriting
              </p>
              <button
                type="button"
                onClick={() => {
                  setWorkerToEdit(null);
                  setIsModalOpen(true);
                }}
                className="mt-4 px-5 py-2.5 min-h-[48px] rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition inline-flex items-center gap-2"
              >
                <UserPlus className="w-4 h-4" />
                <span>+ Ishchi qo'shish</span>
              </button>
            </>
          )}
        </div>
      ) : (
        <div className="space-y-2.5">
          {paginatedWorkers.map(worker => (
            <WorkerCard
              key={worker.id}
              worker={worker}
              isArchivedView={showArchived}
              onEdit={(w) => {
                setWorkerToEdit(w);
                setIsModalOpen(true);
              }}
              onArchive={(w) => setWorkerToArchive(w)}
              onRestore={handleRestoreWorker}
            />
          ))}

          {/* Sahifalash: Yana 50 ta ko'rsatish */}
          {visibleCount < filteredWorkers.length && (
            <div className="pt-3 text-center">
              <button
                type="button"
                onClick={() => setVisibleCount(prev => prev + ITEMS_PER_PAGE)}
                className="w-full min-h-[50px] bg-white border border-slate-300 hover:bg-slate-50 active:bg-slate-100 text-slate-800 font-bold rounded-2xl shadow-xs transition flex items-center justify-center gap-2 text-sm"
              >
                <ChevronDown className="w-4 h-4" />
                <span>
                  Yana ko'rsatish ({filteredWorkers.length - visibleCount} ta qoldi)
                </span>
              </button>
              <p className="text-[11px] text-slate-400 mt-2">
                Ko'rsatilmoqda: {visibleCount} / {filteredWorkers.length} ta
              </p>
            </div>
          )}
        </div>
      )}

      {/* Ishchi qo'shish / tahrirlash modali */}
      <WorkerModal
        isOpen={isModalOpen}
        workerToEdit={workerToEdit}
        onClose={() => {
          setIsModalOpen(false);
          setWorkerToEdit(null);
        }}
        onSave={handleSaveWorker}
      />

      {/* O'chirish (Arxivlash) tasdiqlash modali */}
      <ConfirmModal
        isOpen={Boolean(workerToArchive)}
        title="Ishchini o'chirish"
        message={`Rostdan ham "${workerToArchive?.fullName}"ni o'chirmoqchimisiz? Ishchi arxivga o'tkaziladi, eski hisob-kitoblar va davomat saqlanib qoladi.`}
        confirmLabel="Ha, o'chirish"
        cancelLabel="Yo'q"
        isDestructive={true}
        onConfirm={handleConfirmArchive}
        onCancel={() => setWorkerToArchive(null)}
      />
    </div>
  );
};
