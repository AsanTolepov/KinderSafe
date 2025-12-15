// src/views/Tracker.tsx
import React, { useState, useEffect, useRef } from 'react';
import { AppState, Log } from '../types';
import { generateId } from '../services/storage';
import {
  Play,
  Pause,
  Square,
  Moon,
  Check,
  Music,
  Utensils,
  Droplets,
  Apple,
  Coffee,
  PlayCircle,
  Video as VideoIcon,
  Repeat,
  SkipBack,
  SkipForward,
  MoreVertical,
  Download,
} from 'lucide-react';
import { saveLogToFirebase } from '../services/firestore';

// Lullabies ro'yxati alohida fayldan
import { LULLABIES, LullabyTrack } from '../data/lullabies';

interface TrackerProps {
  state: AppState;
  onAddLog: (log: Log) => void;
}

const FOOD_TYPES = [
  { id: 'breast', label: "Ko'krak suti", icon: <span className="text-xl">🤱</span> },
  { id: 'bottle', label: "Sun'iy sut", icon: <span className="text-xl">🍼</span> },
  { id: 'water', label: 'Suv', icon: <Droplets size={20} /> },
  { id: 'porridge', label: 'Kasha', icon: <Coffee size={20} /> },
  { id: 'fruit', label: 'Meva/Pyure', icon: <Apple size={20} /> },
  { id: 'other', label: 'Boshqa', icon: <Utensils size={20} /> },
];

// VIDEO RO'YXATI (oldingi kabi)
const VIDEOS = [
  {
    id: 1,
    title: "Beshta Kichkina Chaqaloq Karavotga Sakrash + Maktabgacha Qofiyalar Bolalar Uchun",
    url: 'https://youtu.be/lqYmsIjBwKQ?si=4EU9VK7FeBQrJUiv',
  },
  {
    id: 2,
    title: "Учим Первые Слова с Детьми! ",
    url: 'https://youtu.be/hj7c6DXmgz0?si=23naHHOsJWAOm05Q',
  },
  {
    id: 3,
    title: "По полям Синий трактор едет к нам - Песенка мультик для детей",
    url: 'https://youtu.be/LbOve_UZZ54?si=-NmnxrF1_mnACEZn',
  },
  {
    id: 4,
    title: 'A Ram Sam Sam | Cantec pentru copii + karaoke | HeyKids',
    url: 'https://youtu.be/935UBEm0gg0?si=MIem6o7bpLdXhZ1V',
  },
  {
    id: 5,
    title: 'Qadimgi Makdonaldning Fermasi Bor Edi + Bolalar Uchun Ko'proq maktabgacha Qofiyalar',
    url: 'https://youtu.be/zw59NXJPEfg?si=4oGn3MvezKbTXii4',
  },
  {
    id: 6,
    title: "Wheels on the Bus + Johny Johny Yes Papa | Most Popular Kids Songs Compilation | LooLoo Kids",
    url: 'https://youtu.be/2zOGMdRDvyg?si=A6T6qlwWLTcFDGX3',
  },
  {
    id: 7,
    title: 'Joja Жужаларим Узбекча',
    url: 'https://youtu.be/VbqWNo4o6KE?si=JjsJh3BSbKZv2ZzC',
  },
  {
    id: 8,
    title: 'Маша и Медведь - Колыбельная песня (Спи, моя радость, усни!)',
    url: 'https://youtu.be/Rer9g8kd4IY?si=cX_7g4SqbbjCOmWt',
  },
  {
    id: 9,
    title: 'Wheels on the Bus | @CoComelon Nursery Rhymes & Kids Songs',
    url: 'https://youtu.be/e_04ZrNroTo?si=11rv5jlhgQQlBLOu',
  },
  {
    id: 10,
    title: 'Сборник Песен Для Самых Маленьких 0+ |Канал раннего развития - ЛаЛаЛуна.',
    url: 'https://youtu.be/HGmTR2PT5h0?si=2kRO691oTcRQl_Ku',
  },
];

