// ============================================================
// TeenGuard - Home Screen (Dashboard)
// Main screen showing gaming time and monitoring status
// ============================================================

import React, { useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  SafeAreaView,
} from 'react-native';
import TimerDisplay from '../components/TimerDisplay';
import { useApp } from '../store/AppContext';
import { appMonitorService } from '../services/AppMonitorService';
import { smartDetectGame } from '../utils/gameDetector';

function formatGameTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  if (mins > 0) {
    return `${mins} 分钟`;
  }
  return `${seconds} 秒`;
}

export default function HomeScreen({ navigation }: any) {
  const { state, dispatch } = useApp();
  const {
    isMonitoring,
    todayGamingSeconds,
    todaySessions,
    currentForegroundApp,
    settings: { dailyLimitMinutes },
    isLocked,
  } = state;

  // 初始化监控
  useEffect(() => {
    let unsubGame: (() => void) | undefined;
    let unsubLimit: (() => void) | undefined;

    async function setupMonitoring() {
      await appMonitorService.initialize();

      unsubGame = appMonitorService.onGameDetected((data) => {
        dispatch({
          type: 'SET_CURRENT_APP',
          payload: {
            packageName: data.packageName,
            appName: data.appName,
          },
        });
      });

      unsubLimit = appMonitorService.onLimitExceeded((data) => {
        dispatch({
          type: 'SET_LOCKED',
          payload: { locked: true, reason: 'time_limit' },
        });
      });

      // 启动监控
      const started = await appMonitorService.startMonitoring();
      dispatch({ type: 'SET_MONITORING', payload: started });
    }

    setupMonitoring();

    return () => {
      unsubGame?.();
      unsubLimit?.();
      appMonitorService.destroy();
    };
  }, [dispatch]);

  // 每秒更新游戏时长（如果在玩游戏且未锁屏）
  useEffect(() => {
    if (!isMonitoring || isLocked) return;

    const interval = setInterval(() => {
      const gameName = smartDetectGame(
        appMonitorService.getCurrentForegroundApp().packageName,
      );
      if (gameName) {
        dispatch({ type: 'ADD_GAMING_SECONDS', payload: 1 });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isMonitoring, isLocked, dispatch]);

  const handleStartMonitoring = useCallback(async () => {
    const started = await appMonitorService.startMonitoring();
    dispatch({ type: 'SET_MONITORING', payload: started });
    if (!started) {
      Alert.alert(
        '权限不足',
        '请前往系统设置授予"使用情况访问权限"和"无障碍服务"权限，以便监控游戏时长。',
        [{ text: '确定' }],
      );
    }
  }, [dispatch]);

  const handleStopMonitoring = useCallback(async () => {
    await appMonitorService.stopMonitoring();
    dispatch({ type: 'SET_MONITORING', payload: false });
  }, [dispatch]);

  const handleManualLock = useCallback(() => {
    Alert.alert(
      '手动锁定',
      '确定要立即锁定屏幕吗？需要通过挑战或家长密码解锁。',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '立即锁定',
          style: 'destructive',
          onPress: () => {
            dispatch({
              type: 'SET_LOCKED',
              payload: { locked: true, reason: 'manual' },
            });
          },
        },
      ],
    );
  }, [dispatch]);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* 头部 */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>TeenGuard</Text>
            <Text style={styles.subtitle}>青少年游戏守护</Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.settingsBtn}
              onPress={() => navigation.navigate('Settings')}>
              <Text style={styles.settingsIcon}>⚙️</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 监控状态 */}
        <View style={styles.monitorStatus}>
          <View
            style={[
              styles.statusIndicator,
              isMonitoring ? styles.statusActive : styles.statusInactive,
            ]}
          />
          <Text style={styles.statusLabel}>
            {isMonitoring ? '监控运行中' : '监控未启动'}
          </Text>
          {currentForegroundApp ? (
            <Text style={styles.currentApp}>
              当前: {currentForegroundApp}
            </Text>
          ) : null}
        </View>

        {/* 计时器 */}
        <TimerDisplay />

        {/* 操作按钮 */}
        <View style={styles.actionRow}>
          {!isMonitoring ? (
            <TouchableOpacity
              style={[styles.actionBtn, styles.startBtn]}
              onPress={handleStartMonitoring}>
              <Text style={styles.actionBtnText}>▶ 开始监控</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.actionBtn, styles.stopBtn]}
              onPress={handleStopMonitoring}>
              <Text style={styles.actionBtnText}>⏸ 暂停监控</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.actionBtn, styles.lockBtn]}
            onPress={handleManualLock}>
            <Text style={styles.actionBtnText}>🔒 手动锁定</Text>
          </TouchableOpacity>
        </View>

        {/* 今日游戏记录 */}
        {todaySessions.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📋 今日游戏记录</Text>
            {todaySessions.map((session, index) => (
              <View key={index} style={styles.sessionRow}>
                <Text style={styles.sessionApp}>{session.appName}</Text>
                <Text style={styles.sessionDuration}>
                  {formatGameTime(session.durationSeconds)}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* 提示信息 */}
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>📌 使用说明</Text>
          <Text style={styles.infoText}>
            • 后台自动监控游戏使用时长{'\n'}
            • 超过 {dailyLimitMinutes} 分钟时限将自动锁定屏幕{'\n'}
            • 锁屏后需完成数学题和英语口语练习解锁{'\n'}
            • 关机重启无法解除锁定（持久化锁状态）{'\n'}
            • 家长可通过设置中的密码紧急解锁{'\n'}
            • 设置中可调整难度和时限
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1A237E',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  settingsBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  settingsIcon: {
    fontSize: 20,
  },
  monitorStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    marginHorizontal: 20,
    backgroundColor: '#FFF',
    borderRadius: 12,
    marginTop: 8,
    marginBottom: 4,
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusActive: {
    backgroundColor: '#4CAF50',
  },
  statusInactive: {
    backgroundColor: '#BDBDBD',
  },
  statusLabel: {
    fontSize: 13,
    color: '#666',
    marginRight: 12,
  },
  currentApp: {
    fontSize: 12,
    color: '#999',
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
    overflow: 'hidden',
  },
  actionRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
    marginTop: 8,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  startBtn: {
    backgroundColor: '#4CAF50',
  },
  stopBtn: {
    backgroundColor: '#FF9800',
  },
  lockBtn: {
    backgroundColor: '#F44336',
  },
  actionBtnText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '600',
  },
  section: {
    margin: 20,
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  sessionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  sessionApp: {
    fontSize: 14,
    color: '#333',
  },
  sessionDuration: {
    fontSize: 14,
    color: '#888',
    fontWeight: '500',
  },
  infoCard: {
    margin: 20,
    backgroundColor: '#F0F4FF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E0E8FF',
  },
  infoTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A237E',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 13,
    color: '#555',
    lineHeight: 22,
  },
});
