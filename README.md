# TeenGuard - 青少年游戏防沉迷守护 App

一款帮助防止青少年手机游戏成瘾的移动应用。通过后台监控游戏时长，超时强制锁屏，必须完成数学题和英语口语练习才能解锁。

## ✨ 核心功能

| 功能 | 说明 |
|------|------|
| 🔍 **后台监控** | 自动识别前台运行的游戏，累计每日游戏时长 |
| 🔒 **强制锁屏** | 超时后全屏覆盖锁定，无法通过返回/Home/通知栏退出 |
| 📐 **数学挑战** | 3个难度等级的数学题目，必须答对才能通过 |
| 🗣 **英语口语** | 语音识别验证英语朗读/即兴回答，3个难度等级 |
| 🔑 **家长密码** | 4位PIN码紧急解锁，家长可以绕过挑战直接解锁 |
| 🔄 **防绕过** | **关机重启后锁屏依然保持**，开机自启动恢复 |
| ⚙️ **灵活设置** | 可调节时限、难度、题目数量 |

## 🏗 技术架构

```
React Native CLI (TypeScript) + Java (Android) + Swift (iOS)
```

### Android 端
- **UsageStatsManager** — 应用使用情况监控
- **SYSTEM_ALERT_WINDOW** — 系统级全屏覆盖层
- **Foreground Service** — 前台持久服务，防被杀
- **BootReceiver** — 开机自启动，恢复锁屏状态
- **SharedPreferences** — 锁状态持久化存储

### iOS 端
- **Screen Time API** — 应用使用时长监控 (需 Family Sharing)
- **UNNotification (Critical Alert)** — 关键锁屏通知
- **全屏模态页** — 应用内不可退出的锁屏界面
- 建议配合 **引导式访问 (Guided Access)** 增强锁定

## 📁 项目结构

```
TeenGuard/
├── android/.../com/teenguard/
│   ├── AppUsageModule.java         # 应用监控 RN 桥接模块
│   ├── MonitoringService.java      # 前台监控服务
│   ├── LockScreenModule.java       # 锁屏 RN 桥接模块
│   ├── LockScreenService.java      # 锁屏覆盖层服务 (系统级)
│   ├── BootReceiver.java           # 开机自启动接收器
│   └── TeenGuardPackage.java       # RN 原生模块注册
├── ios/TeenGuard/
│   ├── AppMonitor.swift            # iOS Screen Time 封装
│   └── LockScreenManager.swift     # iOS 锁屏管理
├── src/
│   ├── components/
│   │   ├── LockOverlay.tsx         # 全屏覆盖层 (拦截返回键)
│   │   ├── MathChallenge.tsx       # 数学题挑战组件
│   │   ├── EnglishChallenge.tsx    # 英语口语挑战组件
│   │   ├── TimerDisplay.tsx        # 游戏时长显示
│   │   └── DifficultySelector.tsx  # 难度选择器
│   ├── screens/
│   │   ├── HomeScreen.tsx          # 主仪表盘
│   │   ├── LockScreen.tsx          # 锁屏挑战页 (含家长密码)
│   │   ├── SettingsScreen.tsx      # 家长设置 (PIN保护)
│   │   └── GameListScreen.tsx      # 游戏列表管理
│   ├── services/
│   │   ├── AppMonitorService.ts    # 监控服务 (JS桥接)
│   │   ├── LockService.ts         # 锁屏服务 (持久化锁状态)
│   │   └── ChallengeService.ts    # 挑战题目服务
│   ├── utils/
│   │   ├── mathGenerator.ts       # 数学题生成器
│   │   ├── speechValidator.ts     # 语音识别验证
│   │   └── gameDetector.ts        # 游戏检测工具
│   ├── store/
│   │   ├── AppContext.tsx          # 全局状态管理
│   │   └── types.ts               # 类型定义
│   └── constants/
│       ├── difficulty.ts          # 难度配置
│       └── defaults.ts            # 默认设置/预置游戏列表
├── App.tsx                         # 根组件
└── package.json
```

## 🚀 快速开始

### 环境要求
- Node.js >= 18
- React Native CLI
- Android Studio (Android SDK 33+)
- Xcode 15+ (iOS, 仅 macOS)

### 安装

```bash
# 1. 进入项目目录
cd TeenGuard

# 2. 安装依赖
npm install

# 3. iOS: 安装 CocoaPods
cd ios && pod install && cd ..

# 4. 启动 Metro
npm start

# 5. Android
npm run android

# 6. iOS
npm run ios
```

### Android 权限设置

首次运行需要在系统设置中授予以下权限:

1. **使用情况访问权限**
   - 设置 → 安全 → 使用情况访问权限 → 找到 TeenGuard → 开启

2. **显示在其他应用上层** (悬浮窗)
   - 设置 → 应用 → TeenGuard → 显示在其他应用上层 → 允许

3. **通知权限** (Android 13+)
   - App 首次运行时自动请求

4. **无障碍服务** (可选，提升检测精度)
   - 设置 → 辅助功能 → 已安装的应用 → TeenGuard → 开启

### iOS 权限设置

1. **Screen Time / Family Controls**
   - App 首次运行时自动请求授权

2. **通知权限**
   - 允许"关键提示"以获得最强的锁定通知

3. **建议: 启用引导式访问**
   - 设置 → 辅助功能 → 引导式访问 → 开启
   - 在 TeenGuard 界面连按3次侧边按钮启动

## 🔐 防绕过机制

| 绕过方式 | 防护措施 |
|----------|----------|
| 按返回键 | 覆盖层拦截 `KEYCODE_BACK` |
| 按Home键 | 覆盖层拦截 `KEYCODE_HOME` |
| 多任务键 | 覆盖层拦截 `KEYCODE_APP_SWITCH` |
| 下拉通知栏 | `FLAG_FULLSCREEN` 阻止 |
| 关机重启 | `BootReceiver` 开机自启动 + 持久化锁状态 |
| 卸载应用 | 需家长密码。可额外使用 Device Admin API |
| 强制停止 | `START_STICKY` 服务自动重启 |

## 📝 默认游戏检测列表

已预置 20+ 常见游戏包名，包括:
- 王者荣耀、和平精英、原神、崩坏：星穹铁道
- 蛋仔派对、我的世界、英雄联盟手游、穿越火线
- 第五人格、明日方舟、阴阳师、梦幻西游
- 部落冲突、PUBG Mobile、Roblox、Among Us 等

可在设置中自定义添加/删除游戏包名。

## ⚠️ 重要说明

- 本应用为家长控制辅助工具，不能替代家长的监督和教育
- Android 端功能完整，iOS 端受系统限制功能较基础
- 建议配合系统级家长控制 (Google Family Link / iOS Screen Time) 使用
- 首次使用请在家长监督下完成初始设置，务必牢记家长密码
- 卸载应用前需要在设置中先关闭设备管理器 (如已启用)