const extractYouTubeId = (url: string): string | null => {
  try {
    const u = new URL(url);

    if (u.hostname.includes('youtu.be')) {
      return u.pathname.replace('/', '');
    }

    const v = u.searchParams.get('v');
    if (v) return v;

    const parts = u.pathname.split('/');
    const embedIndex = parts.indexOf('embed');
    if (embedIndex !== -1 && parts[embedIndex + 1]) {
      return parts[embedIndex + 1];
    }

    return null;
  } catch {
    return null;
  }
};

const formatShortTime = (sec: number) => {
  if (!sec || Number.isNaN(sec)) return '0:00';
  const minutes = Math.floor(sec / 60);
  const seconds = Math.floor(sec % 60);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

export const Tracker: React.FC<TrackerProps> = ({ state, onAddLog }) => {
  // 3 ta bo'lim
  const [mode, setMode] = useState<'timer' | 'manual' | 'video'>('timer');

  // TIMER
  const [isActive, setIsActive] = useState(false);
  const [timer, setTimer] = useState(0);
  const countRef = useRef<number | null>(null);

  // --- LULLABY PLAYER STATE ---
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [currentTrackId, setCurrentTrackId] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoop, setIsLoop] = useState(false);
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);

  // MANUAL FORM STATE
  const [manualType, setManualType] = useState<'feeding' | 'sleep'>('feeding');
  const [manualDate, setManualDate] = useState(() => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
  });
  const [selectedFood, setSelectedFood] = useState<string>('');
  const [manualDuration, setManualDuration] = useState('');
  const [manualNote, setManualNote] = useState('');

  // VIDEO
  const [activeVideoId, setActiveVideoId] = useState<number>(VIDEOS[0].id);

  // --- Audio obyektini yaratish va eventlarni bir marta ulash ---
  useEffect(() => {
    const audio = new Audio();
    audioRef.current = audio;

    const handleLoadedMetadata = () => {
      setDuration(audio.duration || 0);
    };
    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime || 0);
    };
    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.pause();
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
    };
  }, []);

  // loop rejimini audio elementga ulash
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.loop = isLoop;
    }
  }, [isLoop]);

  const currentTrack: LullabyTrack | null =
    currentTrackId != null ? LULLABIES.find((t) => t.id === currentTrackId) || null : null;

  // --- TIMER FUNKSIYALARI ---
  const formatTimer = (seconds: number) => {
    const getSeconds = `0${seconds % 60}`.slice(-2);
    const minutes = Math.floor(seconds / 60);
    const getMinutes = `0${minutes % 60}`.slice(-2);
    const getHours = `0${Math.floor(seconds / 3600)}`.slice(-2);
    return `${getHours}:${getMinutes}:${getSeconds}`;
  };

  const handleStart = () => {
    if (isActive) return;
    setIsActive(true);
    countRef.current = window.setInterval(() => {
      setTimer((t) => t + 1);
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
        startTime,
        endTime: new Date().toISOString(),
        details: { notes: `${formatTimer(timer)} uxladi` },
      };
      onAddLog(newLog);
      await saveLogToFirebase(newLog);
    }
    setTimer(0);
  };

  const handlePauseTimer = () => {
    if (countRef.current) window.clearInterval(countRef.current);
    setIsActive(false);
  };

  // --- LULLABY PLAYER FUNKSIYALARI ---

  function playTrack(trackId: number) {
    const track = LULLABIES.find((t) => t.id === trackId);
    if (!track || !audioRef.current) return;

    const audio = audioRef.current;
    audio.src = track.url;
    audio.currentTime = 0;
    setDuration(0);
    setCurrentTime(0);
    audio
      .play()
      .then(() => {
        setIsPlaying(true);
        setCurrentTrackId(trackId);
        setShowDownloadMenu(false);
      })
      .catch(() => {
        // brauzer autoplay bloklasa jim o'tamiz
      });
  }

  const handlePlayPause = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (!currentTrackId) {
      if (LULLABIES[0]) playTrack(LULLABIES[0].id);
      return;
    }

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio
        .play()
        .then(() => setIsPlaying(true))
        .catch(() => {});
    }
  };

  const handleNextTrack = () => {
    if (!LULLABIES.length) return;
    if (!currentTrackId) {
      playTrack(LULLABIES[0].id);
      return;
    }
    const index = LULLABIES.findIndex((t) => t.id === currentTrackId);
    const nextIndex = (index + 1) % LULLABIES.length;
    playTrack(LULLABIES[nextIndex].id);
  };

  const handlePrevTrack = () => {
    if (!LULLABIES.length) return;
    if (!currentTrackId) {
      playTrack(LULLABIES[0].id);
      return;
    }
    const index = LULLABIES.findIndex((t) => t.id === currentTrackId);
    const prevIndex = (index - 1 + LULLABIES.length) % LULLABIES.length;
    playTrack(LULLABIES[prevIndex].id);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = value;
    }
    setCurrentTime(value);
  };

  const handleToggleLoop = () => {
    setIsLoop((prev) => !prev);
  };

  // --- MANUAL SUBMIT ---
  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!state.activeBabyId) {
      alert('Xatolik: Bola tanlanmagan!');
      return;
    }

    if (manualType === 'feeding' && !selectedFood) {
      alert('Iltimos, nima yeganini tanlang!');
      return;
    }

    if (manualType === 'sleep' && (!manualDuration || parseInt(manualDuration) <= 0)) {
      alert("Iltimos, qancha uxlaganini (daqiqa) kiriting!");
      return;
    }

    let startTime = new Date(manualDate);
    const durationMin = manualType === 'sleep' ? parseInt(manualDuration) : 15;
    let endTime = new Date(startTime.getTime() + durationMin * 60000);

    const now = new Date();
    if (endTime.getTime() > now.getTime() + 60000 && manualType === 'sleep') {
      endTime = new Date(manualDate);
      startTime = new Date(endTime.getTime() - durationMin * 60000);
    }

    let finalNote = manualNote;
    if (manualType === 'feeding') {
      const foodLabel = FOOD_TYPES.find((f) => f.id === selectedFood)?.label;
      finalNote = `${foodLabel} yedi. ${manualNote}`;
    } else if (manualType === 'sleep') {
      const hours = Math.floor(durationMin / 60);
      const mins = durationMin % 60;
      const timeText = `${hours > 0 ? hours + ' soat ' : ''}${mins} daqiqa`;
      finalNote = `${timeText} uxladi (qo'lda). ${manualNote}`;
    }

    const logDetails: any = {
      notes: finalNote.trim(),
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
      details: logDetails,
    };

    try {
      onAddLog(newLog);
      await saveLogToFirebase(newLog);
      setManualNote('');
      setManualDuration('');
      setSelectedFood('');
      alert("Ma'lumot saqlandi! ✅");
    } catch (err) {
      console.error('Saqlashda xatolik:', err);
      alert('Saqlashda xatolik yuz berdi.');
    }
  };

  useEffect(() => {
    return () => {
      if (countRef.current) window.clearInterval(countRef.current);
    };
  }, []);

  // VIDEO rejimi
  const activeVideo = VIDEOS.find((v) => v.id === activeVideoId) || VIDEOS[0];
  const activeVideoYoutubeId = extractYouTubeId(activeVideo.url);

  return (
    <div className="p-4 pb-24 min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* TABLAR */}
      <div className="flex bg-white dark:bg-gray-800 p-1 rounded-2xl shadow-sm mb-6">
        <button
          onClick={() => setMode('timer')}
          className={`flex-1 py-3 rounded-xl text-xs sm:text-sm font-bold transition-all ${
            mode === 'timer' ? 'bg-indigo-500 text-white shadow-md' : 'text-gray-400'
          }`}
        >
          Uyqu Taymeri 🌙
        </button>
        <button
          onClick={() => setMode('manual')}
          className={`flex-1 py-3 rounded-xl text-xs sm:text-sm font-bold transition-all ${
            mode === 'manual' ? 'bg-blue-500 text-white shadow-md' : 'text-gray-400'
          }`}
        >
          Qo'lda kiritish ✍️
        </button>
        <button
          onClick={() => setMode('video')}
          className={`flex-1 py-3 rounded-xl text-xs sm:text-sm font-bold transition-all ${
            mode === 'video' ? 'bg-rose-500 text-white shadow-md' : 'text-gray-400'
          }`}
        >
          Video 🎥
        </button>
      </div>

      {/* --- TIMER MODE --- */}
      {mode === 'timer' && (
        <>
          <div className="bg-indigo-600 dark:bg-indigo-900 rounded-[2rem] p-8 shadow-lg text-center mb-6 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -mr-10 -mt-10"></div>
            <div className="relative z-10">
              <div className="text-indigo-200 text-sm font-bold uppercase tracking-widest mb-2">
                UYQU VAQTI
              </div>
              <h1 className="text-5xl font-mono font-bold tracking-wider tabular-nums mb-6">
                {formatTimer(timer)}
              </h1>
              <div className="flex justify-center gap-4">
                {!isActive && timer === 0 ? (
                  <button
                    onClick={handleStart}
                    className="bg-white text-indigo-600 px-8 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg active:scale-95 transition-transform"
                  >
                    <Play size={20} fill="currentColor" /> Boshlash
                  </button>
                ) : (
                  <>
                    {isActive ? (
                      <button
                        onClick={handlePauseTimer}
                        className="bg-indigo-400/50 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 border border-white/20"
                      >
                        <Pause size={20} fill="currentColor" />
                      </button>
                    ) : (
                      <button
                        onClick={handleStart}
                        className="bg-green-400 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2"
                      >
                        <Play size={20} fill="currentColor" />
                      </button>
                    )}
                    <button
                      onClick={handleStop}
                      className="bg-red-500 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg"
                    >
                      <Square size={20} fill="currentColor" /> Tugatish
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-3xl p-5 shadow-sm">
            <h3 className="font-bold text-gray-700 dark:text-gray-200 mb-4 flex items-center gap-2">
              <Music size={20} className="text-pink-500" /> Tinchlantiruvchi kuylar
            </h3>

            {/* GLOBAL PLEER */}
            {currentTrack && (
              <div className="mb-4 rounded-2xl bg-gray-50 dark:bg-gray-700/60 p-3">
                <p className="text-xs text-gray-500 dark:text-gray-300 mb-2 line-clamp-1">
                  O'ynalayotgan:{' '}
                  <span className="font-semibold text-gray-800 dark:text-gray-100">
                    {currentTrack.title}
                  </span>
                </p>

                <div className="flex items-center gap-2 text-[10px] text-gray-400 mb-1">
                  <span className="w-8 text-left">{formatShortTime(currentTime)}</span>
                  <input
                    type="range"
                    min={0}
                    max={duration || 0}
                    step={0.5}
                    value={Math.min(currentTime, duration || 0)}
                    onChange={handleSeek}
                    className="flex-1 accent-pink-500"
                  />
                  <span className="w-8 text-right">{formatShortTime(duration)}</span>
                </div>

                <div className="flex items-center justify-between mt-2">
                  {/* Repeat */}
                  <button
                    type="button"
                    onClick={handleToggleLoop}
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs border transition-colors ${
                      isLoop
                        ? 'bg-pink-500 text-white border-pink-500'
                        : 'bg-white text-gray-500 border-gray-200'
                    }`}
                  >
                    <Repeat size={16} />
                  </button>

                  {/* Prev / Play / Next */}
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={handlePrevTrack}
                      className="w-8 h-8 rounded-full flex items-center justify-center bg-white text-gray-600 border border-gray-200 shadow-sm"
                    >
                      <SkipBack size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={handlePlayPause}
                      className="w-10 h-10 rounded-full flex items-center justify-center bg-pink-500 text-white shadow-md"
                    >
                      {isPlaying ? <Pause size={18} /> : <Play size={18} className="ml-0.5" />}
                    </button>
                    <button
                      type="button"
                      onClick={handleNextTrack}
                      className="w-8 h-8 rounded-full flex items-center justify-center bg-white text-gray-600 border border-gray-200 shadow-sm"
                    >
                      <SkipForward size={16} />
                    </button>
                  </div>

                  {/* 3 nuqta + Yuklab olish */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowDownloadMenu((prev) => !prev)}
                      className="w-8 h-8 rounded-full flex items-center justify-center bg-white text-gray-600 border border-gray-200 shadow-sm"
                    >
                      <MoreVertical size={16} />
                    </button>
                    {showDownloadMenu && (
                      <div className="absolute right-0 top-9 z-20 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 py-1 text-xs">
                        <a
                          href={currentTrack.url}
                          download
                          className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200"
                          onClick={() => setShowDownloadMenu(false)}
                        >
                          <Download size={14} />
                          Yuklab olish
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* QO'SHIQLAR RO'YXATI */}
            <div className="space-y-3">
              {LULLABIES.map((song) => {
                const isCurrent = song.id === currentTrackId;
                const isCurrentPlaying = isCurrent && isPlaying;

                return (
                  <div
                    key={song.id}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          isCurrentPlaying
                            ? 'bg-pink-500 text-white animate-pulse'
                            : 'bg-gray-200 text-gray-500'
                        }`}
                      >
                        <Music size={16} />
                      </div>
                      <span className="text-sm font-bold text-gray-700 dark:text-gray-200">
                        {song.title}
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        if (isCurrent) {
                          handlePlayPause();
                        } else {
                          playTrack(song.id);
                        }
                      }}
                      className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                        isCurrentPlaying
                          ? 'bg-pink-100 text-pink-600'
                          : 'bg-white shadow-sm text-gray-700'
                      }`}
                    >
                      {isCurrentPlaying ? (
                        <Pause size={18} fill="currentColor" />
                      ) : (
                        <Play size={18} fill="currentColor" className="ml-1" />
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* --- MANUAL MODE --- */}
      {mode === 'manual' && (
        <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-sm border border-gray-100">
          <form onSubmit={handleManualSubmit} className="space-y-6">
            <div>
              <label className="text-xs font-bold text-gray-400 uppercase ml-1 block mb-2">
                Nimani kiritamiz?
              </label>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setManualType('feeding')}
                  className={`flex-1 py-4 rounded-2xl flex flex-col items-center gap-2 border-2 transition-all ${
                    manualType === 'feeding'
                      ? 'border-pink-500 bg-pink-50 text-pink-600'
                      : 'border-gray-100 bg-gray-50 text-gray-400'
                  }`}
                >
                  <Utensils size={24} /> <span className="font-bold text-sm">Ovqat</span>
                </button>
                <button
                  type="button"
                  onClick={() => setManualType('sleep')}
                  className={`flex-1 py-4 rounded-2xl flex flex-col items-center gap-2 border-2 transition-all ${
                    manualType === 'sleep'
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-600'
                      : 'border-gray-100 bg-gray-50 text-gray-400'
                  }`}
                >
                  <Moon size={24} /> <span className="font-bold text-sm">Uyqu</span>
                </button>
              </div>
            </div>

            {manualType === 'feeding' && (
              <div className="animate-fade-in">
                <label className="text-xs font-bold text-gray-400 uppercase ml-1 block mb-2">
                  Nima yedi/ichdi?
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {FOOD_TYPES.map((food) => (
                    <button
                      key={food.id}
                      type="button"
                      onClick={() => setSelectedFood(food.id)}
                      className={`p-3 rounded-xl flex flex-col items-center justify-center gap-2 border transition-all ${
                        selectedFood === food.id
                          ? 'bg-blue-500 text-white border-blue-500 shadow-md'
                          : 'bg-gray-50 border-gray-100 text-gray-500'
                      }`}
                    >
                      <div className={selectedFood === food.id ? 'text-white' : 'text-blue-500'}>
                        {food.icon}
                      </div>
                      <span className="text-[10px] font-bold text-center leading-tight">
                        {food.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div>
              <label className="text-xs font-bold text-gray-400 uppercase ml-1 block mb-2">
                Vaqti
              </label>
              <input
                type="datetime-local"
                required
                value={manualDate}
                onChange={(e) => setManualDate(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 text-gray-800 font-medium outline-none focus:border-blue-500"
              />
            </div>

            {manualType === 'sleep' && (
              <div className="animate-fade-in">
                <label className="text-xs font-bold text-gray-400 uppercase ml-1 block mb-2">
                  Qancha uxladi (daqiqa)? <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  placeholder="Masalan: 60"
                  required
                  min="1"
                  value={manualDuration}
                  onChange={(e) => setManualDuration(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 text-gray-800 font-medium outline-none focus:border-blue-500"
                />
              </div>
            )}

            <div>
              <label className="text-xs font-bold text-gray-400 uppercase ml-1 block mb-2">
                Qo'shimcha izoh
              </label>
              <textarea
                rows={2}
                placeholder="Muhim narsa bo'ldimi?"
                value={manualNote}
                onChange={(e) => setManualNote(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 text-gray-800 font-medium outline-none focus:border-blue-500 resize-none"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold text-lg shadow-lg shadow-blue-200 flex items-center justify-center gap-2 active:scale-95 transition-transform"
            >
              <Check size={20} /> Saqlash
            </button>
          </form>
        </div>
      )}

      {/* --- VIDEO MODE --- */}
      {mode === 'video' && (
        <div className="space-y-5">
          <div className="bg-white dark:bg-gray-800 rounded-3xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-gray-800 dark:text-white flex items-center gap-2">
                <VideoIcon size={20} className="text-rose-500" />
                Bolalar uchun videolar
              </h3>
              <span className="text-[10px] bg-rose-50 text-rose-500 px-2 py-1 rounded-full font-semibold">
                10 ta video
              </span>
            </div>

            {activeVideoYoutubeId ? (
              <div className="w-full aspect-video rounded-2xl overflow-hidden bg-black">
                <iframe
                  className="w-full h-full"
                  src={`https://www.youtube.com/embed/${activeVideoYoutubeId}`}
                  title={activeVideo.title}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                ></iframe>
              </div>
            ) : (
              <div className="w-full aspect-video rounded-2xl bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-xs text-gray-500">
                Video linkida xatolik bor.
              </div>
            )}

            <p className="text-[11px] text-gray-400 mt-2">
              Diqqat: bola ekranga juda yaqin o‘tirmasin. 15–20 daqiqadan so‘ng ko‘zlariga dam
              bering.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-3xl p-4 shadow-sm">
            <h4 className="text-xs font-bold text-gray-400 uppercase mb-3">Video ro'yxati</h4>
            <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
              {VIDEOS.map((video) => {
                const vidId = extractYouTubeId(video.url);
                const thumb = vidId && `https://img.youtube.com/vi/${vidId}/mqdefault.jpg`;
                const isActive = video.id === activeVideoId;

                return (
                  <button
                    key={video.id}
                    type="button"
                    onClick={() => setActiveVideoId(video.id)}
                    className={`w-full flex items-center gap-3 p-2 rounded-2xl border transition-all text-left ${
                      isActive
                        ? 'border-rose-500 bg-rose-50 dark:bg-rose-900/20'
                        : 'border-gray-100 bg-gray-50 dark:bg-gray-800'
                    }`}
                  >
                    <div className="w-16 h-10 rounded-xl overflow-hidden bg-gray-200 flex-shrink-0">
                      {thumb ? (
                        <img src={thumb} alt={video.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400 text-[10px]">
                          No image
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-[13px] font-semibold text-gray-800 dark:text-white line-clamp-2">
                        {video.title}
                      </p>
                      <p className="text-[10px] text-gray-400 mt-0.5">
                        {video.url.replace('https://www.', '').slice(0, 40)}...
                      </p>
                    </div>
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center ${
                        isActive ? 'bg-rose-500 text-white' : 'bg-white text-gray-600 shadow-sm'
                      }`}
                    >
                      <PlayCircle size={18} />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};