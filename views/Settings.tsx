import React, { useState } from 'react';
import { AppState, Baby } from '../types';
import { Moon, Sun, LogOut, User as UserIcon, Plus, Globe, Smile, X, Check, Trash2 } from 'lucide-react';

interface SettingsProps {
  state: AppState;
  onLogout: () => void;
  onToggleTheme: () => void;
  onAddBaby: (baby: Baby) => void;
  onSwitchBaby: (id: string) => void;
  onDeleteBaby: (id: string) => void; // O'chirish funksiyasi prop sifatida keladi
}

export const Settings: React.FC<SettingsProps> = ({ state, onLogout, onToggleTheme, onAddBaby, onSwitchBaby, onDeleteBaby }) => {
  const [lang, setLang] = useState<'uz' | 'en' | 'ru'>('uz');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Yangi bola qo'shish uchun form state
  const [newBabyName, setNewBabyName] = useState('');
  const [newBabyDob, setNewBabyDob] = useState('');
  const [newBabyGender, setNewBabyGender] = useState<'boy' | 'girl' | 'other'>('boy');

  // Tarjimalar lug'ati
  const t = {
    uz: { title: 'Sozlamalar', lang: 'Til', theme: 'Tungi rejim', notif: 'Bildirishnomalar', kids: 'Farzandlarim', add: 'Bola qo\'shish', logout: 'Chiqish', active: 'Tanlangan', switch: 'Tanlash', save: 'Saqlash', cancel: 'Bekor qilish', name: 'Ismi', dob: 'Tug\'ilgan kuni', boy: "O'g'il", girl: "Qiz", delete: "O'chirish", sure: "Haqiqatan ham o'chirmoqchimisiz?", minWarning: "Kamida bitta bola qolishi kerak!" },
    en: { title: 'Settings', lang: 'Language', theme: 'Dark Mode', notif: 'Notifications', kids: 'My Children', add: 'Add Child', logout: 'Log Out', active: 'Active', switch: 'Select', save: 'Save', cancel: 'Cancel', name: 'Name', dob: 'Date of Birth', boy: "Boy", girl: "Girl", delete: "Delete", sure: "Are you sure you want to delete?", minWarning: "At least one child is required!" },
    ru: { title: 'Настройки', lang: 'Язык', theme: 'Темный режим', notif: 'Уведомления', kids: 'Мои дети', add: 'Добавить', logout: 'Выйти', active: 'Активный', switch: 'Выбрать', save: 'Сохранить', cancel: 'Отмена', name: 'Имя', dob: 'Дата рождения', boy: "Мальчик", girl: "Девочка", delete: "Удалить", sure: "Вы действительно хотите удалить?", minWarning: "Должен остаться хотя бы один ребенок!" }
  };

  const txt = t[lang];

  const handleSaveBaby = () => {
    if (!newBabyName || !newBabyDob) return;

    const newBaby: Baby = {
      id: Date.now().toString(),
      name: newBabyName,
      dob: newBabyDob,
      gender: newBabyGender,
      photoUrl: ''
    };

    onAddBaby(newBaby);
    setIsModalOpen(false);
    
    // Formani tozalash
    setNewBabyName('');
    setNewBabyDob('');
    setNewBabyGender('boy');
  };

  // O'chirishni boshqarish
  const handleDeleteClick = (e: React.MouseEvent, babyId: string) => {
    e.stopPropagation(); // Bu juda muhim: qator bosilib ketmasligi va "Switch" bo'lib ketmasligi uchun
    
    // Oxirgi bolani o'chirib yubormaslik uchun tekshiruv (xohishga ko'ra olib tashlashingiz mumkin)
    if (state.babies.length <= 1) {
      alert(txt.minWarning);
      return;
    }

    if (window.confirm(txt.sure)) {
      onDeleteBaby(babyId);
    }
  };

  return (
    <div className="min-h-screen pt-6 px-4 pb-36 max-w-md mx-auto animate-fade-in">
      <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white">{txt.title}</h2>

      {/* Profile Card */}
      <div className="bg-white dark:bg-gray-800 p-5 rounded-3xl shadow-sm mb-6 flex items-center gap-4">
        <div className="w-14 h-14 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-300 text-xl font-bold">
           {state.user?.name ? state.user.name.charAt(0).toUpperCase() : <UserIcon />}
        </div>
        <div>
          <h3 className="font-bold text-lg text-gray-800 dark:text-white">{state.user?.name}</h3>
          <p className="text-gray-500 dark:text-gray-400 text-sm">{state.user?.email}</p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Settings Group */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-sm">
          {/* Language Switcher */}
          <div className="p-4 border-b border-gray-100 dark:border-gray-700">
             <div className="flex items-center gap-2 mb-3 text-gray-400 text-xs uppercase tracking-wider font-bold">
                <Globe size={14} /> {txt.lang}
             </div>
             <div className="flex bg-gray-100 dark:bg-gray-700 p-1 rounded-xl">
                {(['uz', 'en', 'ru'] as const).map((l) => (
                  <button
                    key={l}
                    onClick={() => setLang(l)}
                    className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${
                      lang === l 
                        ? 'bg-white dark:bg-gray-600 shadow-sm text-blue-600 dark:text-white' 
                        : 'text-gray-500 dark:text-gray-400'
                    }`}
                  >
                    {l.toUpperCase()}
                  </button>
                ))}
             </div>
          </div>

          {/* Theme Toggle */}
          <button onClick={onToggleTheme} className="w-full p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-full ${state.theme === 'dark' ? 'bg-purple-100 text-purple-600' : 'bg-orange-100 text-orange-500'}`}>
                {state.theme === 'dark' ? <Moon size={18} /> : <Sun size={18} />}
              </div>
              <span className="text-gray-800 dark:text-white font-medium">{txt.theme}</span>
            </div>
            <div className={`w-11 h-6 rounded-full p-1 transition-colors duration-300 ${state.theme === 'dark' ? 'bg-blue-600' : 'bg-gray-300'}`}>
              <div className={`w-4 h-4 bg-white rounded-full shadow-sm transform transition-transform duration-300 ${state.theme === 'dark' ? 'translate-x-5' : ''}`}></div>
            </div>
          </button>
        </div>

        {/* Children List */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-sm">
           <div className="p-4 border-b border-gray-100 dark:border-gray-700 font-bold text-gray-400 text-xs uppercase tracking-wider">
            {txt.kids}
          </div>
          
          {state.babies.map(baby => {
            const isActive = baby.id === state.activeBabyId;
            return (
              <div 
                key={baby.id} 
                onClick={() => !isActive && onSwitchBaby(baby.id)}
                className={`p-4 border-b border-gray-50 dark:border-gray-700 last:border-0 flex items-center gap-3 cursor-pointer transition-colors ${isActive ? 'bg-blue-50/50 dark:bg-blue-900/10' : 'hover:bg-gray-50 dark:hover:bg-gray-700'}`}
              >
                {/* Avatar */}
                {baby.photoUrl ? (
                  <img src={baby.photoUrl} className="w-10 h-10 rounded-full bg-gray-200 object-cover" alt={baby.name} />
                ) : (
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${baby.gender === 'girl' ? 'bg-pink-100 text-pink-500' : 'bg-blue-100 text-blue-500'}`}>
                    <Smile size={20} />
                  </div>
                )}
                
                {/* Info */}
                <div className="flex-1">
                  <p className="font-bold text-gray-800 dark:text-white">{baby.name}</p>
                  <p className="text-xs text-gray-500">{baby.dob}</p>
                </div>

                {/* Status & Actions */}
                <div className="flex items-center gap-2">
                  {/* Active Badge or Switch Text */}
                  {isActive ? (
                    <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 px-2 py-1 rounded-full font-bold flex items-center gap-1">
                      <Check size={12} /> <span className="hidden sm:inline">{txt.active}</span>
                    </span>
                  ) : (
                    <span className="text-xs text-gray-400 font-medium hidden sm:inline">{txt.switch}</span>
                  )}

                  {/* Delete Button - ENDI HAMMA UCHUN KO'RINADI */}
                  <button 
                    onClick={(e) => handleDeleteClick(e, baby.id)}
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors z-10"
                    title={txt.delete}
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            );
          })}

          <button 
            onClick={() => setIsModalOpen(true)}
            className="w-full p-4 text-blue-600 dark:text-blue-400 font-bold text-sm hover:bg-gray-50 dark:hover:bg-gray-700 text-left flex items-center gap-2"
          >
            <Plus size={18} /> {txt.add}
          </button>
        </div>

        {/* Logout Button */}
        <button 
            onClick={onLogout}
            className="w-full mt-6 bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-400 p-4 rounded-2xl flex items-center justify-center gap-2 font-bold hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
        >
          <LogOut size={18} /> {txt.logout}
        </button>
      </div>

      {/* --- MODAL (POPUP) --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-gray-800 w-full max-w-sm rounded-3xl p-6 shadow-2xl animate-scale-up">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-800 dark:text-white">{txt.add}</h3>
              <button onClick={() => setIsModalOpen(false)} className="p-2 bg-gray-100 dark:bg-gray-700 rounded-full text-gray-500">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">{txt.name}</label>
                <input 
                  type="text" 
                  value={newBabyName}
                  onChange={(e) => setNewBabyName(e.target.value)}
                  className="w-full p-3 bg-gray-50 dark:bg-gray-900 border-none rounded-xl focus:ring-2 focus:ring-blue-500 dark:text-white font-medium outline-none"
                  placeholder="Ali"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">{txt.dob}</label>
                <input 
                  type="date" 
                  value={newBabyDob}
                  onChange={(e) => setNewBabyDob(e.target.value)}
                  className="w-full p-3 bg-gray-50 dark:bg-gray-900 border-none rounded-xl focus:ring-2 focus:ring-blue-500 dark:text-white font-medium outline-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button 
                  onClick={() => setNewBabyGender('boy')}
                  className={`flex-1 p-3 rounded-xl border-2 font-bold flex justify-center gap-2 transition-all ${newBabyGender === 'boy' ? 'border-blue-500 bg-blue-50 text-blue-600' : 'border-transparent bg-gray-100 dark:bg-gray-700 text-gray-500'}`}
                >
                  👦 {txt.boy}
                </button>
                <button 
                  onClick={() => setNewBabyGender('girl')}
                  className={`flex-1 p-3 rounded-xl border-2 font-bold flex justify-center gap-2 transition-all ${newBabyGender === 'girl' ? 'border-pink-500 bg-pink-50 text-pink-600' : 'border-transparent bg-gray-100 dark:bg-gray-700 text-gray-500'}`}
                >
                  👧 {txt.girl}
                </button>
              </div>

              <button 
                onClick={handleSaveBaby}
                disabled={!newBabyName || !newBabyDob}
                className="w-full bg-blue-600 text-white p-4 rounded-xl font-bold mt-4 disabled:opacity-50 hover:bg-blue-700 shadow-lg shadow-blue-200 dark:shadow-none transition-all"
              >
                {txt.save}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};