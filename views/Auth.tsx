import React, { useState } from 'react';
import { generateId } from '../services/storage';
import { User, Baby } from '../types';
import { Button } from '../components/Button';
import { Baby as BabyIcon, Mail, Lock, User as UserIcon, Loader2, Calendar } from 'lucide-react';
import { auth, googleProvider } from '../services/firebaseConfig';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  updateProfile 
} from 'firebase/auth';

interface AuthProps {
  onLogin: (user: User) => void;
  onCompleteOnboarding: (baby: Baby) => Promise<void>; 
  // YANGI QATOR: Boshlang'ich qadamni qabul qilish
  initialStep?: 'login' | 'signup' | 'onboarding'; 
}

// initialStep ni qabul qilib olamiz va default 'login' qilamiz
export const Auth: React.FC<AuthProps> = ({ onLogin, onCompleteOnboarding, initialStep = 'login' }) => {
  // useState ga kelgan initialStep ni beramiz
  const [step, setStep] = useState<'login' | 'signup' | 'onboarding'>(initialStep);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // User Forms
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Baby Forms
  const [babyName, setBabyName] = useState('');
  const [gender, setGender] = useState<'boy' | 'girl'>('boy');
  const [dob, setDob] = useState('');

  // --- 1. GOOGLE ORQALI KIRISH ---
  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log("Google login boshlandi..."); 
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      
      console.log("Google login muvaffaqiyatli:", user.email);

      const appUser: User = {
        id: user.uid,
        name: user.displayName || 'Foydalanuvchi',
        email: user.email || '',
        photoUrl: user.photoURL || undefined
      };
      
      onLogin(appUser);
      // Agar login o'xshasa, App.tsx o'zi tekshiradi va agar bola yo'q bo'lsa
      // qaytadan Auth ni 'onboarding' rejimid ochadi.
    } catch (err: any) {
      console.error("Google Error:", err);
      if (err.code === 'auth/popup-closed-by-user') {
          setError("Jarayon yakunlanmay yopildi.");
      } else if (err.code === 'auth/cancelled-popup-request') {
          setError("Jarayon bekor qilindi.");
      } else {
          setError("Google xatosi: " + err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  // --- 2. EMAIL/PAROL ORQALI KIRISH ---
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      let firebaseUser;
      
      if (step === 'signup') {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        firebaseUser = userCredential.user;
        await updateProfile(firebaseUser, { displayName: name });
      } else {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        firebaseUser = userCredential.user;
      }

      const appUser: User = {
        id: firebaseUser.uid,
        name: firebaseUser.displayName || name || 'Foydalanuvchi',
        email: firebaseUser.email || '',
      };

      onLogin(appUser);

    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/email-already-in-use') {
        setError("Bu email allaqachon band.");
      } else if (err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
        setError("Email yoki parol noto'g'ri.");
      } else {
        setError("Xatolik: " + err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  // --- 3. BOLA MA'LUMOTLARINI SAQLASH ---
  const handleBabySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
        const newBaby: Baby = {
          id: generateId(),
          name: babyName,
          gender,
          dob,
          photoUrl: `https://picsum.photos/200/200?random=${Math.floor(Math.random() * 1000)}`
        };
        
        await onCompleteOnboarding(newBaby);
        
    } catch (err: any) {
        console.error(err);
        setError("Saqlashda xatolik: " + err.message);
        setLoading(false);
    }
  };

  // --- ONBOARDING UI ---
  if (step === 'onboarding') {
    return (
      <div className="min-h-screen bg-white px-6 pt-12 pb-6 flex flex-col">
        <div className="flex-1 flex flex-col justify-center">
            <div className="mb-8 text-center">
                <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <BabyIcon size={40} />
                </div>
                <h2 className="text-3xl font-black text-gray-800">Farzandingiz</h2>
                <p className="text-gray-500 mt-2">Ma'lumotlarni monitoring qilish uchun bolangiz profilini yarating.</p>
            </div>

            <form onSubmit={handleBabySubmit} className="space-y-5">
                <div className="bg-gray-50 rounded-2xl p-2 border border-gray-100">
                    <input 
                        type="text" required placeholder="Ismi (Masalan: Ali)"
                        className="w-full bg-transparent p-4 outline-none font-semibold text-gray-800 placeholder-gray-400"
                        value={babyName} onChange={(e) => setBabyName(e.target.value)}
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    {(['boy', 'girl'] as const).map((g) => (
                        <button key={g} type="button" onClick={() => setGender(g)}
                            className={`p-4 rounded-2xl font-bold border-2 transition-all ${gender === g ? (g === 'boy' ? 'border-blue-500 bg-blue-50 text-blue-600' : 'border-pink-500 bg-pink-50 text-pink-600') : 'border-gray-100 bg-gray-50 text-gray-400'}`}>
                            {g === 'boy' ? 'O\'g\'il 👦' : 'Qiz 👧'}
                        </button>
                    ))}
                </div>

                <div className="bg-gray-50 rounded-2xl p-2 border border-gray-100 flex items-center px-4">
                    <Calendar className="text-gray-400 mr-2" />
                    <input 
                        type="date" required
                        className="w-full bg-transparent p-4 outline-none font-semibold text-gray-800"
                        value={dob} onChange={(e) => setDob(e.target.value)}
                    />
                </div>
                
                <Button type="submit" disabled={loading} size="lg" className="w-full bg-blue-600 rounded-2xl py-4 text-lg shadow-lg shadow-blue-200 mt-6">
                     {loading ? <Loader2 className="animate-spin mx-auto"/> : "Davom etish"}
                </Button>
            </form>
        </div>
      </div>
    );
  }

  // --- LOGIN / SIGNUP UI ---
  return (
    <div className="min-h-screen bg-white px-8 flex flex-col justify-center">
        
        <div className="mb-10">
            <h1 className="text-4xl font-black text-blue-600 mb-2">KinderSafe</h1>
            <h2 className="text-2xl font-bold text-gray-800">
                {step === 'login' ? 'Xush kelibsiz!' : 'Yangi hisob yaratish'}
            </h2>
            <p className="text-gray-400 mt-1">
                {step === 'login' ? 'Profilingizga kiring' : 'Barchasi bepul va xavfsiz'}
            </p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-red-50 text-red-500 text-sm font-medium border border-red-100">
            {error}
          </div>
        )}

        <form onSubmit={handleAuthSubmit} className="space-y-4">
            {step === 'signup' && (
                <div className="bg-gray-50 rounded-2xl flex items-center px-5 py-1 border border-transparent focus-within:border-blue-500 transition-colors">
                    <UserIcon className="text-gray-400" size={20}/>
                    <input type="text" placeholder="To'liq ismingiz" required value={name} onChange={e => setName(e.target.value)} className="w-full bg-transparent p-4 outline-none font-semibold text-gray-700 placeholder-gray-400"/>
                </div>
            )}
            
            <div className="bg-gray-50 rounded-2xl flex items-center px-5 py-1 border border-transparent focus-within:border-blue-500 transition-colors">
                <Mail className="text-gray-400" size={20}/>
                <input type="email" placeholder="Email manzilingiz" required value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-transparent p-4 outline-none font-semibold text-gray-700 placeholder-gray-400"/>
            </div>

            <div className="bg-gray-50 rounded-2xl flex items-center px-5 py-1 border border-transparent focus-within:border-blue-500 transition-colors">
                <Lock className="text-gray-400" size={20}/>
                <input type="password" placeholder="Parol" required value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-transparent p-4 outline-none font-semibold text-gray-700 placeholder-gray-400"/>
            </div>

            {step === 'login' && (
                <div className="text-right">
                    <button type="button" className="text-sm font-bold text-blue-500">Parolni unutdingizmi?</button>
                </div>
            )}

            <Button type="submit" disabled={loading} size="lg" className="w-full bg-blue-600 rounded-2xl py-4 text-lg font-bold shadow-xl shadow-blue-100 mt-4">
                {loading ? <Loader2 className="animate-spin mx-auto"/> : (step === 'login' ? 'Kirish' : "Ro'yxatdan o'tish")}
            </Button>
        </form>

        <div className="mt-8 text-center">
            <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-gray-100"></div>
                <span className="flex-shrink-0 mx-4 text-gray-300 text-sm font-bold">YOKI</span>
                <div className="flex-grow border-t border-gray-100"></div>
            </div>

            <button 
                type="button" 
                onClick={handleGoogleLogin} 
                disabled={loading}
                className="w-full mt-4 bg-white border-2 border-gray-100 py-4 rounded-2xl font-bold text-gray-700 flex items-center justify-center gap-3 active:scale-95 transition-transform"
            >
                {loading ? <Loader2 className="animate-spin"/> : (
                    <>
                        <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-6 h-6" alt="google"/>
                        Google orqali
                    </>
                )}
            </button>
        </div>

        <div className="mt-8 text-center">
            <p className="text-gray-500 font-medium">
                {step === 'login' ? "Hisobingiz yo'qmi?" : "Hisobingiz bormi?"} 
                <button 
                    type="button" 
                    onClick={() => setStep(step === 'login' ? 'signup' : 'login')} 
                    className="ml-2 text-blue-600 font-bold"
                >
                    {step === 'login' ? "Ro'yxatdan o'tish" : "Kirish"}
                </button>
            </p>
        </div>
    </div>
  );
};