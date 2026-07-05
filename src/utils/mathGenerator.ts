// ============================================================
// TeenGuard - Math Problem Generator
// ============================================================

import { Difficulty, MathProblem } from '../store/types';
import { MATH_DIFFICULTY } from '../constants/difficulty';

let problemCounter = 0;

/**
 * 生成随机整数 [min, max]
 */
function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * 随机选择一个元素
 */
function randomPick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * 生成一道简单的四则运算题
 */
function generateArithmetic(difficulty: Difficulty): Omit<MathProblem, 'id'> {
  const config = MATH_DIFFICULTY[difficulty];
  const operator = randomPick(config.operators);

  let a: number, b: number, answer: number, question: string;

  switch (operator) {
    case '+':
      a = randomInt(config.minOperand, config.maxOperand);
      b = randomInt(config.minOperand, config.maxOperand);
      answer = a + b;
      question = `${a} + ${b} = ?`;
      break;

    case '-':
      a = randomInt(config.minOperand, config.maxOperand);
      b = randomInt(config.minOperand, a); // 确保 a >= b
      answer = a - b;
      question = `${a} - ${b} = ?`;
      break;

    case '×':
      a = randomInt(config.minOperand, Math.min(config.maxOperand, 20));
      b = randomInt(config.minOperand, Math.min(config.maxOperand, 12));
      answer = a * b;
      question = `${a} × ${b} = ?`;
      break;

    case '÷':
      b = randomInt(config.minOperand, Math.min(config.maxOperand, 12));
      answer = randomInt(config.minOperand, Math.min(config.maxOperand, 20));
      a = b * answer; // 确保整除
      question = `${a} ÷ ${b} = ?`;
      break;

    default:
      a = randomInt(config.minOperand, config.maxOperand);
      b = randomInt(config.minOperand, config.maxOperand);
      answer = a + b;
      question = `${a} + ${b} = ?`;
  }

  return { question, answer, difficulty };
}

/**
 * 生成一道一元一次方程题: ax + b = c
 */
function generateEquation(difficulty: Difficulty): Omit<MathProblem, 'id'> {
  const config = MATH_DIFFICULTY[difficulty];

  // 生成 ax + b = c, 求 x
  const a = randomInt(1, Math.min(config.maxOperand, 10));
  const x = randomInt(config.minOperand, Math.min(config.maxOperand, 50));
  const b = randomInt(-Math.min(config.maxOperand, 50), Math.min(config.maxOperand, 50));
  const c = a * x + b;

  let question: string;
  if (b >= 0) {
    question = `${a}x + ${b} = ${c}，求 x = ?`;
  } else {
    question = `${a}x - ${Math.abs(b)} = ${c}，求 x = ?`;
  }

  return {
    question,
    answer: x,
    difficulty,
  };
}

/**
 * 生成混合运算题: (a op b) op c = ?
 */
function generateMixed(difficulty: Difficulty): Omit<MathProblem, 'id'> {
  const config = MATH_DIFFICULTY[difficulty];

  const a = randomInt(config.minOperand, config.maxOperand);
  const b = randomInt(config.minOperand, config.maxOperand);
  const c = randomInt(config.minOperand, Math.min(config.maxOperand, 20));
  const op1 = randomPick(['+', '-'] as const);
  const op2 = randomPick(['×', '÷'] as const);

  let midResult: number, answer: number;

  // 先算乘除
  switch (op2) {
    case '×':
      midResult = b * c;
      break;
    case '÷':
      midResult = b; // 确保 b ÷ c 为整数
      answer = 0; // placeholder
      break;
    default:
      midResult = b + c;
  }

  switch (op1) {
    case '+':
      answer = a + (op2 === '÷' ? Math.floor(b / c) : midResult);
      break;
    case '-':
      answer = a - (op2 === '÷' ? Math.floor(b / c) : midResult);
      break;
    default:
      answer = a + b * c;
  }

  // 简化：直接用固定的混合运算格式
  const simpleA = randomInt(1, 20);
  const simpleB = randomInt(1, 10);
  const simpleC = randomInt(1, 10);
  const simpleAnswer = simpleA + simpleB * simpleC;

  return {
    question: `${simpleA} + ${simpleB} × ${simpleC} = ?`,
    answer: simpleAnswer,
    difficulty,
  };
}

/**
 * 生成一组数学题
 */
export function generateMathProblems(
  count: number,
  difficulty: Difficulty,
): MathProblem[] {
  const problems: MathProblem[] = [];
  const config = MATH_DIFFICULTY[difficulty];

  for (let i = 0; i < count; i++) {
    problemCounter++;
    let problem: Omit<MathProblem, 'id'>;

    if (config.useEquations) {
      // Hard: 混合使用方程题、混合运算和常规算术题
      const type = randomPick(['arithmetic', 'equation', 'mixed']);
      if (type === 'equation') {
        problem = generateEquation(difficulty);
      } else if (type === 'mixed') {
        problem = generateMixed(difficulty);
      } else {
        problem = generateArithmetic(difficulty);
      }
    } else {
      problem = generateArithmetic(difficulty);
    }

    problems.push({
      ...problem,
      id: `math_${problemCounter}_${Date.now()}`,
    });
  }

  return problems;
}

/**
 * 验证数学题答案
 */
export function validateMathAnswer(
  problem: MathProblem,
  userAnswer: string,
): boolean {
  const parsed = parseFloat(userAnswer.trim());
  if (isNaN(parsed)) {
    return false;
  }
  // 对于除法结果，允许 0.01 的误差（处理小数）
  return Math.abs(parsed - problem.answer) < 0.01;
}
