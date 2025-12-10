import React, { useState } from 'react';
import { AppState } from '../types';
import { format, isSameDay } from 'date-fns';
import { Milk, Moon, User, Ruler } from 'lucide-react';

interface CalendarProps {
  state: AppState;
}

export const Calendar: React.FC<CalendarProps> = ({ state }) => {
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Generate last 7 days for the header
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    return d;
  }).reverse();

  const dayLogs = state.logs
    .filter(l => l.babyId === state.activeBabyId && isSameDay(new Date(l.startTime), selectedDate))
    .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());

  return (
    <div className="min-h-screen pt-6 px-4 pb-24 max-w-md mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white">History</h2>
      
      {/* Date Strip */}
      <div className="flex justify-between mb-8 overflow-x-auto no-scrollbar pb-2">
        {days.map(date => {
          const isSelected = isSameDay(date, selectedDate);
          return (
            <button 
              key={date.toISOString()}
              onClick={() => setSelectedDate(date)}
              className={`flex flex-col items-center justify-center min-w-[3rem] h-16 rounded-2xl mx-1 transition-all ${
                isSelected ? 'bg-primary text-white shadow-lg shadow-blue-200' : 'bg-white dark:bg-gray-800 text-gray-400'
              }`}
            >
              <span className="text-xs font-bold uppercase">{format(date, 'EEE')}</span>
              <span className="text-lg font-bold">{format(date, 'd')}</span>
            </button>
          )
        })}
      </div>

      <h3 className="text-lg font-semibold text-gray-600 dark:text-gray-300 mb-4">
        Activity for {format(selectedDate, 'MMMM do')}
      </h3>

      <div className="space-y-4">
        {dayLogs.length > 0 ? (
          dayLogs.map(log => (
            <div key={log.id} className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border-l-4 border-primary flex items-start gap-4">
              <div className="mt-1">
                {log.type === 'feeding' && <Milk className="text-pink-400" size={20}/>}
                {log.type === 'sleep' && <Moon className="text-indigo-400" size={20}/>}
                {log.type === 'diaper' && <User className="text-orange-400" size={20}/>}
                {log.type === 'growth' && <Ruler className="text-teal-400" size={20}/>}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-gray-800 dark:text-white capitalize">{log.type}</span>
                  <span className="text-xs text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full">
                    {format(new Date(log.startTime), 'h:mm a')}
                  </span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                   {log.details.subType && <span className="capitalize font-medium">{log.details.subType.replace('_', ' ')}</span>}
                   {log.details.amount && <span> • {log.details.amount}ml</span>}
                   {log.details.notes && <span> • {log.details.notes}</span>}
                   {log.details.weight && <span> • {log.details.weight}kg</span>}
                </p>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-10 bg-white dark:bg-gray-800 rounded-3xl border border-dashed border-gray-300">
            <p className="text-gray-400">No records for this day.</p>
          </div>
        )}
      </div>
    </div>
  );
};
