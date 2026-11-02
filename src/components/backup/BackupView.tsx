/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Download,
  Upload,
  Database,
  Users,
  ShieldCheck,
  Sparkles,
  RotateCcw,
  AlertTriangle,
} from 'lucide-react';
import { useToast } from '../common/Toast';
import { ConfirmModal } from '../common/ConfirmModal';
import {
  exportAllData,
  importAllData,
  generateDemoWorkers,
  clearAllDatabase,
} from '../../storage';

interface BackupViewProps {
  onDataChanged: () => Promise<void>;
  totalWorkers: number;
}

export const BackupView: React.FC<BackupViewProps> = ({
  onDataChanged,
  totalWorkers,
}) => {
  const { showToast } = useToast();
  const [isExporting, setIsExporting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showClearModal, setShowClearModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);

  // 1. Ma'lumotlarni JSON fayl sifatida yuklab olish (Eksport)
  const handleExport = async () => {
    try {
      setIsExporting(true);
      const jsonString = await exportAllData();
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const dateStr = new Date().toISOString().split('T')[0];
      a.href = url;
      a.download = `chevar_sexi_zaxira_${dateStr}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast("Zaxira fayli muvaffaqiyatli yuklandi", 'success');
    } catch {
      showToast("Zaxirani yuklab olishda xatolik yuz berdi", 'error');
    } finally {
      setIsExporting(false);
    }
  };

  // 2. JSON fayldan ma'lumotlarni tiklash (Import)
  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const content = event.target?.result as string;
        const res = await importAllData(content);
        showToast(
          `Zaxira tiklandi: ${res.workersCount} ta ishchi, ${res.attendanceCount} ta davomat yozuvi`,
          'success'
        );
        await onDataChanged();
      } catch (err: any) {
        showToast(err.message || "Zaxira faylini tiklab bo'lmadi", 'error');
      }
    };
    reader.readAsText(file);
    // Fayl maydonini tozalash
    e.target.value = '';
  };

  // 3. 500 ta namunaviy ishchi generatsiyasi (Tezlikni sinash uchun)
  const handleGenerate500 = async () => {
    setShowBulkModal(false);
    try {
      setIsGenerating(true);
      const count = await generateDemoWorkers(500);
      showToast(`${count} ta namunaviy ishchi yaratildi. Tizim tezligi sinovga tayyor!`, 'success');
      await onDataChanged();
    } catch {
      showToast("Namunaviy ishchilarni yaratib bo'lmadi", 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  // 4. Bazani boshlang'ich holatga qaytarish
  const handleClearAll = async () => {
    setShowClearModal(false);
    try {
      await clearAllDatabase();
      showToast("Ma'lumotlar tozalandi va standart namuna tiklandi", 'info');
      await onDataChanged();
    } catch {
      showToast("Tozalashda xatolik yuz berdi", 'error');
    }
  };

  return (
    <div className="pb-24 pt-4 px-4 max-w-3xl mx-auto space-y-5">
      {/* Sarlavha */}
      <div>
        <h2 className="text-xl font-extrabold text-slate-900">
          Zaxira va Xavfsizlik
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Sex ma'lumotlarini saqlash, yuklab olish va tiklash
        </p>
      </div>

      {/* Ma'lumotlar bazasi holati */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Mahalliy IndexedDB xotirasi
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Barcha ma'lumotlar qurilmangizning xavfsiz va tezkor IndexedDB bazasida saqlanmoqda.
            </p>
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-slate-600">
          <span>Bazadagi ishchilar soni:</span>
          <span className="bg-indigo-50 text-indigo-700 px-2.5 py-0.5 rounded-full border border-indigo-200 font-bold">
            {totalWorkers} ta
          </span>
        </div>
      </div>

      {/* Eksport & Import kartochkasi */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs space-y-4">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-emerald-600" />
          <h3 className="text-sm font-bold text-slate-900">
            Faylga nusxalash (Zaxira)
          </h3>
        </div>
        <p className="text-xs text-slate-600 leading-relaxed">
          Sexingizdagi barcha ma'lumotlarni (ishchilar, kunlik davomatlar, smena narxlari tarixi, ish turlari) kompyuter yoki telefoningizga JSON fayl sifatida yuklab oling.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          {/* Eksport tugmasi */}
          <button
            type="button"
            disabled={isExporting}
            onClick={handleExport}
            className="w-full min-h-[48px] rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-xs transition flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>{isExporting ? "Yuklanmoqda..." : "Zaxira faylini yuklab olish"}</span>
          </button>

          {/* Import tugmasi */}
          <label className="w-full min-h-[48px] rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-bold text-sm shadow-xs transition flex items-center justify-center gap-2 cursor-pointer">
            <Upload className="w-4 h-4 text-slate-500" />
            <span>Zaxiradan tiklash (Import)</span>
            <input
              type="file"
              accept=".json"
              onChange={handleImportFile}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* 500+ Ishchini sinovdan o'tkazish (Stress Test) */}
      <div className="bg-linear-to-r from-amber-50 to-orange-50 rounded-2xl border border-amber-200/80 p-5 shadow-xs space-y-3">
        <div className="flex items-center gap-2 text-amber-900">
          <Sparkles className="w-5 h-5 text-amber-600" />
          <h3 className="text-sm font-bold">
            500+ ishchi bilan tezlikni sinash
          </h3>
        </div>
        <p className="text-xs text-amber-800 leading-relaxed">
          Dasturning 500 tadan ortiq ishchi bilan qanchalik chaqqon, qotmasdan va barqaror ishlashini tekshirish uchun bitta tugma bilan 500 ta namunaviy chevar xodimlarni bazaga qo'shishingiz mumkin.
        </p>

        <button
          type="button"
          disabled={isGenerating}
          onClick={() => setShowBulkModal(true)}
          className="w-full min-h-[48px] rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-sm shadow-xs transition flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <Users className="w-4 h-4" />
          <span>{isGenerating ? "Ishchilar yaratilmoqda..." : "+ 500 ta namunaviy ishchi qo'shish"}</span>
        </button>
      </div>

      {/* Tozalash bo'limi */}
      <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 flex items-center justify-between gap-3">
        <div>
          <h4 className="text-xs font-bold text-slate-800">
            Sinov ma'lumotlarini tozalash
          </h4>
          <p className="text-[11px] text-slate-500">
            Bazani standart boshlang'ich namunalar bilan qayta yuklaydi
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowClearModal(true)}
          className="min-h-[44px] px-3.5 py-1.5 rounded-xl border border-rose-200 text-rose-700 bg-rose-50 hover:bg-rose-100 text-xs font-bold transition flex items-center gap-1.5 shrink-0"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Tozalash</span>
        </button>
      </div>

      {/* 500 ishchi qo'shish tasdiqlash modali */}
      <ConfirmModal
        isOpen={showBulkModal}
        title="500 ta ishchi qo'shish"
        message="Hozir bazaga 500 ta sinov ishchilari generatsiya qilinadi. Bu tizimning 500+ ishchi bilan qotmasdan ishlashini sinash uchun xizmat qiladi. Davom etasizmi?"
        confirmLabel="Ha, qo'shilsin"
        cancelLabel="Bekor qilish"
        isDestructive={false}
        onConfirm={handleGenerate500}
        onCancel={() => setShowBulkModal(false)}
      />

      {/* Tozalash tasdiqlash modali */}
      <ConfirmModal
        isOpen={showClearModal}
        title="Bazani tozalash"
        message="Rostdan ham bazani tozalamoqchimisiz? Barcha kiritilgan ishchilar va davomatlar o'chiriladi hamda standart boshlang'ich namunaga qaytariladi."
        confirmLabel="Ha, tozalash"
        cancelLabel="Yo'q"
        isDestructive={true}
        onConfirm={handleClearAll}
        onCancel={() => setShowClearModal(false)}
      />
    </div>
  );
};
