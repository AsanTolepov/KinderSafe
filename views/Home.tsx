import React, { useMemo, useEffect, useState } from 'react';
import { AppState, Tab } from '../types';
import { formatDistanceToNow, subDays, format, isSameDay, differenceInMinutes, differenceInHours, differenceInMonths, differenceInYears, isFuture } from 'date-fns';
import { uz } from 'date-fns/locale';
import { Milk, Moon, TrendingUp, CheckCircle, AlertCircle, User, Calendar } from 'lucide-react';
import { AreaChart, Area, XAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface HomeProps {
  state: AppState;
  onNavigate: (tab: Tab) => void;
}

export const Home: React.FC<HomeProps> = ({ state, onNavigate }) => {
  const baby = state.babies.find(b => b.id === state.activeBabyId);
  const user = state.user;
  
  const [analysisText, setAnalysisText] = useState<string>("Ma'lumotlar tahlil qilinmoqda...");
  const [healthStatus, setHealthStatus] = useState<'good' | 'average' | 'bad'>('good');

  const calculateAge = (dobString: string) => {
    const dob = new Date(dobString);
    const now = new Date();
    const months = differenceInMonths(now, dob);
    const years = differenceInYears(now, dob);
    if (months < 1) return "Yangi tug'ilgan";
    if (months < 12) return `${months} oylik`;
    const remainingMonths = months % 12;
    if (remainingMonths === 0) return `${years} yosh`;
    return `${years} yosh, ${remainingMonths} oy`;
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    if (isFuture(date)) return "Hozirgina";
    return formatDistanceToNow(date, { addSuffix: true, locale: uz });
  };

  const getDisplayTime = (log: any) => {
      if (!log) return '--:--';
      const endTime = log.endTime ? new Date(log.endTime) : null;
      if (endTime && isFuture(endTime)) return format(new Date(log.startTime), 'HH:mm');
      return format(endTime || new Date(log.startTime), 'HH:mm');
  };

  // --- AI LOGIKA (TUZATILDI) ---
  useEffect(() => {
    if (!state.logs.length || !baby) {
        setAnalysisText("Hozircha ma'lumotlar yetarli emas.");
        return;
    }

    const now = new Date();
    
    // Loglarni filtrlash (Oxirgi 48 soat)
    const recentLogs = state.logs.filter(l => 
        l.babyId === baby.id && 
        differenceInHours(now, new Date(l.startTime)) < 48 
    );

    // --- O'ZGARTIRILGAN JOY ---
    // Uyqu vaqtini hisoblashda:
    // Agar uyqu BUGUN boshlangan bo'lsa YOKI BUGUN tugagan bo'lsa hisoblaymiz.
    // (Oldin faqat boshlangan vaqtga qarar edi, shuning uchun kechagi uyquni ko'rmasdi)
    const sleepMinutes = recentLogs
        .filter(l => {
            if (l.type !== 'sleep' || !l.endTime) return false;
            const start = new Date(l.startTime);
            const end = new Date(l.endTime);
            // Bugun tugagan yoki bugun boshlangan
            return isSameDay(end, now) || isSameDay(start, now);
        })
        .reduce((acc, curr) => acc + differenceInMinutes(new Date(curr.endTime!), new Date(curr.startTime)), 0);
    
    const sleepHours = sleepMinutes / 60;
    
    // Ovqatlanish (bugungi)
    const feedCount = recentLogs.filter(l => l.type === 'feeding' && isSameDay(new Date(l.startTime), now)).length;
    
    let status: 'good' | 'average' | 'bad' = 'good';
    let text = "";

    if (sleepHours > 24) {
        status = 'bad';
        text = `Xatolik! ${sleepHours.toFixed(1)} soat uyqu kiritildi. Iltimos, ma'lumotlarni tekshiring.`;
    } else if (sleepHours === 0 && feedCount === 0) {
        status = 'average';
        text = "Bugun hali hech qanday ma'lumot kiritilmadi.";
    } else if (sleepHours < 9) { 
        status = 'average';
        text = `Bugungi uyqu biroz kam (${sleepHours.toFixed(1)} soat). ${baby.name}ni ko'proq uxlatishga harakat qiling.`;
    } else {
        status = 'good';
        text = `Ajoyib! ${baby.name} bugun ${sleepHours.toFixed(1)} soat uxladi va rejimi joyida.`;
    }

    setHealthStatus(status);
    setAnalysisText(text);

  }, [state.logs, baby]);

  const chartData = useMemo(() => {
     if (!baby) return [];
     const data = [];
     for (let i = 6; i >= 0; i--) {
       const date = subDays(new Date(), i);
       const daysLogs = state.logs.filter(log => log.babyId === baby?.id && isSameDay(new Date(log.startTime), date));
       const sleepMin = daysLogs.filter(l => l.type === 'sleep' && l.endTime).reduce((acc, curr) => acc + differenceInMinutes(new Date(curr.endTime!), new Date(curr.startTime)), 0);
       data.push({ name: format(date, 'EEE', { locale: uz }), sleep: Number((sleepMin / 60).toFixed(1)) });
     }
     return data;
   }, [state.logs, baby]);

   const getLastLog = (type: string) => {
     if (!baby) return null;
     const logs = state.logs.filter(l => l.babyId === baby.id && l.type === type).sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
     return logs[0];
   };
   const lastFeed = getLastLog('feeding');
   const lastSleep = getLastLog('sleep');

  if (!baby || !user) return <div className="flex justify-center items-center h-screen">Yuklanmoqda...</div>;

  return (
    <div className="w-full min-h-screen bg-gray-50 dark:bg-gray-900 pb-32 transition-colors duration-300">
        <div className="bg-white dark:bg-gray-800 rounded-b-[2.5rem] px-6 pt-10 pb-8 mb-6 shadow-sm relative overflow-hidden">
          <div className="absolute top-[-30%] right-[-10%] w-56 h-56 bg-blue-400/20 rounded-full blur-3xl"></div>
          <div className="relative z-10 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-400 mb-1">Xush kelibsiz,</p>
              <h1 className="text-2xl font-black text-gray-800 dark:text-white leading-tight">{user.name}</h1>
              <div className="flex items-center gap-2 mt-2">
                 <div className="flex items-center gap-1 text-blue-600 font-bold text-sm bg-blue-50 dark:bg-blue-900/30 px-3 py-1 rounded-xl"><span>👶 {baby.name}</span></div>
                 <div className="flex items-center gap-1 text-gray-500 font-bold text-xs bg-gray-100 dark:bg-gray-700 dark:text-gray-300 px-3 py-1 rounded-xl"><Calendar size={12} className="text-gray-400 dark:text-gray-500"/><span>{calculateAge(baby.dob)}</span></div>
              </div>
            </div>
            <div className="w-14 h-14 rounded-full bg-gray-100 p-1 border border-gray-100 shadow-sm" onClick={() => onNavigate(Tab.SETTINGS)}>
                {user.photoUrl ? <img src={user.photoUrl} alt="" className="w-full h-full rounded-full object-cover" /> : <div className="w-full h-full bg-blue-100 rounded-full flex items-center justify-center text-blue-600"><User size={24} /></div>}
            </div>
          </div>
        </div>

        <div className="px-5 space-y-5">
             <div className={`relative overflow-hidden p-5 rounded-3xl text-white shadow-lg transition-all ${healthStatus === 'good' ? 'bg-gradient-to-r from-emerald-500 to-teal-600' : healthStatus === 'average' ? 'bg-gradient-to-r from-orange-400 to-amber-500' : 'bg-gradient-to-r from-rose-500 to-red-600'}`}>
                <div className="flex items-center gap-2 mb-2">{healthStatus === 'good' ? <CheckCircle size={22} /> : <AlertCircle size={22} />}<h3 className="text-lg font-bold">{healthStatus === 'good' ? "Holat A'lo" : healthStatus === 'average' ? "E'tibor bering" : "Yomon"}</h3></div>
                <p className="text-sm bg-white/10 backdrop-blur-md p-3 rounded-xl border border-white/20 leading-relaxed font-medium">🤖 {analysisText}</p>
                <div className="absolute -bottom-4 -right-4 w-20 h-20 bg-white/20 rounded-full blur-xl"></div>
            </div>

             <div className="grid grid-cols-2 gap-3">
                <div className="bg-white dark:bg-gray-800 p-4 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700">
                    <div className="flex justify-between mb-3">
                        <div className="p-2 bg-pink-50 text-pink-500 rounded-2xl"><Milk size={20}/></div>
                        <span className="text-xs text-gray-400 font-mono mt-1">{lastFeed ? format(new Date(lastFeed.startTime), 'HH:mm') : '--:--'}</span>
                    </div>
                    <p className="text-gray-400 text-[10px] font-bold uppercase tracking-wider">Oxirgi ovqat</p>
                    <h3 className="text-lg font-black text-gray-800 dark:text-white">{lastFeed ? formatTimeAgo(lastFeed.startTime) : 'Yo\'q'}</h3>
                </div>
                <div className="bg-white dark:bg-gray-800 p-4 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700">
                    <div className="flex justify-between mb-3">
                        <div className="p-2 bg-indigo-50 text-indigo-500 rounded-2xl"><Moon size={20}/></div>
                        <span className="text-xs text-gray-400 font-mono mt-1">{getDisplayTime(lastSleep)}</span>
                    </div>
                    <p className="text-gray-400 text-[10px] font-bold uppercase tracking-wider">Oxirgi uyqu</p>
                    <h3 className="text-lg font-black text-gray-800 dark:text-white">
                        {lastSleep ? formatTimeAgo(lastSleep.endTime || lastSleep.startTime) : 'Yo\'q'}
                    </h3>
                </div>
            </div>

             <div className="bg-white dark:bg-gray-800 rounded-3xl p-5 shadow-sm h-60 border border-gray-100 dark:border-gray-700">
                <h3 className="font-bold text-gray-800 dark:text-white mb-2 flex items-center gap-2 text-sm"><TrendingUp size={16}/> Haftalik Rejim</h3>
                <ResponsiveContainer width="100%" height="85%">
                    <AreaChart data={chartData}>
                        <defs><linearGradient id="colorSleep" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/><stop offset="95%" stopColor="#6366f1" stopOpacity={0}/></linearGradient></defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 10}} />
                        <Tooltip />
                        <Area type="monotone" dataKey="sleep" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorSleep)" />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    </div>
  );
};