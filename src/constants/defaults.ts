// ============================================================
// TeenGuard - Default Configuration Values
// ============================================================

/** 默认每日游戏时限 (分钟) */
export const DEFAULT_DAILY_LIMIT_MINUTES = 60;

/** 默认 PIN 码 */
export const DEFAULT_PIN = '1234';

/** 数学题默认数量 */
export const DEFAULT_MATH_QUESTION_COUNT = 3;

/** 英语口语默认数量 */
export const DEFAULT_ENGLISH_QUESTION_COUNT = 2;

/** 前台应用检测间隔 (毫秒) */
export const APP_CHECK_INTERVAL_MS = 5000;

/** 游戏时长持久化间隔 (毫秒) */
export const PERSIST_INTERVAL_MS = 10000;

/** 每日重置时间 (小时, 0-23) */
export const DAY_RESET_HOUR = 0;

/** 存储键名 */
export const STORAGE_KEYS = {
  SETTINGS: 'teenguard_settings',
  TODAY_STATS: 'teenguard_today_stats',
  GAMING_HISTORY: 'teenguard_gaming_history',
  GAME_PACKAGES: 'teenguard_game_packages',
} as const;

/** 常见游戏包名列表 (用于预置检测) */
export const KNOWN_GAME_PACKAGES: Record<string, string> = {
  // 王者荣耀
  'com.tencent.tmgp.sgame': '王者荣耀',
  // 和平精英
  'com.tencent.tmgp.pubgmhd': '和平精英',
  // 原神
  'com.miHoYo.GenshinImpact': '原神',
  // 崩坏：星穹铁道
  'com.HoYoverse.hkrpgoversea': '崩坏：星穹铁道',
  // 蛋仔派对
  'com.netease.party': '蛋仔派对',
  // 我的世界
  'com.mojang.minecraftpe': '我的世界',
  // 英雄联盟手游
  'com.riotgames.league.wildrift': '英雄联盟手游',
  // 穿越火线
  'com.tencent.tmgp.cf': '穿越火线',
  // 第五人格
  'com.netease.idv.googleplay': '第五人格',
  // 光·遇
  'com.thatgamecompany.sky': '光·遇',
  // 明日方舟
  'com.YoStarEN.Arknights': '明日方舟',
  // 阴阳师
  'com.netease.onmyoji': '阴阳师',
  // 梦幻西游
  'com.netease.my': '梦幻西游',
  // QQ飞车
  'com.tencent.tmgp.speedmobile': 'QQ飞车',
  // 荒野行动
  'com.netease.ko': '荒野行动',
  // Clash of Clans
  'com.supercell.clashofclans': '部落冲突',
  // PUBG Mobile
  'com.tencent.ig': 'PUBG Mobile',
  // Candy Crush
  'com.king.candycrushsaga': '糖果粉碎传奇',
  // Roblox
  'com.roblox.client': 'Roblox',
  // Among Us
  'com.innersloth.spacemafia': 'Among Us',
};
