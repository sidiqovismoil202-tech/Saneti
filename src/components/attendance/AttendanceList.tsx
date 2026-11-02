/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Search,
  CheckCircle,
  Users,
  CheckCheck,
  ChevronDown,
} from 'lucide-react';
import type { Worker, AttendanceStatus } from '../../types';
import { AttendanceRow } from './AttendanceRow';
import { ConfirmModal } from '../common/ConfirmModal';
import { useToast } from '../common/Toast';
import {
  getTashkentTodayString,
  shiftDays,
  formatUzbekDisplayDate,
} from '../../utils/date';
import {
  getAttendanceForDate,
  setWorkerAttendance,
  bulkSetAttendancePresent,
} from '../../storage';

interface AttendanceListProps {
  workers: Worker[];
}

const ITEMS_PER_PAGE = 50;

export const AttendanceList: React.FC<AttendanceListProps> = ({ workers }) => {
  const { showToast } = useToast();

  // Tanlangan sana (boshlang'ich: bugungi kun Toshkent vaqti)
  const [selectedDate, setSelectedDate] = useState<string>(() => getTashkentTodayString());
  
  // O'sha kun uchun bazadan olingan davomat xaritasi: { [workerId]: 'keldi' | 'kelmadi' | 'yarim_kun' }
  const [attendanceMap, setAttendanceMap] = useState<Record<string, AttendanceStatus>>({});
  const [isLoading, setIsLoading] = useState(true);

  // Qidiruv va filtrlar
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [onlyUnassigned, setOnlyUnassigned] = useState(false);

  // Ommaviy tasdiqlash modali
  const [showBulkModal, setShowBulkModal] = useState(false);

  // Sahifalash (500+ ishchi uchun)
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);

  // 300ms qidiruv debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setVisibleCount(ITEMS_PER_PAGE);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Faol ishchilar (arxivlanganlar davomat olish ro'yxatida chiqmaydi)
  const activeWorkers = useMemo(() => {
    return workers.filter(w => !w.isArchived);
  }, [workers]);

  // Tanlangan sana bo'yicha davomat ma'lumotlarini yuklash
  const loadAttendance = useCallback(async (dateStr: string) => {
    try {
      setIsLoading(true);
      const data = await getAttendanceForDate(dateStr);
      setAttendanceMap(data);
    } catch {
      showToast("Davomat ma'lumotlarini yuklab bo'lmadi", 'error');
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadAttendance(selectedDate);
  }, [selectedDate, loadAttendance]);

  // Sana o'zgartirish funksiyalari
  const handlePrevDay = () => {
    setSelectedDate(prev => shiftDays(prev, -1));
  };

  const handleNextDay = () => {
    setSelectedDate(prev => shiftDays(prev, 1));
  };

  const handleGoToday = () => {
    setSelectedDate(getTashkentTodayString());
  };

  // Davomat holatini o'zgartirish (Optimistik yangilanish + darhol IndexedDB ga yozish)
  const handleStatusChange = useCallback(async (workerId: string, newStatus: AttendanceStatus | null) => {
    // 1. Oldingi holatni xotirada saqlab qo'yamiz (xatolik bo'lsa qaytarish uchun)
    const previousStatus = attendanceMap[workerId];

    // 2. Optimistik ravishda ekranni yangilaymiz
    setAttendanceMap(prev => {
      const next = { ...prev };
      if (newStatus === null) {
        delete next[workerId];
      } else {
        next[workerId] = newStatus;
      }
      return next;
    });

    // 3. Bazaga saqlaymiz
    try {
      await setWorkerAttendance(selectedDate, workerId, newStatus);
    } catch {
      // Xatolik yuz bersa orqaga qaytarish
      setAttendanceMap(prev => {
        const rollback = { ...prev };
        if (previousStatus === undefined) {
          delete rollback[workerId];
        } else {
          rollback[workerId] = previousStatus;
        }
        return rollback;
      });
      showToast("Ma'lumotni saqlab bo'lmadi. Qaytadan urinib ko'ring.", 'error');
    }
  }, [attendanceMap, selectedDate, showToast]);

  // Statistik xulosa hisoblash: Keldi, Kelmadi, Yarim kun, Belgilanmagan
  const stats = useMemo(() => {
    let keldi = 0;
    let kelmadi = 0;
    let yarimKun = 0;
    let unassigned = 0;

    for (const w of activeWorkers) {
      const s = attendanceMap[w.id];
      if (s === 'keldi') keldi++;
      else if (s === 'kelmadi') kelmadi++;
      else if (s === 'yarim_kun') yarimKun++;
      else unassigned++;
    }

    return { keldi, kelmadi, yarimKun, unassigned, total: activeWorkers.length };
  }, [activeWorkers, attendanceMap]);

  // Belgilanmagan ishchilar ro'yxati (ommaviy belgilash uchun)
  const unassignedWorkerIds = useMemo(() => {
    return activeWorkers
      .filter(w => !attendanceMap[w.id])
      .map(w => w.id);
  }, [activeWorkers, attendanceMap]);

  // Ommaviy "Keldi" deb belgilashni amalga oshirish
  const handleConfirmBulkPresent = async () => {
    setShowBulkModal(false);
    if (unassignedWorkerIds.length === 0) return;

    // Optimistik yangilash
    const updatedMap = { ...attendanceMap };
    for (const id of unassignedWorkerIds) {
      updatedMap[id] = 'keldi';
    }
    setAttendanceMap(updatedMap);

    try {
      await bulkSetAttendancePresent(selectedDate, unassignedWorkerIds);
      showToast(`${unassignedWorkerIds.length} ta ishchiga "Keldi" belgisi qo'yildi`, 'success');
    } catch {
      // Baza yangilanmadi, qaytadan yuklaymiz
      await loadAttendance(selectedDate);
      showToast("Ma'lumotni saqlab bo'lmadi. Qaytadan urinib ko'ring.", 'error');
    }
  };

  // Filtrlangan ro'yxat
  const filteredWorkers = useMemo(() => {
    const cleanSearch = debouncedSearch.toLowerCase().trim();
    return activeWorkers.filter(w => {
      const matchSearch =
        !cleanSearch ||
        w.fullName.toLowerCase().includes(cleanSearch) ||
        (w.phone && w.phone.includes(cleanSearch));

      const matchRole = selectedRole === 'all' || w.role === selectedRole;

      const isUnassigned = !attendanceMap[w.id];
      const matchUnassigned = !onlyUnassigned || isUnassigned;

      return matchSearch && matchRole && matchUnassigned;
    });
  }, [activeWorkers, debouncedSearch, selectedRole, onlyUnassigned, attendanceMap]);

  // Sahifalangan ro'yxat
  const paginatedWorkers = useMemo(() => {
    return filteredWorkers.slice(0, visibleCount);
  }, [filteredWorkers, visibleCount]);

  const todayStr = getTashkentTodayString();
  const isToday = selectedDate === todayStr;

  return (
    <div className="pb-24 pt-4 px-4 max-w-3xl mx-auto">
      {/* 1. Sana tanlagich - Yuqorida qulay navigation */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-3.5 shadow-xs mb-3.5">
        <div className="flex items-center justify-between gap-2">
          {/* Oldingi kun tugmasi */}
          <button
            type="button"
            onClick={handlePrevDay}
            className="min-h-[48px] min-w-[48px] flex items-center justify-center rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 active:bg-slate-200 transition"
            title="Oldingi kun"
            aria-label="Oldingi kun"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          {/* Sana markazi */}
          <div className="flex-1 text-center min-w-0">
            <div className="flex items-center justify-center gap-1.5 text-xs text-indigo-600 font-bold mb-0.5">
              <Calendar className="w-3.5 h-3.5" />
              <span>{isToday ? "Bugun" : "Tanlangan sana"}</span>
            </div>
            
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => {
                if (e.target.value) setSelectedDate(e.target.value);
              }}
              className="text-base font-extrabold text-slate-900 bg-transparent text-center focus:outline-hidden cursor-pointer hover:text-indigo-600 transition"
            />
            
            <p className="text-[11px] text-slate-500 font-medium truncate">
              {formatUzbekDisplayDate(selectedDate)}
            </p>
          </div>

          {/* Keyingi kun tugmasi */}
          <button
            type="button"
            onClick={handleNextDay}
            className="min-h-[48px] min-w-[48px] flex items-center justify-center rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 active:bg-slate-200 transition"
            title="Keyingi kun"
            aria-label="Keyingi kun"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>

        {!isToday && (
          <div className="mt-2.5 pt-2 border-t border-slate-100 text-center">
            <button
              type="button"
              onClick={handleGoToday}
              className="min-h-[36px] px-3 text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition"
            >
              Bugungi kunga o'tish
            </button>
          </div>
        )}
      </div>

      {/* 2. Tepada doimiy ko'rinib turadigan Xulosa (Stats) */}
      <div className="sticky top-16 z-20 bg-slate-50/95 backdrop-blur-md pt-1 pb-3">
        <div className="grid grid-cols-4 gap-1.5 bg-white p-2.5 rounded-2xl border border-slate-200 shadow-sm text-center">
          {/* Keldi */}
          <div className="bg-emerald-50/70 border border-emerald-100 rounded-xl py-2 px-1">
            <span className="block text-[11px] font-semibold text-emerald-800 leading-none mb-1">
              Keldi
            </span>
            <span className="text-base font-black text-emerald-700">
              {stats.keldi}
            </span>
          </div>

          {/* Kelmadi */}
          <div className="bg-rose-50/70 border border-rose-100 rounded-xl py-2 px-1">
            <span className="block text-[11px] font-semibold text-rose-800 leading-none mb-1">
              Kelmadi
            </span>
            <span className="text-base font-black text-rose-700">
              {stats.kelmadi}
            </span>
          </div>

          {/* Yarim kun */}
          <div className="bg-amber-50/70 border border-amber-100 rounded-xl py-2 px-1">
            <span className="block text-[11px] font-semibold text-amber-800 leading-none mb-1">
              Yarim kun
            </span>
            <span className="text-base font-black text-amber-700">
              {stats.yarimKun}
            </span>
          </div>

          {/* Belgilanmagan */}
          <div className="bg-slate-100/80 border border-slate-200 rounded-xl py-2 px-1">
            <span className="block text-[11px] font-semibold text-slate-600 leading-none mb-1">
              Belgilanm.
            </span>
            <span className="text-base font-black text-slate-800">
              {stats.unassigned}
            </span>
          </div>
        </div>

        {/* Ommaviy harakat: Belgilanmaganlarning hammasini 'Keldi' deb belgilash */}
        {stats.unassigned > 0 && (
          <div className="mt-2.5">
            <button
              type="button"
              onClick={() => setShowBulkModal(true)}
              className="w-full min-h-[46px] px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-xs shadow-sm flex items-center justify-center gap-2 transition"
            >
              <CheckCheck className="w-4 h-4" />
              <span>
                Belgilanmagan {stats.unassigned} ta ishchini "Keldi" deb belgilash
              </span>
            </button>
          </div>
        )}
      </div>

      {/* 3. Qidiruv va Filtrlar */}
      <div className="space-y-2.5 mb-4 bg-white p-3 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search className="h-5 w-5" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Davomatda ishchini qidirish..."
            className="w-full min-h-[46px] pl-11 pr-4 rounded-xl border border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 text-sm"
          />
        </div>

        <div className="flex items-center justify-between gap-2 flex-wrap pt-1">
          {/* Lavozim tanlash */}
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar text-xs">
            {['all', 'Tikuvchi', 'Bichuvchi', 'Dazmolchi', 'Yordamchi'].map(role => (
              <button
                key={role}
                type="button"
                onClick={() => setSelectedRole(role)}
                className={`min-h-[36px] px-3 py-1 rounded-lg transition font-semibold whitespace-nowrap ${
                  selectedRole === role
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {role === 'all' ? 'Barchasi' : role}
              </button>
            ))}
          </div>

          {/* Faqat belgilanmaganlar switch/filter */}
          <button
            type="button"
            onClick={() => setOnlyUnassigned(prev => !prev)}
            className={`min-h-[36px] px-3 py-1 rounded-lg text-xs font-bold border transition flex items-center gap-1.5 ${
              onlyUnassigned
                ? 'bg-amber-100 text-amber-900 border-amber-300'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <span>Faqat belgilanmaganlar ({stats.unassigned})</span>
          </button>
        </div>
      </div>

      {/* 4. Davomat ro'yxati yoki bo'sh holat */}
      {isLoading ? (
        <div className="py-12 text-center text-slate-400">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-indigo-600 border-t-transparent mb-2"></div>
          <p className="text-xs font-semibold">Yuklanmoqda...</p>
        </div>
      ) : activeWorkers.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center shadow-xs">
          <Users className="w-12 h-12 text-slate-300 mx-auto mb-2" />
          <h3 className="text-base font-bold text-slate-800">
            Sexda faol ishchilar yo'q
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Avval "Ishchilar" bo'limiga kirib ishchilarni ro'yxatga oling
          </p>
        </div>
      ) : filteredWorkers.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center shadow-xs">
          <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-2" />
          <h3 className="text-base font-bold text-slate-800">
            {onlyUnassigned
              ? "Barcha ishchilarning davomati belgilandi!"
              : "Qidiruv bo'yicha ishchi topilmadi"}
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            {onlyUnassigned
              ? "Bugungi kungi barcha xodimlar qayd etib bo'lingan"
              : "Filtrlarni bekor qilib ko'ring"}
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {paginatedWorkers.map(worker => (
            <AttendanceRow
              key={worker.id}
              worker={worker}
              status={attendanceMap[worker.id]}
              onStatusChange={handleStatusChange}
            />
          ))}

          {/* Sahifalash */}
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

      {/* Ommaviy belgilash tasdiqlash modali */}
      <ConfirmModal
        isOpen={showBulkModal}
        title="Ommaviy davomat qo'yish"
        message={`Rostdan ham hali belgilanmagan ${unassignedWorkerIds.length} ta ishchini "Keldi" deb belgilamoqchimisiz? Oldin belgilangan ishchilar o'zgarmaydi.`}
        confirmLabel="Ha, belgilash"
        cancelLabel="Bekor qilish"
        isDestructive={false}
        onConfirm={handleConfirmBulkPresent}
        onCancel={() => setShowBulkModal(false)}
      />
    </div>
  );
};
