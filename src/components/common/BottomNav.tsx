/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Users, CalendarCheck, Coins, Database } from 'lucide-react';
import type { AppTab } from '../../types';

interface BottomNavProps {
  activeTab: AppTab;
  onTabChange: (tab: AppTab) => void;
  workersCount?: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onTabChange,
  workersCount,
}) => {
  const tabs = [
    {
      id: 'workers' as AppTab,
      label: 'Ishchilar',
      icon: Users,
      badge: workersCount !== undefined ? workersCount : undefined,
    },
    {
      id: 'attendance' as AppTab,
      label: 'Davomat',
      icon: CalendarCheck,
    },
    {
      id: 'prices' as AppTab,
      label: 'Narxlar',
      icon: Coins,
    },
    {
      id: 'backup' as AppTab,
      label: 'Zaxira',
      icon: Database,
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-lg pb-safe">
      <div className="max-w-3xl mx-auto px-2 grid grid-cols-4 h-16">
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(tab.id)}
              className={`min-h-[48px] flex flex-col items-center justify-center gap-1 relative transition-colors ${
                isActive
                  ? 'text-indigo-600 font-bold'
                  : 'text-slate-500 hover:text-slate-800 font-medium'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110 stroke-[2.5]' : 'stroke-2'}`} />
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span className="absolute -top-1.5 -right-3.5 bg-indigo-100 text-indigo-700 text-[10px] font-bold px-1.5 py-0.2 rounded-full border border-indigo-200">
                    {tab.badge > 999 ? '999+' : tab.badge}
                  </span>
                )}
              </div>
              <span className="text-[11px] tracking-tight">{tab.label}</span>
              {isActive && (
                <span className="absolute bottom-1 w-6 h-1 bg-indigo-600 rounded-full" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
