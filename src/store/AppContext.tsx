// ============================================================
// TeenGuard - Global App Context (State Management)
// ============================================================

import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useCallback,
  useRef,
  ReactNode,
} from 'react';
import { MMKV } from 'react-native-mmkv';
import {
  AppState,
  AppSettings,
  ChallengeState,
  GameSession,
  DailyStats,
  LockReason,
  DEFAULT_SETTINGS,
} from './types';
import { STORAGE_KEYS, DAY_RESET_HOUR } from '../constants/defaults';
import { initChallenge } from '../services/ChallengeService';
import { lockService } from '../services/LockService';

const storage = new MMKV({ id: 'teenguard_app_state' });

// ========== Actions ==========

type AppAction =
  | { type: 'SET_SETTINGS'; payload: Partial<AppSettings> }
  | { type: 'SET_MONITORING'; payload: boolean }
  | { type: 'SET_CURRENT_APP'; payload: { packageName: string; appName: string } }
  | { type: 'ADD_GAMING_SECONDS'; payload: number }
  | { type: 'ADD_SESSION'; payload: GameSession }
  | { type: 'END_SESSION'; payload: { packageName: string; endTime: number } }
  | { type: 'SET_LOCKED'; payload: { locked: boolean; reason: LockReason } }
  | { type: 'UNLOCK' }
  | { type: 'UPDATE_CHALLENGE'; payload: Partial<ChallengeState> }
  | { type: 'SET_CHALLENGE'; payload: ChallengeState }
  | { type: 'INCREMENT_UNLOCK_COUNT' }
  | { type: 'CHECK_DAY_RESET' }
  | { type: 'RESTORE_STATE'; payload: Partial<AppState> };

// ========== Initial State ==========

function getTodayDate(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

function loadSettings(): AppSettings {
  try {
    const saved = storage.getString(STORAGE_KEYS.SETTINGS);
    if (saved) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
    }
  } catch {}
  return { ...DEFAULT_SETTINGS };
}

function loadTodayStats(): { seconds: number; sessions: GameSession[]; unlockCount: number; date: string } {
  try {
    const saved = storage.getString(STORAGE_KEYS.TODAY_STATS);
    if (saved) {
      const parsed = JSON.parse(saved);
      const today = getTodayDate();
      // 检查是否跨天了
      if (parsed.date === today) {
        return parsed;
      }
    }
  } catch {}
  return { seconds: 0, sessions: [], unlockCount: 0, date: getTodayDate() };
}

const initialStats = loadTodayStats();

const initialState: AppState = {
  settings: loadSettings(),
  isMonitoring: false,
  currentForegroundPackage: '',
  currentForegroundApp: '',
  todayGamingSeconds: initialStats.seconds,
  todaySessions: initialStats.sessions || [],
  isLocked: lockService.isLockedPersisted(),
  lockReason: (lockService.getLockInfo().reason as LockReason) || 'time_limit',
  todayUnlockCount: initialStats.unlockCount || 0,
  challenge: initChallenge(
    loadSettings().mathQuestionCount,
    loadSettings().mathDifficulty,
    loadSettings().englishQuestionCount,
    loadSettings().englishDifficulty,
  ),
  currentDate: initialStats.date || getTodayDate(),
};

// ========== Reducer ==========

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_SETTINGS':
      return {
        ...state,
        settings: { ...state.settings, ...action.payload },
      };

    case 'SET_MONITORING':
      return { ...state, isMonitoring: action.payload };

    case 'SET_CURRENT_APP':
      return {
        ...state,
        currentForegroundPackage: action.payload.packageName,
        currentForegroundApp: action.payload.appName,
      };

    case 'ADD_GAMING_SECONDS':
      return {
        ...state,
        todayGamingSeconds: state.todayGamingSeconds + action.payload,
      };

    case 'ADD_SESSION':
      return {
        ...state,
        todaySessions: [...state.todaySessions, action.payload],
      };

    case 'END_SESSION': {
      const updatedSessions = state.todaySessions.map(s => {
        if (
          s.packageName === action.payload.packageName &&
          s.endTime === 0
        ) {
          return {
            ...s,
            endTime: action.payload.endTime,
            durationSeconds: Math.floor(
              (action.payload.endTime - s.startTime) / 1000,
            ),
          };
        }
        return s;
      });
      return { ...state, todaySessions: updatedSessions };
    }

    case 'SET_LOCKED':
      return {
        ...state,
        isLocked: action.payload.locked,
        lockReason: action.payload.reason,
      };

    case 'UNLOCK':
      return {
        ...state,
        isLocked: false,
        todayGamingSeconds: 0,
        todaySessions: [],
        todayUnlockCount: state.todayUnlockCount + 1,
        challenge: initChallenge(
          state.settings.mathQuestionCount,
          state.settings.mathDifficulty,
          state.settings.englishQuestionCount,
          state.settings.englishDifficulty,
        ),
      };

    case 'UPDATE_CHALLENGE':
      return {
        ...state,
        challenge: { ...state.challenge, ...action.payload },
      };

    case 'SET_CHALLENGE':
      return { ...state, challenge: action.payload };

    case 'INCREMENT_UNLOCK_COUNT':
      return { ...state, todayUnlockCount: state.todayUnlockCount + 1 };

    case 'CHECK_DAY_RESET': {
      const today = getTodayDate();
      if (today !== state.currentDate) {
        return {
          ...state,
          todayGamingSeconds: 0,
          todaySessions: [],
          todayUnlockCount: 0,
          currentDate: today,
        };
      }
      return state;
    }

    case 'RESTORE_STATE':
      return { ...state, ...action.payload };

    default:
      return state;
  }
}

