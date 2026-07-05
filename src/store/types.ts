// ============================================================
// TeenGuard - Core Type Definitions
// ============================================================

/** 难度等级 */
export type Difficulty = 'easy' | 'medium' | 'hard';

/** 应用设置 */
export interface AppSettings {
  /** 每日游戏时限 (分钟)，默认 60 */
  dailyLimitMinutes: number;
  /** 数学题难度 */
  mathDifficulty: Difficulty;
  /** 英语口语难度 */
  englishDifficulty: Difficulty;
  /** 解锁需要完成的数学题数量 */
  mathQuestionCount: number;
  /** 解锁需要完成的英语口语题数量 */
  englishQuestionCount: number;
  /** PIN码的 SHA-256 哈希值 */
  pinHash: string;
  /** 是否已完成初始设置 */
  isInitialized: boolean;
}

/** 默认设置 */
export const DEFAULT_SETTINGS: AppSettings = {
  dailyLimitMinutes: 60,
  mathDifficulty: 'medium',
  englishDifficulty: 'medium',
  mathQuestionCount: 3,
  englishQuestionCount: 2,
  pinHash: '',
  isInitialized: false,
};

/** 数学题 */
export interface MathProblem {
  /** 题目 ID */
  id: string;
  /** 题目文本，如 "23 + 45 = ?" */
  question: string;
  /** 正确答案 (数字) */
  answer: number;
  /** 难度等级 */
  difficulty: Difficulty;
  /** 可选答案列表 (用于选择题模式) */
  options?: number[];
}

/** 英语口语题 */
export interface EnglishPhrase {
  /** 题目 ID */
  id: string;
  /** 需要朗读的文本 */
  targetText: string;
  /** 中文提示 */
  hint: string;
  /** 难度等级 */
  difficulty: Difficulty;
  /** 最低通过准确率 (0-1) */
  minAccuracy: number;
}

/** 挑战状态 */
export interface ChallengeState {
  /** 当前数学题列表 */
  mathProblems: MathProblem[];
  /** 当前英语题列表 */
  englishPhrases: EnglishPhrase[];
  /** 数学题当前索引 */
  mathCurrentIndex: number;
  /** 英语题当前索引 */
  englishCurrentIndex: number;
  /** 数学题正确数量 */
  mathCorrectCount: number;
  /** 英语题通过数量 */
  englishPassCount: number;
  /** 当前阶段: 'math' | 'english' | 'complete' */
  currentPhase: 'math' | 'english' | 'complete';
  /** 数学题答案输入 */
  mathInput: string;
  /** 英语语音识别结果 */
  speechResult: string;
  /** 是否正在录音 */
  isRecording: boolean;
  /** 错误消息 */
  errorMessage: string;
}

/** 游戏会话记录 */
export interface GameSession {
  /** 包名 */
  packageName: string;
  /** 应用名称 */
  appName: string;
  /** 开始时间戳 */
  startTime: number;
  /** 结束时间戳 (0 表示还在运行) */
  endTime: number;
  /** 累计时长 (秒) */
  durationSeconds: number;
}

/** 每日游戏统计 */
export interface DailyStats {
  /** 日期 YYYY-MM-DD */
  date: string;
  /** 总游戏时长 (秒) */
  totalSeconds: number;
  /** 游戏会话列表 */
  sessions: GameSession[];
  /** 今日解锁次数 */
  unlockCount: number;
}

/** 锁屏状态 */
export type LockReason = 'time_limit' | 'manual';

/** 全局应用状态 */
export interface AppState {
  /** 应用设置 */
  settings: AppSettings;
  /** 是否正在监控 */
  isMonitoring: boolean;
  /** 当前前台应用包名 */
  currentForegroundPackage: string;
  /** 当前前台应用名称 */
  currentForegroundApp: string;
  /** 今日累计游戏时长 (秒) */
  todayGamingSeconds: number;
  /** 今日游戏会话列表 */
  todaySessions: GameSession[];
  /** 是否已锁屏 */
  isLocked: boolean;
  /** 锁屏原因 */
  lockReason: LockReason;
  /** 今日已解锁次数 */
  todayUnlockCount: number;
  /** 挑战状态 */
  challenge: ChallengeState;
  /** 今日日期 (用于判断日期变更) */
  currentDate: string;
}
