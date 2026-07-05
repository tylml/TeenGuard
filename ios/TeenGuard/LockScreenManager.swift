// ============================================================
// TeenGuard - iOS Lock Screen Manager
// iOS 端锁屏管理
//
// 由于 iOS 不支持系统级悬浮窗，锁屏通过以下方式实现:
// 1. 在 App 内显示全屏模态页面 (无法通过手势关闭)
// 2. 发送关键通知 (Critical Alert / Time Sensitive)
// 3. 阻止屏幕自动休眠
// 4. 建议家长配置"引导式访问" (Guided Access) 辅助锁定
// ============================================================

import Foundation
import UIKit
import UserNotifications

/// 锁屏管理模块 (暴露给 React Native 的桥接接口)
@objc(LockScreenManager)
class LockScreenManager: NSObject {

  /// 是否处于锁定状态
  private var isLocked = false

  /// 发送关键锁屏通知
  @objc
  func showOverlay(_ resolve: @escaping RCTPromiseResolveBlock,
                   reject: @escaping RCTPromiseRejectBlock) {
    DispatchQueue.main.async {
      // 禁用屏幕自动休眠 (保持屏幕常亮)
      UIApplication.shared.isIdleTimerDisabled = true

      // 发送关键通知
      self.sendLockNotification()

      self.isLocked = true
      resolve(true)
    }
  }

  /// 取消锁屏
  @objc
  func hideOverlay(_ resolve: @escaping RCTPromiseResolveBlock,
                   reject: @escaping RCTPromiseRejectBlock) {
    DispatchQueue.main.async {
      // 恢复屏幕自动休眠
      UIApplication.shared.isIdleTimerDisabled = false

      // 移除锁屏通知
      UNUserNotificationCenter.current()
        .removeDeliveredNotifications(withIdentifiers: ["teenguard_lock"])

      self.isLocked = false
      resolve(true)
    }
  }

  /// 检查通知权限
  @objc
  func canDrawOverlays(_ resolve: @escaping RCTPromiseResolveBlock,
                       reject: @escaping RCTPromiseRejectBlock) {
    UNUserNotificationCenter.current()
      .getNotificationSettings { settings in
        let authorized = settings.authorizationStatus == .authorized
          || settings.authorizationStatus == .provisional
        resolve(authorized)
      }
  }

  /// 请求通知权限
  @objc
  func requestOverlayPermission(_ resolve: @escaping RCTPromiseResolveBlock,
                                reject: @escaping RCTPromiseRejectBlock) {
    UNUserNotificationCenter.current()
      .requestAuthorization(options: [.alert, .sound, .badge, .criticalAlert]) { granted, error in
        if let error = error {
          reject("PERMISSION_ERROR", error.localizedDescription, error)
        } else {
          resolve(granted)
        }
      }
  }

  /// 锁屏状态检查
  @objc
  func isLockedCurrently(_ resolve: @escaping RCTPromiseResolveBlock,
                          reject: @escaping RCTPromiseRejectBlock) {
    resolve(isLocked)
  }

  // MARK: - Private

  /// 发送关键锁屏通知
  private func sendLockNotification() {
    let content = UNMutableNotificationContent()
    content.title = "🔒 游戏时间已超限"
    content.body = "屏幕已锁定。请打开 TeenGuard 完成挑战以解锁。"
    content.sound = .defaultCritical

    // iOS 15+ 使用 Time Sensitive 中断级别
    if #available(iOS 15.0, *) {
      content.interruptionLevel = .timeSensitive
    }

    let request = UNNotificationRequest(
      identifier: "teenguard_lock",
      content: content,
      trigger: UNTimeIntervalNotificationTrigger(timeInterval: 1, repeats: false)
    )

    UNUserNotificationCenter.current().add(request) { error in
      if let error = error {
        print("TeenGuard iOS: Failed to send lock notification: \(error)")
      }
    }
  }
}
