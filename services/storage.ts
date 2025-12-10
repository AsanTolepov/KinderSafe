import { AppState } from '../types';

const STORAGE_KEY = 'baby_steps_data_v1';

const initialState: AppState = {
  user: null,
  babies: [],
  activeBabyId: null,
  logs: [],
  theme: 'light',
};

export const loadState = (): AppState => {
  try {
    const serializedState = localStorage.getItem(STORAGE_KEY);
    if (serializedState === null) {
      return initialState;
    }
    return JSON.parse(serializedState);
  } catch (err) {
    console.error('Could not load state', err);
    return initialState;
  }
};

export const saveState = (state: AppState) => {
  try {
    const serializedState = JSON.stringify(state);
    localStorage.setItem(STORAGE_KEY, serializedState);
  } catch (err) {
    console.error('Could not save state', err);
  }
};

export const generateId = (): string => {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};