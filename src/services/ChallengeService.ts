// ============================================================
// TeenGuard - Challenge Service
// Manages the unlock challenge flow (math + English)
// ============================================================

import { Difficulty, MathProblem, EnglishPhrase, ChallengeState } from '../store/types';
import { generateMathProblems, validateMathAnswer } from '../utils/mathGenerator';
import { validateSpeechResult } from '../utils/speechValidator';
import { ENGLISH_DIFFICULTY } from '../constants/difficulty';

/**
 * 英语口语题库
 */
const ENGLISH_PHRASES: Record<Difficulty, EnglishPhrase[]> = {
  easy: [
    { id: 'e1', targetText: 'hello', hint: '你好', difficulty: 'easy', minAccuracy: 0.6 },
    { id: 'e2', targetText: 'good morning', hint: '早上好', difficulty: 'easy', minAccuracy: 0.6 },
    { id: 'e3', targetText: 'thank you', hint: '谢谢', difficulty: 'easy', minAccuracy: 0.6 },
    { id: 'e4', targetText: 'I am happy', hint: '我很开心', difficulty: 'easy', minAccuracy: 0.6 },
    { id: 'e5', targetText: 'good night', hint: '晚安', difficulty: 'easy', minAccuracy: 0.6 },
    { id: 'e6', targetText: 'I love reading', hint: '我喜欢阅读', difficulty: 'easy', minAccuracy: 0.6 },
    { id: 'e7', targetText: 'how are you', hint: '你好吗', difficulty: 'easy', minAccuracy: 0.6 },
    { id: 'e8', targetText: 'nice to meet you', hint: '很高兴见到你', difficulty: 'easy', minAccuracy: 0.6 },
    { id: 'e9', targetText: 'see you later', hint: '待会见', difficulty: 'easy', minAccuracy: 0.6 },
    { id: 'e10', targetText: 'have a good day', hint: '祝你愉快', difficulty: 'easy', minAccuracy: 0.6 },
  ],
  medium: [
    { id: 'm1', targetText: 'The weather is beautiful today', hint: '今天天气很好', difficulty: 'medium', minAccuracy: 0.7 },
    { id: 'm2', targetText: 'I enjoy playing basketball with my friends', hint: '我喜欢和朋友们打篮球', difficulty: 'medium', minAccuracy: 0.7 },
    { id: 'm3', targetText: 'Reading books can help us learn new things', hint: '读书可以帮助我们学习新知识', difficulty: 'medium', minAccuracy: 0.7 },
    { id: 'm4', targetText: 'Practice makes perfect', hint: '熟能生巧', difficulty: 'medium', minAccuracy: 0.7 },
    { id: 'm5', targetText: 'My favorite subject is science', hint: '我最喜欢的科目是科学', difficulty: 'medium', minAccuracy: 0.7 },
    { id: 'm6', targetText: 'I want to be a doctor when I grow up', hint: '我长大后想当医生', difficulty: 'medium', minAccuracy: 0.7 },
    { id: 'm7', targetText: 'Learning English is very important', hint: '学习英语非常重要', difficulty: 'medium', minAccuracy: 0.7 },
    { id: 'm8', targetText: 'We should exercise every day to stay healthy', hint: '我们应该每天锻炼保持健康', difficulty: 'medium', minAccuracy: 0.7 },
    { id: 'm9', targetText: 'Music makes me feel relaxed and happy', hint: '音乐让我感到放松和快乐', difficulty: 'medium', minAccuracy: 0.7 },
    { id: 'm10', targetText: 'Helping others is a good habit', hint: '帮助他人是一个好习惯', difficulty: 'medium', minAccuracy: 0.7 },
  ],
  hard: [
    { id: 'h1', targetText: 'Technology has changed the way people communicate with each other in modern society', hint: '关于科技如何改变人际交流', difficulty: 'hard', minAccuracy: 0.75 },
    { id: 'h2', targetText: 'Environmental protection requires everyone to take responsibility and action', hint: '关于环境保护', difficulty: 'hard', minAccuracy: 0.75 },
    { id: 'h3', targetText: 'Education is the most powerful weapon which you can use to change the world', hint: '关于教育的力量', difficulty: 'hard', minAccuracy: 0.75 },
    { id: 'h4', targetText: 'Success is not final, failure is not fatal, it is the courage to continue that counts', hint: '关于成功与失败', difficulty: 'hard', minAccuracy: 0.75 },
    { id: 'h5', targetText: 'The best way to predict the future is to create it', hint: '关于创造未来', difficulty: 'hard', minAccuracy: 0.75 },
    { id: 'h6', targetText: 'Imagination is more important than knowledge, for knowledge is limited', hint: '关于想象力', difficulty: 'hard', minAccuracy: 0.75 },
    { id: 'h7', targetText: 'In the middle of difficulty lies opportunity', hint: '关于困难中的机遇', difficulty: 'hard', minAccuracy: 0.75 },
    { id: 'h8', targetText: 'The journey of a thousand miles begins with a single step', hint: '关于千里之行始于足下', difficulty: 'hard', minAccuracy: 0.75 },
  ],
};

/**
 * 硬模式问答题
 */
