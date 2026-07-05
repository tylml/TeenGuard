// ============================================================
// TeenGuard - Lock Service
// Manages screen lock state, survives reboots
// ============================================================

import { NativeModules, Platform, AppState } from 'react-native';
import { MMKV } from 'react-native-mmkv';

const { LockScreenModule } = NativeModules;

const lockStorage = new MMKV({ id: 'teenguard_lock_state' });

const LOCK_KEYS = {
  IS_LOCKED: 'is_locked',
  LOCK_REASON: 'lock_reason',
  LOCK_TIMESTAMP: 'lock_timestamp',
  REMAINING_SECONDS: 'remaining_seconds',
} as const;

type LockCallback = () => void;

class LockService {
  private isOverlayShown = false;
  private unlockCallbacks: LockCallback[] = [];
  private lockCallbacks: LockCallback[] = [];
  private appStateSubscription: any = null;

  /**
   * 初始化锁屏服务
   * 检查是否有持久化的锁状态（用于重启后恢复）
   */
  async initialize(): Promise<{
    wasLocked: boolean;
    lockReason: string;
  }> {
    const wasLocked = lockStorage.getBoolean(LOCK_KEYS.IS_LOCKED) || false;
    const lockReason = lockStorage.getString(LOCK_KEYS.LOCK_REASON) || '';

    // 监听应用状态变化，防止通过切换应用绕过锁屏
    this.appStateSubscription = AppState.addEventListener(
      'change',
      this.handleAppStateChange,
    );

    return { wasLocked, lockReason };
  }

  /**
   * 触发锁屏
   * @param reason 锁屏原因
   * @param persistLock 是否持久化锁状态（用于重启后恢复），默认 true
   */
  async lock(reason: string = 'time_limit', persistLock: boolean = true): Promise<void> {
    // 持久化锁状态 —— 即使关机重启也不会丢失
    if (persistLock) {
      lockStorage.set(LOCK_KEYS.IS_LOCKED, true);
      lockStorage.set(LOCK_KEYS.LOCK_REASON, reason);
      lockStorage.set(LOCK_KEYS.LOCK_TIMESTAMP, Date.now().toString());
    }

    // Android: 显示系统级覆盖层
    if (Platform.OS === 'android' && LockScreenModule) {
      try {
        const canDraw = await LockScreenModule.canDrawOverlays();
        if (canDraw) {
          await LockScreenModule.showOverlay();
          this.isOverlayShown = true;
        }
      } catch (error) {
        console.error('Failed to show overlay:', error);
      }
    }

    // 通知所有监听器
    this.lockCallbacks.forEach(cb => cb());
  }

  /**
   * 解锁屏幕
   * @param isParentOverride 是否是家长密码解锁
   */
  async unlock(isParentOverride: boolean = false): Promise<void> {
    // 清除持久化锁状态
    lockStorage.delete(LOCK_KEYS.IS_LOCKED);
    lockStorage.delete(LOCK_KEYS.LOCK_REASON);
    lockStorage.delete(LOCK_KEYS.LOCK_TIMESTAMP);

    // Android: 移除系统级覆盖层
    if (Platform.OS === 'android' && LockScreenModule && this.isOverlayShown) {
      try {
        await LockScreenModule.hideOverlay();
        this.isOverlayShown = false;
      } catch (error) {
        console.error('Failed to hide overlay:', error);
      }
    }

    // 通知所有监听器
    this.unlockCallbacks.forEach(cb => cb());
  }

  /**
   * 检查是否处于锁定状态（从持久化存储）
   */
  isLockedPersisted(): boolean {
    return lockStorage.getBoolean(LOCK_KEYS.IS_LOCKED) || false;
  }

  /**
   * 获取持久化的锁状态信息
   */
  getLockInfo(): {
    isLocked: boolean;
    reason: string;
    timestamp: number;
  } {
    return {
      isLocked: this.isLockedPersisted(),
      reason: lockStorage.getString(LOCK_KEYS.LOCK_REASON) || 'time_limit',
      timestamp: parseInt(
        lockStorage.getString(LOCK_KEYS.LOCK_TIMESTAMP) || '0',
        10,
      ),
    };
  }

  /**
   * 检查系统覆盖层权限
   */
  async canDrawOverlays(): Promise<boolean> {
    if (Platform.OS === 'android' && LockScreenModule) {
      return await LockScreenModule.canDrawOverlays();
    }
    return false;
  }

  /**
   * 请求系统覆盖层权限
   */
  async requestOverlayPermission(): Promise<void> {
    if (Platform.OS === 'android' && LockScreenModule) {
      await LockScreenModule.requestOverlayPermission();
    }
  }

  /**
   * 验证家长密码
   * 用于紧急解锁（家长可以绕过挑战直接解锁）
   */
  validateParentPin(inputPin: string, storedPinHash: string): boolean {
    // 简单的 SHA-256 哈希比较
    // 在生产环境中应使用 react-native-sha256 进行安全哈希
    const inputHash = this.simpleHash(inputPin);
    return inputHash === storedPinHash;
  }

  /**
   * 简洁的哈希函数 (实际项目中应使用 react-native-sha256)
   */
  private simpleHash(input: string): string {
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
      const char = input.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash |= 0; // 转换为 32bit 整数
    }
    // 组合成伪哈希
    const salt = 'TeenGuard_Secure_Salt_2024';
    let combined = salt + input + hash.toString();
    let result = '';
    for (let i = 0; i < combined.length; i++) {
      result += combined.charCodeAt(i).toString(16);
    }
    return result;
  }

  // ========== 事件监听 ==========

  onLock(callback: LockCallback): () => void {
    this.lockCallbacks.push(callback);
    return () => {
      this.lockCallbacks = this.lockCallbacks.filter(cb => cb !== callback);
    };
  }

  onUnlock(callback: LockCallback): () => void {
    this.unlockCallbacks.push(callback);
    return () => {
      this.unlockCallbacks = this.unlockCallbacks.filter(cb => cb !== callback);
    };
  }

  // ========== 内部处理 ==========

  private handleAppStateChange = (nextAppState: string) => {
    // 当应用进入后台，如果处于锁定状态，确保覆盖层仍在显示
    if (nextAppState === 'background' && this.isLockedPersisted()) {
      // 不做任何事，原生层的覆盖层会保持显示
    }

    // 当应用回到前台，如果处于锁定状态，触发回调
    if (nextAppState === 'active' && this.isLockedPersisted()) {
      this.lockCallbacks.forEach(cb => cb());
    }
  };

  /**
   * 清理资源
   */
  destroy(): void {
    if (this.appStateSubscription) {
      this.appStateSubscription.remove();
    }
    this.unlockCallbacks = [];
    this.lockCallbacks = [];
  }
}

export const lockService = new LockService();
