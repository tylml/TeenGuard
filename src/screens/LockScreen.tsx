// ============================================================
// TeenGuard - Lock Screen
// Full-screen un-dismissable lock overlay
// Shows math + English challenges to unlock
// Includes parent PIN emergency unlock
// ============================================================

import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  BackHandler,
} from 'react-native';
import LockOverlay from '../components/LockOverlay';
import MathChallenge from '../components/MathChallenge';
import EnglishChallenge from '../components/EnglishChallenge';
import { useApp } from '../store/AppContext';
import {
  submitMathAnswer,
  submitSpeechResult,
  getCurrentMathProblem,
  getCurrentEnglishPhrase,
  getChallengeProgress,
  isChallengePassed,
} from '../services/ChallengeService';

// 家长紧急解锁 PIN 输入
function PinPadInput({
  onSubmit,
  onCancel,
}: {
  onSubmit: (pin: string) => void;
  onCancel: () => void;
}) {
  const [pin, setPin] = useState('');

  const handlePress = (digit: string) => {
    if (pin.length < 4) {
      const newPin = pin + digit;
      setPin(newPin);
      if (newPin.length === 4) {
        // 延迟一下让用户看到完整输入
        setTimeout(() => {
          onSubmit(newPin);
          setPin('');
        }, 300);
      }
    }
  };

  const handleDelete = () => {
    setPin(prev => prev.slice(0, -1));
  };

  const digits = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    ['*', '0', '#'],
  ];

  return (
    <View style={pinStyles.container}>
      <Text style={pinStyles.title}>家长紧急解锁</Text>
      <Text style={pinStyles.subtitle}>请输入4位家长密码</Text>

      {/* PIN 显示 */}
      <View style={pinStyles.pinDisplay}>
        {[0, 1, 2, 3].map(i => (
          <View
            key={i}
            style={[
              pinStyles.pinDot,
              i < pin.length && pinStyles.pinDotFilled,
            ]}
          />
        ))}
      </View>

      {/* 数字键盘 */}
      {digits.map((row, rowIndex) => (
        <View key={rowIndex} style={pinStyles.keyRow}>
          {row.map(digit => (
            <TouchableOpacity
              key={digit}
              style={[
                pinStyles.keyBtn,
                (digit === '*' || digit === '#') && pinStyles.keyBtnDisabled,
              ]}
              onPress={() => handlePress(digit)}
              disabled={digit === '*' || digit === '#'}
              activeOpacity={0.6}>
              <Text style={pinStyles.keyText}>
                {digit === '*' ? '' : digit === '#' ? '' : digit}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      ))}

      {/* 操作按钮 */}
      <View style={pinStyles.actionRow}>
        <TouchableOpacity
          style={pinStyles.deleteBtn}
          onPress={handleDelete}>
          <Text style={pinStyles.deleteText}>⌫ 删除</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={pinStyles.cancelBtn}
          onPress={onCancel}>
          <Text style={pinStyles.cancelText}>取消</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const pinStyles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#F44336',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#888',
    marginBottom: 20,
  },
  pinDisplay: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 28,
  },
  pinDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#CCC',
  },
  pinDotFilled: {
    backgroundColor: '#F44336',
    borderColor: '#F44336',
  },
  keyRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  keyBtn: {
    width: 72,
    height: 56,
    backgroundColor: '#FFF',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  keyBtnDisabled: {
    backgroundColor: '#F5F5F5',
    borderColor: '#F0F0F0',
  },
  keyText: {
    fontSize: 24,
    fontWeight: '500',
    color: '#333',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 20,
    marginTop: 8,
  },
  deleteBtn: {
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  deleteText: {
    fontSize: 16,
    color: '#F44336',
  },
  cancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  cancelText: {
    fontSize: 16,
    color: '#666',
  },
});

// ========== Main Lock Screen ==========

export default function LockScreen() {
  const { state, dispatch, unlockViaChallenge, unlockViaParentPin } = useApp();
  const { challenge, lockReason } = state;
  const [showPinPad, setShowPinPad] = useState(false);

  const currentMathProblem = getCurrentMathProblem(challenge);
  const currentEnglishPhrase = getCurrentEnglishPhrase(challenge);
  const progress = getChallengeProgress(challenge);

  // 拦截返回键 - 无论如何不能通过返回键退出
  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      () => true,
    );
    return () => backHandler.remove();
  }, []);

  // 处理数学题提交
  const handleMathSubmit = useCallback(
    (answer: string) => {
      const { correct, isMathComplete, nextState } = submitMathAnswer(
        challenge,
        answer,
      );
      dispatch({ type: 'SET_CHALLENGE', payload: nextState });

      if (isMathComplete) {
        // 数学部分完成，进入英语阶段
        // Alert 移除，静默过渡
      }
    },
    [challenge, dispatch],
  );

  // 处理英语口语提交
  const handleEnglishSubmit = useCallback(
    (recognizedText: string) => {
      const { passed, accuracy, feedback, isEnglishComplete, nextState } =
        submitSpeechResult(challenge, recognizedText);

      dispatch({ type: 'SET_CHALLENGE', payload: nextState });

      // 显示反馈
      const accuracyPercent = Math.round(accuracy * 100);
      Alert.alert(
        passed ? '通过！' : '继续加油',
        `${feedback}\n准确率: ${accuracyPercent}%`,
        [{ text: '确定' }],
      );

      if (isEnglishComplete && passed) {
        // 全部完成！
        setTimeout(() => {
          Alert.alert(
            '🎉 挑战完成！',
            '恭喜你完成了所有挑战！屏幕即将解锁。\n\n请合理安排游戏时间，保护视力，多参与户外活动。',
            [
              {
                text: '解锁屏幕',
                onPress: () => unlockViaChallenge(),
              },
            ],
          );
        }, 500);
      }
    },
    [challenge, dispatch, unlockViaChallenge],
  );

  // 处理家长密码解锁
  const handleParentPinSubmit = useCallback(
    (pin: string) => {
      const success = unlockViaParentPin(pin);
      if (success) {
        setShowPinPad(false);
        Alert.alert('解锁成功', '屏幕已通过家长密码解锁。', [
          { text: '确定' },
        ]);
      } else {
        Alert.alert('密码错误', '请重试或联系家长。', [
          { text: '重试', onPress: () => setShowPinPad(true) },
        ]);
      }
    },
    [unlockViaParentPin],
  );

  // 家长密码界面
  if (showPinPad) {
    return (
      <LockOverlay visible={true}>
        <SafeAreaView style={styles.container}>
          <PinPadInput
            onSubmit={handleParentPinSubmit}
            onCancel={() => setShowPinPad(false)}
          />
        </SafeAreaView>
      </LockOverlay>
    );
  }

  return (
    <LockOverlay visible={true}>
      <SafeAreaView style={styles.container}>
        {/* 顶部锁定提示 */}
        <View style={styles.lockHeader}>
          <Text style={styles.lockIcon}>🔒</Text>
          <Text style={styles.lockTitle}>屏幕已锁定</Text>
          <Text style={styles.lockReason}>
            {lockReason === 'time_limit'
              ? '游戏时长已达今日上限'
              : '家长已手动锁定屏幕'}
          </Text>
          <Text style={styles.lockWarning}>
            ⚠️ 关机重启无法解除锁定
          </Text>
        </View>

        {/* 进度条 */}
        <View style={styles.progressSection}>
          <View style={styles.progressBar}>
            <View
              style={[styles.progressFill, { width: `${progress}%` }]}
            />
          </View>
          <Text style={styles.progressText}>
            解锁进度: {progress}% ({challenge.currentPhase === 'math' ? '数学阶段' : '英语阶段'})
          </Text>
        </View>

        {/* 挑战内容 */}
        <View style={styles.challengeArea}>
          {challenge.currentPhase === 'math' && currentMathProblem && (
            <MathChallenge
              problem={currentMathProblem}
              currentIndex={challenge.mathCurrentIndex}
              totalCount={challenge.mathProblems.length}
              correctCount={challenge.mathCorrectCount}
              onSubmit={handleMathSubmit}
              errorMessage={challenge.errorMessage}
            />
          )}

          {challenge.currentPhase === 'english' && currentEnglishPhrase && (
            <EnglishChallenge
              phrase={currentEnglishPhrase}
              currentIndex={challenge.englishCurrentIndex}
              totalCount={challenge.englishPhrases.length}
              passCount={challenge.englishPassCount}
              onSubmit={handleEnglishSubmit}
            />
          )}
        </View>

        {/* 底部家长解锁入口 */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.parentUnlockBtn}
            onPress={() => setShowPinPad(true)}>
            <Text style={styles.parentUnlockText}>
              🔑 家长紧急解锁
            </Text>
          </TouchableOpacity>

          <Text style={styles.footerHint}>
            完成所有题目后自动解锁 | 家长可使用密码立即解锁
          </Text>
        </View>
      </SafeAreaView>
    </LockOverlay>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  lockHeader: {
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  lockIcon: {
    fontSize: 36,
    marginBottom: 4,
  },
  lockTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#D32F2F',
  },
  lockReason: {
    fontSize: 14,
    color: '#888',
    marginTop: 4,
  },
  lockWarning: {
    fontSize: 12,
    color: '#FF5722',
    marginTop: 4,
    fontWeight: '500',
  },
  progressSection: {
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#E0E0E0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#2196F3',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    color: '#888',
    textAlign: 'center',
    marginTop: 6,
  },
  challengeArea: {
    flex: 1,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingHorizontal: 20,
  },
  parentUnlockBtn: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: '#FFF3F3',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FFCDD2',
    marginBottom: 8,
  },
  parentUnlockText: {
    fontSize: 15,
    color: '#D32F2F',
    fontWeight: '500',
  },
  footerHint: {
    fontSize: 11,
    color: '#BBB',
    textAlign: 'center',
  },
});
