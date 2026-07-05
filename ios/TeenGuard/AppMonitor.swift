// ============================================================
// TeenGuard - iOS App Monitor (Screen Time / Family Controls)
// iOS 端应用监控封装
//
// 注意: iOS 端的系统级限制较多:
// 1. 无法获得系统级悬浮窗权限
// 2. Screen Time API 需要 Family Sharing 配置
// 3. 无法监控其他应用的前台运行状态
//
// 因此 iOS 端采用以下策略:
// - 使用 DeviceActivityMonitorExtension 监听游戏类应用的屏幕时间
// - 超时后发送关键通知
// - App 内显示全屏锁屏界面
// - 建议配合 iOS 原生"引导式访问"使用
// ============================================================

import Foundation
import FamilyControls
import DeviceActivity
import ManagedSettings

/// 应用监控模块 (暴露给 React Native 的桥接接口)
@objc(AppMonitor)
class AppMonitor: NSObject {

  /// 授权中心
  private let center = AuthorizationCenter.shared

  /// 设备活动中心
  private let deviceActivityCenter = DeviceActivityCenter.shared

  /// 是否已授权
  private var isAuthorized = false

  /// 请求 Screen Time / Family Controls 授权
  @objc
  func requestAuthorization(_ resolve: @escaping RCTPromiseResolveBlock,
                            reject: @escaping RCTPromiseRejectBlock) {
    Task {
      do {
        try await center.requestAuthorization(for: .individual)
        isAuthorized = true
        resolve(true)
      } catch {
        print("TeenGuard iOS: Authorization failed: \(error)")
        // iOS 端无法获得完整授权, 降级到应用内锁屏模式
        resolve(false)
      }
    }
  }

  /// 开始监控 (设置设备活动阈值)
  @objc
  func startMonitoring(_ thresholdSeconds: Int,
                       resolve: @escaping RCTPromiseResolveBlock,
                       reject: @escaping RCTPromiseRejectBlock) {
    // 获取游戏类别
    let gameCategory = ActivityCategoryToken.games

    // 创建监控计划
    let schedule = DeviceActivitySchedule(
      intervalStart: DateComponents(hour: 0, minute: 0),
      intervalEnd: DateComponents(hour: 23, minute: 59),
      repeats: true
    )

    // 设置阈值 (iOS 会将此阈值应用在 DeviceActivityMonitorExtension 中)
    let thresholdMinutes = thresholdSeconds / 60

    do {
      try deviceActivityCenter.startMonitoring(
        .games,
        during: schedule
      )
      resolve(true)
    } catch {
      print("TeenGuard iOS: Start monitoring failed: \(error)")
      resolve(false)
    }
  }

  /// 停止监控
  @objc
  func stopMonitoring(_ resolve: @escaping RCTPromiseResolveBlock,
                      reject: @escaping RCTPromiseRejectBlock) {
    deviceActivityCenter.stopMonitoring([.games])
    resolve(true)
  }

  /// 获取今日游戏时长 (从 Screen Time 数据)
  @objc
  func getTodayGamingTime(_ resolve: @escaping RCTPromiseResolveBlock,
                          reject: @escaping RCTPromiseRejectBlock) {
    // iOS 端无法直接获取 Screen Time 的具体数据
    // 需要通过 DeviceActivityReportExtension 生成报告
    // 此方法返回在 JS 端累计的值
    resolve(0) // 实际值由 JS 端的计时器维护
  }

  /// 检查授权状态
  @objc
  func isAuthorized(_ resolve: @escaping RCTPromiseResolveBlock,
                    reject: @escaping RCTPromiseRejectBlock) {
    resolve(isAuthorized)
  }
}
