// ============================================================
// TeenGuard - Game Detection Utility
// ============================================================

import { KNOWN_GAME_PACKAGES } from '../constants/defaults';

/**
 * 自定义游戏包名列表 (用户可编辑)
 */
let customGamePackages: Record<string, string> = {};

/**
 * 获取完整的游戏包名映射 (内置 + 自定义)
 */
export function getAllGamePackages(): Record<string, string> {
  return { ...KNOWN_GAME_PACKAGES, ...customGamePackages };
}

/**
 * 添加自定义游戏包名
 */
export function addCustomGamePackage(
  packageName: string,
  appName: string,
): void {
  customGamePackages[packageName] = appName;
}

/**
 * 移除自定义游戏包名
 */
export function removeCustomGamePackage(packageName: string): void {
  delete customGamePackages[packageName];
}

/**
 * 设置自定义游戏包名列表 (从存储恢复)
 */
export function setCustomGamePackages(packages: Record<string, string>): void {
  customGamePackages = { ...packages };
}

/**
 * 获取自定义游戏包名列表
 */
export function getCustomGamePackages(): Record<string, string> {
  return { ...customGamePackages };
}

/**
 * 检查指定包名是否为游戏
 * @returns 如果是已知游戏则返回游戏名称，否则返回 null
 */
export function isGamePackage(packageName: string): string | null {
  if (!packageName) return null;

  const allPackages = getAllGamePackages();
  return allPackages[packageName] || null;
}

/**
 * 检查包名是否包含游戏相关的关键词
 * 用于智能识别未在列表中的游戏
 */
export function isLikelyGame(packageName: string): boolean {
  if (!packageName) return false;

  const gameKeywords = [
    'game', 'gaming', 'play', 'arena', 'quest',
    'battle', 'clash', 'raid', 'dungeon', 'craft',
    'minecraft', 'roblox', 'pubg', 'fortnite',
    'tmgp',   // Tencent Mobile Game Platform
    'netease', // NetEase games
    'supercell',
    'puzzle', 'rpg', 'mmorpg', 'fps', 'moba',
    'saga', 'legend', 'hero', 'adventure',
    'chess', 'card', 'casino', 'slot', 'bingo',
  ];

  const lower = packageName.toLowerCase();
  return gameKeywords.some(keyword => lower.includes(keyword));
}

/**
 * 智能游戏检测：先查已知列表，再通过关键词判断
 * @returns 游戏名称或 null
 */
export function smartDetectGame(packageName: string): string | null {
  const known = isGamePackage(packageName);
  if (known) return known;

  if (isLikelyGame(packageName)) {
    // 从未知的游戏包名中提取可读名称
    const parts = packageName.split('.');
    const lastPart = parts[parts.length - 1];
    // 转换为可读格式
    return lastPart
      .replace(/([A-Z])/g, ' $1')
      .replace(/[_-]/g, ' ')
      .trim();
  }

  return null;
}