// ========== Context ==========

interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  /** 触发锁屏 */
  triggerLock: (reason?: LockReason) => void;
  /** 通过挑战解锁 */
  unlockViaChallenge: () => void;
  /** 通过家长密码解锁 */
  unlockViaParentPin: (pin: string) => boolean;
  /** 更新设置并持久化 */
  updateSettings: (settings: Partial<AppSettings>) => void;
  /** 重置今日数据 */
  resetToday: () => void;
}

const AppContext = createContext<AppContextType | null>(null);

// ========== Provider ==========

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const stateRef = useRef(state);
  stateRef.current = state;

  // 持久化设置
  useEffect(() => {
    storage.set(STORAGE_KEYS.SETTINGS, JSON.stringify(state.settings));
  }, [state.settings]);

  // 持久化今日统计
  useEffect(() => {
    const todayStats = {
      seconds: state.todayGamingSeconds,
      sessions: state.todaySessions,
      unlockCount: state.todayUnlockCount,
      date: state.currentDate,
    };
    storage.set(STORAGE_KEYS.TODAY_STATS, JSON.stringify(todayStats));
  }, [
    state.todayGamingSeconds,
    state.todaySessions,
    state.todayUnlockCount,
    state.currentDate,
  ]);

  // 初始化锁屏服务
  useEffect(() => {
    lockService.initialize().then(({ wasLocked }) => {
      if (wasLocked && !state.isLocked) {
        dispatch({
          type: 'SET_LOCKED',
          payload: { locked: true, reason: 'time_limit' },
        });
      }
    });

    // 监听原生层锁屏事件
    const unsubLock = lockService.onLock(() => {
      if (!stateRef.current.isLocked) {
        dispatch({
          type: 'SET_LOCKED',
          payload: { locked: true, reason: 'time_limit' },
        });
      }
    });

    return () => {
      unsubLock();
    };
  }, []);

  // 检查日期变更
  useEffect(() => {
    const interval = setInterval(() => {
      dispatch({ type: 'CHECK_DAY_RESET' });
    }, 60000); // 每分钟检查一次

    return () => clearInterval(interval);
  }, []);

  // 检测超时
  useEffect(() => {
    if (
      !state.isLocked &&
      state.todayGamingSeconds >= state.settings.dailyLimitMinutes * 60
    ) {
      triggerLock('time_limit');
    }
  }, [state.todayGamingSeconds, state.isLocked, state.settings.dailyLimitMinutes]);

  const triggerLock = useCallback(
    (reason: LockReason = 'time_limit') => {
      dispatch({ type: 'SET_LOCKED', payload: { locked: true, reason } });
      lockService.lock(reason, true); // 持久化锁状态，重启后保持
    },
    [],
  );

  const unlockViaChallenge = useCallback(() => {
    dispatch({ type: 'UNLOCK' });
    lockService.unlock(false);
  }, []);

  const unlockViaParentPin = useCallback(
    (pin: string): boolean => {
      const valid = lockService.validateParentPin(pin, state.settings.pinHash);
      if (valid) {
        dispatch({ type: 'UNLOCK' });
        lockService.unlock(true);
      }
      return valid;
    },
    [state.settings.pinHash],
  );

  const updateSettings = useCallback(
    (newSettings: Partial<AppSettings>) => {
      dispatch({ type: 'SET_SETTINGS', payload: newSettings });
    },
    [],
  );

  const resetToday = useCallback(() => {
    dispatch({ type: 'CHECK_DAY_RESET' });
  }, []);

  const value: AppContextType = {
    state,
    dispatch,
    triggerLock,
    unlockViaChallenge,
    unlockViaParentPin,
    updateSettings,
    resetToday,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

// ========== Hook ==========

export function useApp(): AppContextType {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
