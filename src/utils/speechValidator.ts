// ============================================================
// TeenGuard - Speech Validation Utility
// ============================================================

import { Difficulty } from '../store/types';
import { ENGLISH_DIFFICULTY } from '../constants/difficulty';

/**
 * 计算两个字符串之间的 Levenshtein 编辑距离
 * 用于比较语音识别结果与目标文本的相似度
 */
function levenshteinDistance(a: string, b: string): number {
  const aLen = a.length;
  const bLen = b.length;

  if (aLen === 0) return bLen;
  if (bLen === 0) return aLen;

  const matrix: number[][] = [];

  for (let i = 0; i <= bLen; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= aLen; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= bLen; i++) {
    for (let j = 1; j <= aLen; j++) {
      if (b[i - 1] === a[j - 1]) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // 替换
          matrix[i][j - 1] + 1,      // 插入
          matrix[i - 1][j] + 1,      // 删除
        );
      }
    }
  }

  return matrix[bLen][aLen];
}

/**
 * 计算两个字符串的单词级相似度
 * 返回 0-1 之间的值，1 表示完全匹配
 */
export function calculateWordSimilarity(
  recognized: string,
  target: string,
): number {
  const r = recognized.toLowerCase().trim();
  const t = target.toLowerCase().trim();

  if (r === t) return 1.0;
  if (r.length === 0 || t.length === 0) return 0.0;

  const distance = levenshteinDistance(r, t);
  const maxLen = Math.max(r.length, t.length);
  return 1 - distance / maxLen;
}

/**
 * 计算单词错误率 (Word Error Rate)
 */
export function calculateWordErrorRate(
  recognized: string,
  target: string,
): number {
  const rWords = recognized.toLowerCase().trim().split(/\s+/);
  const tWords = target.toLowerCase().trim().split(/\s+/);

  if (tWords.length === 0) return 1.0;

  const distance = levenshteinDistance(rWords.join(' '), tWords.join(' '));
  return distance / tWords.length;
}

/**
 * 验证语音识别结果是否通过
 */
export function validateSpeechResult(
  recognized: string,
  target: string,
  difficulty: Difficulty,
): {
  passed: boolean;
  accuracy: number;
  feedback: string;
} {
  const config = ENGLISH_DIFFICULTY[difficulty];
  const accuracy = calculateWordSimilarity(recognized, target);

  const passed = accuracy >= config.minAccuracy;

  let feedback: string;
  if (accuracy >= 0.95) {
    feedback = '太棒了！发音非常标准！🌟';
  } else if (accuracy >= 0.85) {
    feedback = '很好！发音很准确！👍';
  } else if (accuracy >= config.minAccuracy) {
    feedback = '通过！继续加油！💪';
  } else if (accuracy >= config.minAccuracy - 0.15) {
    feedback = '差一点就通过了，请再试一次！📢';
  } else {
    feedback = '请大声清晰地朗读，再试一次！🔊';
  }

  return { passed, accuracy, feedback };
}

/**
 * 构建语音识别反馈文本
 * 显示识别结果与目标文本的对比
 */
export function buildComparisonText(
  recognized: string,
  target: string,
): string {
  const r = recognized.trim();
  const t = target.trim();

  return `目标文本: "${t}"\n识别结果: "${r}"`;
}

/**
 * 简单的关键词匹配验证 (用于 Hard 模式问答题)
 * 检查识别结果中是否包含预期的关键词
 */
export function validateKeywords(
  recognized: string,
  keywords: string[],
): {
  passed: boolean;
  matchedCount: number;
  totalCount: number;
  matched: string[];
  missed: string[];
} {
  const lower = recognized.toLowerCase();
  const matched: string[] = [];
  const missed: string[] = [];

  for (const kw of keywords) {
    if (lower.includes(kw.toLowerCase())) {
      matched.push(kw);
    } else {
      missed.push(kw);
    }
  }

  return {
    passed: matched.length >= keywords.length * 0.5, // 至少匹配50%关键词
    matchedCount: matched.length,
    totalCount: keywords.length,
    matched,
    missed,
  };
}
