/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Plus,
  Coins,
  History,
  Tag,
  Edit3,
  Archive,
  RotateCcw,
  Scissors,
  CheckCircle2,
} from 'lucide-react';
import type { ShiftRateHistoryItem, JobType } from '../../types';
import { formatCurrency } from '../../utils/format';
import { formatShortUzbekDate, getTashkentTodayString } from '../../utils/date';
import { ShiftRateModal } from './ShiftRateModal';
import { JobTypeModal } from './JobTypeModal';
import { ConfirmModal } from '../common/ConfirmModal';
import { useToast } from '../common/Toast';
import {
  getShiftRateHistory,
  addShiftRate,
  getJobTypes,
  saveJobType,
  toggleArchiveJobType,
} from '../../storage';

export const PricesView: React.FC = () => {
  const { showToast } = useToast();

  // Holatlar
  const [activeSubTab, setActiveSubTab] = useState<'shift' | 'jobs'>('shift');
  const [shiftHistory, setShiftHistory] = useState<ShiftRateHistoryItem[]>([]);
  const [jobTypes, setJobTypes] = useState<JobType[]>([]);
  const [showArchivedJobs, setShowArchivedJobs] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Modallar
  const [isShiftModalOpen, setIsShiftModalOpen] = useState(false);
  const [isJobModalOpen, setIsJobModalOpen] = useState(false);
  const [jobToEdit, setJobToEdit] = useState<JobType | null>(null);
  const [jobToArchive, setJobToArchive] = useState<JobType | null>(null);

  // Ma'lumotlarni yuklash
  const loadData = async () => {
    try {
      setIsLoading(true);
      const [rates, jobs] = await Promise.all([
        getShiftRateHistory(),
        getJobTypes(true),
      ]);
      setShiftHistory(rates);
      setJobTypes(jobs);
    } catch {
      showToast("Narxlar ma'lumotlarini yuklab bo'lmadi", 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Hozirgi amaldagi smena narxi (tarixdagi birinchi eng yangi yoki hozirgi sanaga mos)
  const today = getTashkentTodayString();
  const currentRateItem = shiftHistory.find(item => item.effectiveDate <= today) || shiftHistory[0];

  // Smena narxini saqlash
  const handleSaveShiftRate = async (effectiveDate: string, rate: number) => {
    try {
      await addShiftRate(effectiveDate, rate);
      showToast("Yangi smena narxi muvaffaqiyatli belgilandi", 'success');
      await loadData();
    } catch {
      showToast("Ma'lumotni saqlab bo'lmadi. Qaytadan urinib ko'ring.", 'error');
      throw new Error();
    }
  };

  // Ish turini saqlash
  const handleSaveJobType = async (data: { id?: string; title: string; pieceRate: number }) => {
    try {
      await saveJobType({
        id: data.id || '',
        title: data.title,
        pieceRate: data.pieceRate,
        isArchived: false,
      });
      showToast(data.id ? "Ish turi yangilandi" : "Yangi ish turi qo'shildi", 'success');
      await loadData();
    } catch {
      showToast("Ma'lumotni saqlab bo'lmadi. Qaytadan urinib ko'ring.", 'error');
      throw new Error();
    }
  };

  // Ish turini arxivlash (o'chirish)
  const handleConfirmArchiveJob = async () => {
    if (!jobToArchive) return;
    try {
      await toggleArchiveJobType(jobToArchive.id, true);
      showToast(`"${jobToArchive.title}" arxivga o'tkazildi`, 'info');
      setJobToArchive(null);
      await loadData();
    } catch {
      showToast("Ma'lumotni saqlab bo'lmadi. Qaytadan urinib ko'ring.", 'error');
    }
  };

  // Ish turini arxivdan qaytarish
  const handleRestoreJob = async (job: JobType) => {
    try {
      await toggleArchiveJobType(job.id, false);
      showToast(`"${job.title}" faol ish turlariga qaytarildi`, 'success');
      await loadData();
    } catch {
      showToast("Ma'lumotni saqlab bo'lmadi. Qaytadan urinib ko'ring.", 'error');
    }
  };

  const activeJobs = jobTypes.filter(j => !j.isArchived);
  const archivedJobs = jobTypes.filter(j => j.isArchived);

  return (
    <div className="pb-24 pt-4 px-4 max-w-3xl mx-auto">
      {/* Sarlavha */}
      <div className="mb-4">
        <h2 className="text-xl font-extrabold text-slate-900">
          Narxlar va Tariflar
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Smena (kunlik) narxlari va mahsulot tikish narxlarini sozlash
        </p>
      </div>

      {/* Ichki tablar (Smena narxi | Ish turlari) */}
      <div className="flex gap-2 mb-5 p-1 bg-slate-200/70 rounded-xl">
        <button
          type="button"
          onClick={() => setActiveSubTab('shift')}
          className={`flex-1 min-h-[44px] rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition ${
            activeSubTab === 'shift'
              ? 'bg-white text-indigo-700 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Coins className="w-4 h-4" />
          <span>Smena (kunlik) narxi</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('jobs')}
          className={`flex-1 min-h-[44px] rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition ${
            activeSubTab === 'jobs'
              ? 'bg-white text-indigo-700 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Scissors className="w-4 h-4" />
          <span>Ish turlari ({activeJobs.length})</span>
        </button>
      </div>

      {/* 1-QISM: SMENA (KUNLIK) NARXI VA TARIXI */}
      {activeSubTab === 'shift' && (
        <div className="space-y-4">
          {/* Hozirgi amaldagi narx kartochkasi */}
          <div className="bg-linear-to-br from-indigo-900 to-indigo-800 text-white rounded-2xl p-5 shadow-md">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs uppercase tracking-wider text-indigo-200 font-bold">
                Amaldagi smena narxi
              </span>
              <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[11px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Faol
              </span>
            </div>

            <div className="text-3xl font-black tracking-tight mb-2">
              {formatCurrency(currentRateItem?.rate || 120000)}
            </div>

            <div className="text-xs text-indigo-200 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              <span>
                Amal qilish boshlanishi: {currentRateItem ? formatShortUzbekDate(currentRateItem.effectiveDate) : "Bugundan"}
              </span>
            </div>

            {/* Yangi narx kiritish tugmasi */}
            <div className="mt-4 pt-4 border-t border-indigo-700/60">
              <button
                type="button"
                onClick={() => setIsShiftModalOpen(true)}
                className="w-full min-h-[48px] rounded-xl bg-white text-indigo-900 font-bold hover:bg-indigo-50 active:bg-indigo-100 transition shadow-xs flex items-center justify-center gap-2 text-sm"
              >
                <Plus className="w-4 h-4" />
                <span>+ Yangi smena narxi belgilash</span>
              </button>
            </div>
          </div>

          {/* Smena narxi tarixi */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs">
            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-100">
              <History className="w-4 h-4 text-indigo-600" />
              <h3 className="text-sm font-bold text-slate-900">
                Smena narxlari tarixi
              </h3>
            </div>
            
            <p className="text-xs text-slate-500 mb-3 leading-relaxed">
              Eski oylardagi hisob-kitoblar buzilmasligi uchun har bir davr o'sha paytdagi narx bilan hisoblanadi.
            </p>

            <div className="divide-y divide-slate-100">
              {shiftHistory.map((item, index) => {
                const isCurrent = item.id === currentRateItem?.id;
                return (
                  <div key={item.id} className="py-3 flex items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-base font-extrabold text-slate-900">
                          {formatCurrency(item.rate)}
                        </span>
                        {isCurrent && (
                          <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold px-1.5 py-0.2 rounded-md">
                            Hozirgi
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-slate-500">
                        Amal qilish sanasi: <b>{formatShortUzbekDate(item.effectiveDate)}</b> dan
                      </span>
                    </div>

                    <div className="text-right text-[11px] text-slate-400">
                      #{shiftHistory.length - index}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 2-QISM: ISH TURLARI (DONA NARXI) */}
      {activeSubTab === 'jobs' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="text-xs text-slate-600 font-medium">
                Tikilgan mahsulot donasiga qarab haq to'lash narxlari
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setJobToEdit(null);
                setIsJobModalOpen(true);
              }}
              className="min-h-[46px] px-4 rounded-xl bg-indigo-600 text-white font-bold text-xs hover:bg-indigo-700 shadow-xs flex items-center gap-1.5 shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>+ Ish turi qo'shish</span>
            </button>
          </div>

          {/* Faol va Arxivlangan ish turlari o'rtasida o'tish */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setShowArchivedJobs(false)}
              className={`min-h-[38px] px-3.5 rounded-lg text-xs font-bold transition ${
                !showArchivedJobs ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Faollar ({activeJobs.length})
            </button>
            <button
              type="button"
              onClick={() => setShowArchivedJobs(true)}
              className={`min-h-[38px] px-3.5 rounded-lg text-xs font-bold transition ${
                showArchivedJobs ? 'bg-rose-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Arxivdagilar ({archivedJobs.length})
            </button>
          </div>

          {/* Ish turlari ro'yxati */}
          {(showArchivedJobs ? archivedJobs : activeJobs).length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center shadow-xs">
              <Tag className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <h3 className="text-sm font-bold text-slate-800">
                {showArchivedJobs ? "Arxivlangan ish turlari yo'q" : "Hozircha ish turlari yo'q"}
              </h3>
              {!showArchivedJobs && (
                <button
                  type="button"
                  onClick={() => {
                    setJobToEdit(null);
                    setIsJobModalOpen(true);
                  }}
                  className="mt-3 px-4 py-2 min-h-[44px] rounded-xl bg-indigo-600 text-white text-xs font-bold"
                >
                  + Ish turi qo'shish
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {(showArchivedJobs ? archivedJobs : activeJobs).map(job => (
                <div
                  key={job.id}
                  className={`p-4 rounded-2xl bg-white border shadow-xs flex items-center justify-between gap-3 ${
                    job.isArchived ? 'opacity-70 border-slate-200 bg-slate-50' : 'border-slate-200/90'
                  }`}
                >
                  <div className="min-w-0">
                    <h4 className="text-base font-bold text-slate-900 truncate">
                      {job.title}
                    </h4>
                    <p className="text-sm font-black text-indigo-700 mt-0.5">
                      {formatCurrency(job.pieceRate)} <span className="text-xs font-normal text-slate-500">/ dona</span>
                    </p>
                  </div>

                  {/* Amallar */}
                  <div className="flex items-center gap-1 shrink-0">
                    {!job.isArchived ? (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            setJobToEdit(job);
                            setIsJobModalOpen(true);
                          }}
                          className="min-h-[44px] min-w-[44px] flex items-center justify-center p-2 rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition"
                          title="Tahrirlash"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setJobToArchive(job)}
                          className="min-h-[44px] min-w-[44px] flex items-center justify-center p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                          title="O'chirish (Arxivlash)"
                        >
                          <Archive className="w-4 h-4" />
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleRestoreJob(job)}
                        className="min-h-[44px] px-3 py-2 flex items-center gap-1.5 rounded-xl text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-xs font-bold"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Qaytarish</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Smena narxi modali */}
      <ShiftRateModal
        isOpen={isShiftModalOpen}
        currentRate={currentRateItem?.rate || 120000}
        onClose={() => setIsShiftModalOpen(false)}
        onSave={handleSaveShiftRate}
      />

      {/* Ish turi modali */}
      <JobTypeModal
        isOpen={isJobModalOpen}
        jobTypeToEdit={jobToEdit}
        onClose={() => {
          setIsJobModalOpen(false);
          setJobToEdit(null);
        }}
        onSave={handleSaveJobType}
      />

      {/* Ish turini o'chirish tasdiqlash modali */}
      <ConfirmModal
        isOpen={Boolean(jobToArchive)}
        title="Ish turini o'chirish"
        message={`Rostdan ham "${jobToArchive?.title}" mahsulot turini o'chirmoqchimisiz? U arxivga o'tkaziladi va eski hisobotlarda uning dona narxi saqlanib qoladi.`}
        confirmLabel="Ha, o'chirish"
        cancelLabel="Yo'q"
        isDestructive={true}
        onConfirm={handleConfirmArchiveJob}
        onCancel={() => setJobToArchive(null)}
      />
    </div>
  );
};
