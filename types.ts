export type LogType = 'feeding' | 'sleep' | 'diaper' | 'growth' | 'health';

export interface Baby {
  id: string;
  name: string;
  gender: 'boy' | 'girl' | 'other';
  dob: string; // ISO date string
  weight?: number; // kg
  height?: number; // cm
  photoUrl?: string;
}

export interface Log {
  id: string;
  babyId: string;
  type: LogType;
  startTime: string; // ISO date string
  endTime?: string; // For sleep or duration feeding
  details: {
    subType?: 'breast_left' | 'breast_right' | 'bottle' | 'solid' | 'wet' | 'dirty' | 'mixed';
    amount?: number; // ml for bottle
    weight?: number; // kg
    height?: number; // cm
    notes?: string;
  };
}

export interface User {
  id: string;
  name: string;
  email: string;
  photoUrl?: string;
}

export interface AppState {
  user: User | null;
  babies: Baby[];
  activeBabyId: string | null;
  logs: Log[];
  theme: 'light' | 'dark';
}

export enum Tab {
  HOME = 'home',
  TRACKER = 'tracker',
  CALENDAR = 'calendar',
  AI_HELP = 'ai_help',
  SETTINGS = 'settings',
}
