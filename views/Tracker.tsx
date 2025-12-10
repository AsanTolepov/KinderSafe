import React, { useState, useEffect, useRef } from 'react';
import { AppState, Log } from '../types';
import { generateId } from '../services/storage';
import { Play, Pause, Square, Moon, Check, Music, Utensils, Droplets, Apple, Coffee } from 'lucide-react';
import { saveLogToFirebase } from '../services/firestore'; 

interface TrackerProps {
  state: AppState;
  onAddLog: (log: Log) => void;
}

const LULLABIES = [
    { id: 1, title: "Yomg'ir ovozi", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3" }, 
    { id: 2, title: "Oq shovqin (White Noise)", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3" },
    { id: 3, title: "Shirin tushlar (Kuy)", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3" },
];

const FOOD_TYPES = [
    { id: 'breast', label: "Ko'krak suti", icon: <span className="text-xl">🤱</span> },
    { id: 'bottle', label: "Sun'iy sut", icon: <span className="text-xl">🍼</span> },
    { id: 'water', label: "Suv", icon: <Droplets size={20}/> },
    { id: 'porridge', label: "Kasha", icon: <Coffee size={20}/> },
    { id: 'fruit', label: "Meva/Pyure", icon: <Apple size={20}/> },
    { id: 'other', label: "Boshqa", icon: <Utensils size={20}/> },
];

export const Tracker: React.FC<TrackerProps> = ({ state, onAddLog }) => {
  const [mode, setMode] = useState<'timer' | 'manual'>('timer');
  const [isActive, setIsActive] = useState(false);
  const [timer, setTimer] = useState(0);
  const countRef = useRef<number | null>(null);
  const [playingSongId, setPlayingSongId] = useState<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [manualType, setManualType] = useState<'feeding' | 'sleep'>('feeding');
  const [manualDate, setManualDate] = useState(() => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
  });
  
  const [selectedFood, setSelectedFood] = useState<string>(''); 
  const [manualDuration, setManualDuration] = useState(''); 
  const [manualNote, setManualNote] = useState('');

  const formatTime = (seconds: number) => {
    const getSeconds = `0${seconds % 60}`.slice(-2);
    const minutes = Math.floor(seconds / 60);
    const getMinutes = `0${minutes % 60}`.slice(-2);
    const getHours = `0${Math.floor(seconds / 3600)}`.slice(-2);
    return `${getHours}:${getMinutes}:${getSeconds}`;
  };

  const toggleMusic = (song: typeof LULLABIES[0]) => {
      if (playingSongId === song.id) {
          audioRef.current?.pause();
          setPlayingSongId(null);
      } else {
          if (audioRef.current) {
              audioRef.current.src = song.url;
              audioRef.current.play();
          } else {
              const audio = new Audio(song.url);
              audioRef.current = audio;
              audio.play();
          }
          setPlayingSongId(song.id);
      }
  };

  useEffect(() => {
      return () => {
          if (audioRef.current) {
              audioRef.current.pause();
              audioRef.current = null;
          }
      };
  }, []);

  const handleStart = () => {
    if (isActive) return;
    setIsActive(true);
    countRef.current = window.setInterval(() => {
      setTimer((timer) => timer + 1);
    }, 1000);
  };

  const handleStop = async () => {
    if (countRef.current) window.clearInterval(countRef.current);
    setIsActive(false);
    
    if (state.activeBabyId) {
       const startTime = new Date(Date.now() - timer * 1000).toISOString();
       const newLog: Log = {
        id: generateId(),
        babyId: state.activeBabyId,
        type: 'sleep',
        startTime: startTime,
        endTime: new Date().toISOString(),
        details: { notes: `${formatTime(timer)} uxladi` }
      };
      
      onAddLog(newLog);
      await saveLogToFirebase(newLog);
    }
    setTimer(0);
  };

  const handlePause = () => {
    if (countRef.current) window.clearInterval(countRef.current);
    setIsActive(false);
  };

  // --- MANUAL ENTRY (O'ZGARTIRILGAN QISM) ---
  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!state.activeBabyId) {
        alert("Xatolik: Bola tanlanmagan!");
        return;
    }

    if (manualType === 'feeding' && !selectedFood) {
        alert("Iltimos, nima yeganini tanlang!");
        return;
    }

    if (manualType === 'sleep' && (!manualDuration || parseInt(manualDuration) <= 0)) {
        alert("Iltimos, qancha uxlaganini (daqiqa) kiriting!");
        return;
    }

    // 1. Vaqtlarni hisoblash
    let startTime = new Date(manualDate);
    const durationMin = manualType === 'sleep' ? parseInt(manualDuration) : 15;
    let endTime = new Date(startTime.getTime() + (durationMin * 60000));

    // --- TUZATISH: "SMART" ORQAGA HISOBLASH ---
    // Agar hisoblangan tugash vaqti hozirgi vaqtdan kelajakka o'tib ketsa,
    // demak foydalanuvchi "Hozirgacha uxladi" demoqchi.
    const now = new Date();
    // 1 daqiqa xatolikni inobatga olamiz (server/client vaqt farqi uchun)
    if (endTime.getTime() > (now.getTime() + 60000) && manualType === 'sleep') {
        endTime = new Date(manualDate); // Tugash vaqti = Siz tanlagan vaqt (Hozir)
        startTime = new Date(endTime.getTime() - (durationMin * 60000)); // Boshlanish = Hozir - Davomiylik
    }
    // -------------------------------------------

    let finalNote = manualNote;
    if (manualType === 'feeding') {
        const foodLabel = FOOD_TYPES.find(f => f.id === selectedFood)?.label;
        finalNote = `${foodLabel} yedi. ${manualNote}`;
    } else if (manualType === 'sleep') {
        const hours = Math.floor(durationMin / 60);
        const mins = durationMin % 60;
        const timeText = `${hours > 0 ? hours + ' soat ' : ''}${mins} daqiqa`;
        finalNote = `${timeText} uxladi (qo'lda). ${manualNote}`;
    }

    const logDetails: any = {
        notes: finalNote.trim()
    };
    
    if (manualType === 'feeding') {
        logDetails.subType = selectedFood;
    }

    const newLog: Log = {
        id: generateId(),
        babyId: state.activeBabyId,
        type: manualType,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        details: logDetails
    };

    try {
        onAddLog(newLog);
        await saveLogToFirebase(newLog);
        setManualNote('');
        setManualDuration('');
        setSelectedFood('');
        alert("Ma'lumot saqlandi! ✅");
    } catch (err) {
        console.error("Saqlashda xatolik:", err);
        alert("Saqlashda xatolik yuz berdi.");
    }
  };

  useEffect(() => {
      return () => { if (countRef.current) window.clearInterval(countRef.current); };
  }, []);

  return (
    <div className="p-4 pb-24 min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="flex bg-white dark:bg-gray-800 p-1 rounded-2xl shadow-sm mb-6">
          <button onClick={() => setMode('timer')} className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${mode === 'timer' ? 'bg-indigo-500 text-white shadow-md' : 'text-gray-400'}`}>Uyqu Taymeri 🌙</button>
          <button onClick={() => setMode('manual')} className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${mode === 'manual' ? 'bg-blue-500 text-white shadow-md' : 'text-gray-400'}`}>Qo'lda kiritish ✍️</button>
      </div>

      {mode === 'timer' ? (
          <>
            <div className="bg-indigo-600 dark:bg-indigo-900 rounded-[2rem] p-8 shadow-lg text-center mb-6 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -mr-10 -mt-10"></div>
                <div className="relative z-10">
                    <div className="text-indigo-200 text-sm font-bold uppercase tracking-widest mb-2">UYQU VAQTI</div>
                    <h1 className="text-5xl font-mono font-bold tracking-wider tabular-nums mb-6">{formatTime(timer)}</h1>
                    <div className="flex justify-center gap-4">
                        {!isActive && timer === 0 ? (
                             <button onClick={handleStart} className="bg-white text-indigo-600 px-8 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg active:scale-95 transition-transform"><Play size={20} fill="currentColor"/> Boshlash</button>
                        ) : (
                            <>
                                {isActive ? (
                                    <button onClick={handlePause} className="bg-indigo-400/50 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 border border-white/20"><Pause size={20} fill="currentColor"/></button>
                                ) : (
                                    <button onClick={handleStart} className="bg-green-400 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2"><Play size={20} fill="currentColor"/></button>
                                )}
                                <button onClick={handleStop} className="bg-red-500 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg"><Square size={20} fill="currentColor"/> Tugatish</button>
                            </>
                        )}
                    </div>
                </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-3xl p-5 shadow-sm">
                <h3 className="font-bold text-gray-700 dark:text-gray-200 mb-4 flex items-center gap-2"><Music size={20} className="text-pink-500"/> Tinchlantiruvchi kuylar</h3>
                <div className="space-y-3">
                    {LULLABIES.map((song) => (
                        <div key={song.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${playingSongId === song.id ? 'bg-pink-500 text-white animate-pulse' : 'bg-gray-200 text-gray-500'}`}><Music size={16} /></div>
                                <span className="text-sm font-bold text-gray-700 dark:text-gray-200">{song.title}</span>
                            </div>
                            <button onClick={() => toggleMusic(song)} className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${playingSongId === song.id ? 'bg-pink-100 text-pink-600' : 'bg-white shadow-sm text-gray-700'}`}>
                                {playingSongId === song.id ? <Pause size={18} fill="currentColor"/> : <Play size={18} fill="currentColor" className="ml-1"/>}
                            </button>
                        </div>
                    ))}
                </div>
            </div>
          </>
      ) : (
          <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-sm border border-gray-100">
              <form onSubmit={handleManualSubmit} className="space-y-6">
                  <div>
                      <label className="text-xs font-bold text-gray-400 uppercase ml-1 block mb-2">Nimani kiritamiz?</label>
                      <div className="flex gap-3">
                          <button type="button" onClick={() => setManualType('feeding')} className={`flex-1 py-4 rounded-2xl flex flex-col items-center gap-2 border-2 transition-all ${manualType === 'feeding' ? 'border-pink-500 bg-pink-50 text-pink-600' : 'border-gray-100 bg-gray-50 text-gray-400'}`}><Utensils size={24}/> <span className="font-bold text-sm">Ovqat</span></button>
                          <button type="button" onClick={() => setManualType('sleep')} className={`flex-1 py-4 rounded-2xl flex flex-col items-center gap-2 border-2 transition-all ${manualType === 'sleep' ? 'border-indigo-500 bg-indigo-50 text-indigo-600' : 'border-gray-100 bg-gray-50 text-gray-400'}`}><Moon size={24}/> <span className="font-bold text-sm">Uyqu</span></button>
                      </div>
                  </div>
                  {manualType === 'feeding' && (
                      <div className="animate-fade-in">
                          <label className="text-xs font-bold text-gray-400 uppercase ml-1 block mb-2">Nima yedi/ichdi?</label>
                          <div className="grid grid-cols-3 gap-3">
                              {FOOD_TYPES.map((food) => (
                                  <button key={food.id} type="button" onClick={() => setSelectedFood(food.id)} className={`p-3 rounded-xl flex flex-col items-center justify-center gap-2 border transition-all ${selectedFood === food.id ? 'bg-blue-500 text-white border-blue-500 shadow-md' : 'bg-gray-50 border-gray-100 text-gray-500'}`}>
                                      <div className={selectedFood === food.id ? 'text-white' : 'text-blue-500'}>{food.icon}</div>
                                      <span className="text-[10px] font-bold text-center leading-tight">{food.label}</span>
                                  </button>
                              ))}
                          </div>
                      </div>
                  )}
                  <div>
                      <label className="text-xs font-bold text-gray-400 uppercase ml-1 block mb-2">Vaqti</label>
                      <input type="datetime-local" required value={manualDate} onChange={(e) => setManualDate(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 text-gray-800 font-medium outline-none focus:border-blue-500"/>
                  </div>
                  {manualType === 'sleep' && (
                       <div className="animate-fade-in">
                          <label className="text-xs font-bold text-gray-400 uppercase ml-1 block mb-2">Qancha uxladi (daqiqa)? <span className="text-red-500">*</span></label>
                          <input type="number" placeholder="Masalan: 60" required min="1" value={manualDuration} onChange={(e) => setManualDuration(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 text-gray-800 font-medium outline-none focus:border-blue-500"/>
                       </div>
                  )}
                  <div>
                      <label className="text-xs font-bold text-gray-400 uppercase ml-1 block mb-2">Qo'shimcha izoh</label>
                      <textarea rows={2} placeholder="Muhim narsa bo'ldimi?" value={manualNote} onChange={(e) => setManualNote(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 text-gray-800 font-medium outline-none focus:border-blue-500 resize-none"/>
                  </div>
                  <button type="submit" className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold text-lg shadow-lg shadow-blue-200 flex items-center justify-center gap-2 active:scale-95 transition-transform"><Check size={20} /> Saqlash</button>
              </form>
          </div>
      )}
    </div>
  );
};