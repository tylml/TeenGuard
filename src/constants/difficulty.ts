// ============================================================
// TeenGuard - Difficulty Configuration
// ============================================================

import { Difficulty } from '../store/types';

/** 数学题难度配置 */
export interface MathDifficultyConfig {
  /** 运算数最小值 */
  minOperand: number;
  /** 运算数最大值 */
  maxOperand: number;
  /** 允许的运算符 */
  operators: Array<'+' | '-' | '×' | '÷'>;
  /** 是否允许负数结果 */
  allowNegative: boolean;
  /** 是否允许小数结果 */
  allowDecimal: boolean;
  /** 是否生成方程题 (如 3x + 7 = 22) */
  useEquations: boolean;
}

/** 英语口语难度配置 */
export interface EnglishDifficultyConfig {
  /** 目标文本最小单词数 */
  minWords: number;
  /** 目标文本最大单词数 */
  maxWords: number;
  /** 最低通过准确率 */
  minAccuracy: number;
  /** 是否要求完整句子 */
  requireFullSentence: boolean;
  /** 是否为问答题 (需要即兴回答) */
  isQuestionAnswer: boolean;
}

/** 数学题难度映射 */
export const MATH_DIFFICULTY: Record<Difficulty, MathDifficultyConfig> = {
  easy: {
    minOperand: 1,
    maxOperand: 50,
    operators: ['+', '-'],
    allowNegative: false,
    allowDecimal: false,
    useEquations: false,
  },
  medium: {
    minOperand: 1,
    maxOperand: 100,
    operators: ['+', '-', '×'],
    allowNegative: false,
    allowDecimal: false,
    useEquations: false,
  },
  hard: {
    minOperand: 1,
    maxOperand: 200,
    operators: ['+', '-', '×', '÷'],
    allowNegative: false,
    allowDecimal: true,
    useEquations: true,
  },
};

/** 英语口语难度映射 */
export const ENGLISH_DIFFICULTY: Record<Difficulty, EnglishDifficultyConfig> = {
  easy: {
    minWords: 1,
    maxWords: 5,
    minAccuracy: 0.6,
    requireFullSentence: false,
    isQuestionAnswer: false,
  },
  medium: {
    minWords: 4,
    maxWords: 12,
    minAccuracy: 0.7,
    requireFullSentence: true,
    isQuestionAnswer: false,
  },
  hard: {
    minWords: 8,
    maxWords: 30,
    minAccuracy: 0.75,
    requireFullSentence: true,
    isQuestionAnswer: true,
  },
};

/** 难度标签 */
export const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  easy: '简单',
  medium: '中等',
  hard: '困难',
};

/** 难度说明 */
export const DIFFICULTY_DESCRIPTIONS: Record<Difficulty, string> = {
  easy: '适合小学生：简单加减法 + 单词朗读',
  medium: '适合初中生：乘除法 + 短句朗读',
  hard: '适合高中生：混合运算 + 即兴回答',
};
