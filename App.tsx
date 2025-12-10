import React, { useState, useEffect } from 'react';
import { AppState, Tab, User, Baby } from './types';
import { Auth } from './views/Auth';
import { Home } from './views/Home';
import { Tracker } from './views/Tracker';
import { Calendar } from './views/Calendar';
import { Settings } from './views/Settings';
import { BottomNav } from './components/BottomNav';
import { AiAssistant } from './views/AiAssistant';
import { subscribeToBabies, subscribeToLogs, saveBabyToFirebase } from './services/firestore';
import { onAuthStateChanged } from 'firebase/auth'; 
import { auth } from './services/firebaseConfig';
import { Loader2 } from 'lucide-react';

const App: React.FC = () => {
  const [state, setState] = useState<AppState>({
    user: null,
    babies: [],
    activeBabyId: null,
    logs: [],
    theme: 'light' // Boshlang'ich holat
  });
  
  const [currentTab, setCurrentTab] = useState<Tab>(Tab.HOME);
  const [authLoading, setAuthLoading] = useState(true);

  // --- DARK MODE LOGIKASI (YANGI) ---
  useEffect(() => {
    const root = window.document.documentElement;
    if (state.theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [state.theme]);

  const handleToggleTheme = () => {
    setState(prev => ({
      ...prev,
      theme: prev.theme === 'light' ? 'dark' : 'light'
    }));
  };
  // ----------------------------------

  // 1. Auth tekshiruvi
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        const appUser: User = {
          id: firebaseUser.uid,
          name: firebaseUser.displayName || 'Foydalanuvchi',
          email: firebaseUser.email || '',
          photoUrl: firebaseUser.photoURL || undefined
        };
        setState(prev => ({ ...prev, user: appUser }));
      } else {
        setState(prev => ({ ...prev, user: null, babies: [], logs: [], activeBabyId: null }));
      }
      setAuthLoading(false);
    });
    return () => unsubscribeAuth();
  }, []);

  // 2. Bolalarni yuklash
  useEffect(() => {
    if (state.user?.id) {
      const unsubscribeBabies = subscribeToBabies(state.user.id, (babies) => {
        setState(prev => {
          const currentActiveExists = babies.find(b => b.id === prev.activeBabyId);
          const newActiveId = currentActiveExists 
            ? prev.activeBabyId 
            : (babies.length > 0 ? babies[0].id : null);
            
          return { ...prev, babies, activeBabyId: newActiveId };
        });
      });
      return () => unsubscribeBabies();
    }
  }, [state.user?.id]);

  // 3. Loglarni yuklash
  useEffect(() => {
    if (state.activeBabyId) {
      setState(prev => ({ ...prev, logs: [] }));
      const unsubscribeLogs = subscribeToLogs(state.activeBabyId, (logs) => {
        setState(prev => ({ ...prev, logs }));
      });
      return () => unsubscribeLogs();
    } else {
        setState(prev => ({ ...prev, logs: [] }));
    }
  }, [state.activeBabyId]);

  const handleLogin = (user: User) => {
    setState(prev => ({ ...prev, user }));
  };

  const handleAddBaby = async (baby: Baby) => {
    if (state.user) {
        await saveBabyToFirebase(baby, state.user.id);
        setState(prev => ({ ...prev, activeBabyId: baby.id }));
    }
  };

  const handleSwitchBaby = (id: string) => {
      setState(prev => ({ ...prev, activeBabyId: id, logs: [] }));
  };

  const handleLogout = () => {
    auth.signOut();
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900">
        <Loader2 className="animate-spin text-blue-600 w-10 h-10" />
      </div>
    );
  }

  if (!state.user) {
    return <Auth onLogin={handleLogin} onCompleteOnboarding={handleAddBaby} initialStep="login" />;
  }

  if (state.babies.length === 0) {
     return <Auth onLogin={handleLogin} onCompleteOnboarding={handleAddBaby} initialStep="onboarding" />;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-white pb-20 transition-colors duration-300">
      <main className="h-full">
        {currentTab === Tab.HOME && <Home state={state} onNavigate={setCurrentTab} />}
        {currentTab === Tab.TRACKER && <Tracker state={state} onAddLog={(log) => setState(prev => ({...prev, logs: [log, ...prev.logs]}))} />}
        {currentTab === Tab.AI_HELP && <AiAssistant state={state} />}
        {currentTab === Tab.CALENDAR && <Calendar state={state} />}
        
        {currentTab === Tab.SETTINGS && (
            <Settings 
                state={state} 
                onLogout={handleLogout} 
                onToggleTheme={handleToggleTheme} // <-- MANA SHU YER TUZATILDI
                onAddBaby={handleAddBaby}
                onSwitchBaby={handleSwitchBaby}
                onDeleteBaby={() => {}} 
            />
        )}
      </main>
      <BottomNav currentTab={currentTab} onTabChange={setCurrentTab} />
    </div>
  );
};

export default App;