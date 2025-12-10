import React from 'react';
import { Home, Calendar, PlusCircle, Sparkles, Settings } from 'lucide-react';
import { Tab } from '../types';

interface BottomNavProps {
  currentTab: Tab;
  onTabChange: (tab: Tab) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentTab, onTabChange }) => {
  return (
    // O'ZGARISH: fixed pastda, lekin max-width bilan cheklangan va o'rtada
    <div className="fixed bottom-0 left-0 right-0 flex justify-center z-50 pointer-events-none">
      <div className="w-full max-w-[450px] bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700 pb-safe pt-2 px-2 shadow-lg pointer-events-auto rounded-t-2xl">
        <div className="flex justify-around items-end pb-4">
          
          <NavItem 
            active={currentTab === Tab.HOME} 
            onClick={() => onTabChange(Tab.HOME)} 
            icon={<Home size={24} />} 
            label="Asosiy" 
          />
          
          <NavItem 
            active={currentTab === Tab.CALENDAR} 
            onClick={() => onTabChange(Tab.CALENDAR)} 
            icon={<Calendar size={24} />} 
            label="Tarix" 
          />

          {/* O'rta tugma (Katta Plyus) */}
          <div className="relative -top-5">
            <button 
              onClick={() => onTabChange(Tab.TRACKER)}
              className={`w-14 h-14 rounded-full flex items-center justify-center text-white shadow-xl transform transition-transform active:scale-95 ${
                currentTab === Tab.TRACKER 
                  ? 'bg-blue-600 ring-4 ring-blue-100 dark:ring-blue-900' 
                  : 'bg-blue-500 hover:bg-blue-600'
              }`}
            >
              <PlusCircle size={30} />
            </button>
          </div>

          <NavItem 
            active={currentTab === Tab.AI_HELP} 
            onClick={() => onTabChange(Tab.AI_HELP)} 
            icon={<Sparkles size={24} />} 
            label="AI" 
          />

          <NavItem 
            active={currentTab === Tab.SETTINGS} 
            onClick={() => onTabChange(Tab.SETTINGS)} 
            icon={<Settings size={24} />} 
            label="Sozlash" 
          />
          
        </div>
      </div>
    </div>
  );
};

// Yordamchi komponent
const NavItem = ({ active, onClick, icon, label }: any) => (
  <button 
    onClick={onClick}
    className={`flex flex-col items-center gap-1 p-2 w-16 transition-colors ${
      active ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
    }`}
  >
    {icon}
    <span className="text-[10px] font-bold">{label}</span>
  </button>
);