const HARD_QUESTIONS: EnglishPhrase[] = [
  { id: 'hq1', targetText: 'What do you like to do in your free time and why', hint: '你喜欢在空闲时间做什么？为什么？', difficulty: 'hard', minAccuracy: 0.7 },
  { id: 'hq2', targetText: 'Describe your best friend and what makes them special', hint: '描述你最好的朋友', difficulty: 'hard', minAccuracy: 0.7 },
  { id: 'hq3', targetText: 'What is your favorite book or movie and what did you learn from it', hint: '你最喜欢的书或电影？从中学到了什么？', difficulty: 'hard', minAccuracy: 0.7 },
  { id: 'hq4', targetText: 'If you could travel anywhere in the world where would you go and why', hint: '你最想去哪里旅行？为什么？', difficulty: 'hard', minAccuracy: 0.7 },
];

/**
 * 随机洗牌
 */
function shuffle<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * 初始化挑战状态
 */
export function initChallenge(
  mathCount: number,
  mathDifficulty: Difficulty,
  englishCount: number,
  englishDifficulty: Difficulty,
): ChallengeState {
  const mathProblems = generateMathProblems(mathCount, mathDifficulty);

  let pool = ENGLISH_PHRASES[englishDifficulty] || ENGLISH_PHRASES.medium;
  // Hard 模式混合问答题
  if (englishDifficulty === 'hard') {
    pool = shuffle([...pool, ...HARD_QUESTIONS]);
  }
  const englishPhrases = shuffle(pool).slice(0, englishCount);

  return {
    mathProblems,
    englishPhrases,
    mathCurrentIndex: 0,
    englishCurrentIndex: 0,
    mathCorrectCount: 0,
    englishPassCount: 0,
    currentPhase: 'math',
    mathInput: '',
    speechResult: '',
    isRecording: false,
    errorMessage: '',
  };
}

/**
 * 检查数学答案并推进
 */
export function submitMathAnswer(
  state: ChallengeState,
  answer: string,
): {
  correct: boolean;
  isMathComplete: boolean;
  nextState: ChallengeState;
} {
  const currentProblem = state.mathProblems[state.mathCurrentIndex];
  if (!currentProblem) {
    return { correct: false, isMathComplete: true, nextState: state };
  }

  const correct = validateMathAnswer(currentProblem, answer);
  const newCorrectCount = correct
    ? state.mathCorrectCount + 1
    : state.mathCorrectCount;
  const newIndex = state.mathCurrentIndex + 1;
  const isMathComplete = newIndex >= state.mathProblems.length;

  const nextState: ChallengeState = {
    ...state,
    mathCorrectCount: newCorrectCount,
    mathCurrentIndex: newIndex,
    mathInput: '',
    errorMessage: correct ? '' : `正确答案是: ${currentProblem.answer}`,
    currentPhase: isMathComplete ? 'english' : 'math',
  };

  return { correct, isMathComplete, nextState };
}

/**
 * 提交英语语音结果
 */
export function submitSpeechResult(
  state: ChallengeState,
  recognizedText: string,
): {
  passed: boolean;
  accuracy: number;
  feedback: string;
  isEnglishComplete: boolean;
  nextState: ChallengeState;
} {
  const currentPhrase = state.englishPhrases[state.englishCurrentIndex];
  if (!currentPhrase) {
    return {
      passed: false,
      accuracy: 0,
      feedback: '没有更多题目',
      isEnglishComplete: true,
      nextState: state,
    };
  }

  const result = validateSpeechResult(
    recognizedText,
    currentPhrase.targetText,
    currentPhrase.difficulty,
  );

  const newPassCount = result.passed
    ? state.englishPassCount + 1
    : state.englishPassCount;
  const newIndex = state.englishCurrentIndex + 1;
  const isEnglishComplete = newIndex >= state.englishPhrases.length;

  const nextState: ChallengeState = {
    ...state,
    englishPassCount: newPassCount,
    englishCurrentIndex: newIndex,
    speechResult: recognizedText,
    errorMessage: '',
    currentPhase: isEnglishComplete ? 'complete' : 'english',
  };

  return {
    passed: result.passed,
    accuracy: result.accuracy,
    feedback: result.feedback,
    isEnglishComplete,
    nextState,
  };
}

/**
 * 获取当前数学题
 */
export function getCurrentMathProblem(state: ChallengeState): MathProblem | null {
  return state.mathProblems[state.mathCurrentIndex] || null;
}

/**
 * 获取当前英语题
 */
export function getCurrentEnglishPhrase(
  state: ChallengeState,
): EnglishPhrase | null {
  return state.englishPhrases[state.englishCurrentIndex] || null;
}

/**
 * 获取挑战进度百分比
 */
export function getChallengeProgress(state: ChallengeState): number {
  const total = state.mathProblems.length + state.englishPhrases.length;
  if (total === 0) return 0;
  const completed =
    state.mathCurrentIndex + state.englishCurrentIndex;
  return Math.round((completed / total) * 100);
}

/**
 * 检查所有挑战是否都已完成并通过
 */
export function isChallengePassed(state: ChallengeState): boolean {
  const mathPassed =
    state.mathCorrectCount >= state.mathProblems.length;
  const englishPassed =
    state.englishPassCount >= state.englishPhrases.length;
  return state.currentPhase === 'complete' && mathPassed && englishPassed;
}
