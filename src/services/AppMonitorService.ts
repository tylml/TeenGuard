// ============================================================
// TeenGuard - App Monitor Service
// Bridge between native monitoring modules and JS state
// ============================================================

import { NativeModules, NativeEventEmitter, Platform } from 'react-native';
import { smartDetectGame } from '../utils/gameDetector';
import { GameSession } from '../store/types';
import { APP_CHECK_INTERVAL_MS } from '../constants/defaults';

const { GameMonitorModule } = NativeModules;

type GameEventCallback = (data: {
  packageName: string;
  appName: string;
}) => void;

type LimitExceededCallback = (data: {
  totalSeconds: number;
}) => void;

class AppMonitorService {
  private eventEmitter: NativeEventEmitter | null = null;
  private checkInterval: ReturnType<typeof setInterval> | null = null;
  private gameCallbacks: GameEventCallback[] = [];
  private limitCallbacks: LimitExceededCallback[] = [];
  private currentGameStartTime: number = 0;
  private currentGamePackage: string = '';
  private currentGameName: string = '';

  /**
   * 初始化监控服务
   */
  async initialize(): Promise<void> {
    if (Platform.OS === 'android' && GameMonitorModule) {
      this.eventEmitter = new NativeEventEmitter(GameMonitorModule);

      this.eventEmitter.addListener('onGameDetected', (data) => {
        this.handleGameDetected(data.packageName, data.appName);
      });

      this.eventEmitter.addListener('onGameStopped', (data) => {
        this.handleGameStopped(data.packageName, data.durationSeconds);
      });

      this.eventEmitter.addListener('onLimitExceeded', (data) => {
        this.handleLimitExceeded(data.totalSeconds);
      });
    }
  }

  /**
   * 开始监控
   */
  async startMonitoring(): Promise<boolean> {
    try {
      if (Platform.OS === 'android' && GameMonitorModule) {
        await GameMonitorModule.startMonitoring();
        return true;
      }
      // iOS fallback: 使用 JS 轮询 (功能受限)
      if (Platform.OS === 'ios') {
        this.startJSPolling();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to start monitoring:', error);
      return false;
    }
  }

  /**
   * 停止监控
   */
  async stopMonitoring(): Promise<void> {
    if (Platform.OS === 'android' && GameMonitorModule) {
      await GameMonitorModule.stopMonitoring();
    }
    this.stopJSPolling();
  }

  /**
   * 获取今日游戏时长 (从原生端)
   */
  async getTodayGamingTime(): Promise<number> {
    try {
      if (Platform.OS === 'android' && GameMonitorModule) {
        return await GameMonitorModule.getTodayGamingTime();
      }
      return 0;
    } catch (error) {
      console.error('Failed to get gaming time:', error);
      return 0;
    }
  }

  /**
   * 获取已知游戏包名列表
   */
  async getKnownGamePackages(): Promise<string[]> {
    try {
      if (Platform.OS === 'android' && GameMonitorModule) {
        return await GameMonitorModule.getKnownGamePackages();
      }
      return [];
    } catch {
      return [];
    }
  }

  /**
   * 添加自定义游戏包名
   */
  async addGamePackage(packageName: string): Promise<void> {
    if (Platform.OS === 'android' && GameMonitorModule) {
      await GameMonitorModule.addGamePackage(packageName);
    }
  }

  /**
   * 移除游戏包名
   */
  async removeGamePackage(packageName: string): Promise<void> {
    if (Platform.OS === 'android' && GameMonitorModule) {
      await GameMonitorModule.removeGamePackage(packageName);
    }
  }

  /**
   * 获取当前前台应用 (JS 端模拟)
   */
  getCurrentForegroundApp(): { packageName: string; appName: string } {
    return {
      packageName: this.currentGamePackage,
      appName: this.currentGameName,
    };
  }

  // ========== 事件回调 ==========

  onGameDetected(callback: GameEventCallback): () => void {
    this.gameCallbacks.push(callback);
    return () => {
      this.gameCallbacks = this.gameCallbacks.filter(cb => cb !== callback);
    };
  }

  onLimitExceeded(callback: LimitExceededCallback): () => void {
    this.limitCallbacks.push(callback);
    return () => {
      this.limitCallbacks = this.limitCallbacks.filter(cb => cb !== callback);
    };
  }

  // ========== 内部处理 ==========

  private handleGameDetected(packageName: string, appName: string): void {
    const gameName = smartDetectGame(packageName);
    if (gameName) {
      this.currentGamePackage = packageName;
      this.currentGameName = appName || gameName;
      this.currentGameStartTime = Date.now();

      this.gameCallbacks.forEach(cb =>
        cb({ packageName, appName: this.currentGameName }),
      );
    }
  }

  private handleGameStopped(
    packageName: string,
    _durationSeconds: number,
  ): void {
    this.currentGamePackage = '';
    this.currentGameName = '';
    this.currentGameStartTime = 0;
  }

  private handleLimitExceeded(totalSeconds: number): void {
    this.limitCallbacks.forEach(cb => cb({ totalSeconds }));
  }

  /**
   * 创建当前游戏会话对象
   */
  createCurrentSession(): GameSession | null {
    if (!this.currentGamePackage || !this.currentGameStartTime) {
      return null;
    }

    return {
      packageName: this.currentGamePackage,
      appName: this.currentGameName,
      startTime: this.currentGameStartTime,
      endTime: 0,
      durationSeconds: Math.floor(
        (Date.now() - this.currentGameStartTime) / 1000,
      ),
    };
  }

  // ========== JS 轮询 (iOS 降级方案) ==========

  private startJSPolling(): void {
    this.stopJSPolling();
    this.checkInterval = setInterval(() => {
      // iOS 上无法获取前台应用信息，仅作为占位
      // 实际功能需要通过 Screen Time API 实现
    }, APP_CHECK_INTERVAL_MS);
  }

  private stopJSPolling(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  /**
   * 清理资源
   */
  destroy(): void {
    this.stopJSPolling();
    this.eventEmitter?.removeAllListeners('onGameDetected');
    this.eventEmitter?.removeAllListeners('onGameStopped');
    this.eventEmitter?.removeAllListeners('onLimitExceeded');
    this.gameCallbacks = [];
    this.limitCallbacks = [];
  }
}

export const appMonitorService = new AppMonitorService();
