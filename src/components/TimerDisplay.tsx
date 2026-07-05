// ============================================================
// TeenGuard - Timer Display Component
// Shows gaming time progress with visual feedback
// ============================================================

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
} from 'react-native';
import { useApp } from '../store/AppContext';
import { DIFFICULTY_LABELS } from '../constants/difficulty';

function formatTime(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}时${String(minutes).padStart(2, '0')}分${String(seconds).padStart(2, '0')}秒`;
  }
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export default function TimerDisplay() {
  const { state } = useApp();
  const {
    todayGamingSeconds,
    settings: { dailyLimitMinutes, mathDifficulty, englishDifficulty },
  } = state;

  const totalLimit = dailyLimitMinutes * 60;
  const remaining = Math.max(0, totalLimit - todayGamingSeconds);
  const progress = totalLimit > 0 ? todayGamingSeconds / totalLimit : 0;
  const isNearLimit = remaining <= 600; // 10分钟警告
  const isOverLimit = todayGamingSeconds >= totalLimit;

  const [pulseAnim] = useState(() => new Animated.Value(1));

  useEffect(() => {
    if (isNearLimit) {
      const animation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ]),
      );
      animation.start();
      return () => animation.stop();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isNearLimit, pulseAnim]);

  // 进度条颜色
  let progressColor = '#4CAF50'; // 绿色 - 安全
  if (progress > 0.8) progressColor = '#FF9800'; // 橙色 - 警告
  if (progress >= 1.0) progressColor = '#F44336'; // 红色 - 超时

  // 状态文本
  let statusText = '正常游戏中';
  let statusColor = '#4CAF50';
  if (isOverLimit) {
    statusText = '已超时 - 屏幕已锁定';
    statusColor = '#F44336';
  } else if (isNearLimit) {
    statusText = '即将达到时限！';
    statusColor = '#FF9800';
  }

  return (
    <View style={styles.container}>
      {/* 圆形进度指示器 */}
      <View style={styles.progressContainer}>
        <View style={[styles.progressRing, { borderColor: progressColor }]}>
          <Animated.Text
            style={[
              styles.timeText,
              { color: progressColor, transform: [{ scale: pulseAnim }] },
            ]}>
            {formatTime(todayGamingSeconds)}
          </Animated.Text>
          <Text style={styles.timeLabel}>今日游戏时长</Text>
        </View>

        {/* 进度条 */}
        <View style={styles.progressBarBg}>
          <View
            style={[
              styles.progressBarFill,
              {
                width: `${Math.min(progress * 100, 100)}%`,
                backgroundColor: progressColor,
              },
            ]}
          />
        </View>
        <Text style={styles.limitText}>
          今日限额: {formatTime(totalLimit)}
        </Text>
      </View>

      {/* 状态信息 */}
      <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
        <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
        <Text style={[styles.statusText, { color: statusColor }]}>
          {statusText}
        </Text>
      </View>

      {/* 剩余时间 */}
      {!isOverLimit && (
        <Text style={styles.remainingText}>
          剩余可用时间: {formatTime(remaining)}
        </Text>
      )}

      {/* 当前难度设置 */}
      <View style={styles.difficultyInfo}>
        <Text style={styles.difficultyLabel}>
          数学难度: {DIFFICULTY_LABELS[mathDifficulty]} | 英语难度: {DIFFICULTY_LABELS[englishDifficulty]}
        </Text>
      </View>

      {/* 超时提示 */}
      {isOverLimit && (
        <View style={styles.lockedBanner}>
          <Text style={styles.lockedIcon}>🔒</Text>
          <Text style={styles.lockedTitle}>屏幕已锁定</Text>
          <Text style={styles.lockedDesc}>
            完成数学题和英语口语练习即可解锁{'\n'}
            关机重启无法解除锁定
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  progressContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  progressRing: {
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    backgroundColor: '#F5F5F5',
  },
  timeText: {
    fontSize: 28,
    fontWeight: 'bold',
    fontVariant: ['tabular-nums'],
  },
  timeLabel: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
  },
  progressBarBg: {
    width: 200,
    height: 6,
    backgroundColor: '#E0E0E0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  limitText: {
    fontSize: 12,
    color: '#888',
    marginTop: 6,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  remainingText: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  difficultyInfo: {
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 6,
    backgroundColor: '#F0F0F0',
    borderRadius: 12,
  },
  difficultyLabel: {
    fontSize: 12,
    color: '#666',
  },
  lockedBanner: {
    marginTop: 16,
    padding: 20,
    backgroundColor: '#FFF0F0',
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFCDD2',
  },
  lockedIcon: {
    fontSize: 40,
    marginBottom: 8,
  },
  lockedTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#D32F2F',
    marginBottom: 4,
  },
  lockedDesc: {
    fontSize: 13,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
});
