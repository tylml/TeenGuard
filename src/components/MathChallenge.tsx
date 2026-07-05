// ============================================================
// TeenGuard - Math Challenge Component
// ============================================================

import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Animated,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { ChallengeState, MathProblem } from '../store/types';

interface Props {
  problem: MathProblem;
  currentIndex: number;
  totalCount: number;
  correctCount: number;
  onSubmit: (answer: string) => void;
  errorMessage: string;
}

export default function MathChallenge({
  problem,
  currentIndex,
  totalCount,
  correctCount,
  onSubmit,
  errorMessage,
}: Props) {
  const [answer, setAnswer] = useState('');
  const [shakeAnim] = useState(() => new Animated.Value(0));
  const inputRef = useRef<TextInput>(null);

  const handleSubmit = () => {
    if (!answer.trim()) return;
    onSubmit(answer.trim());
    setAnswer('');
    // 聚焦输入框以便做下一题
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const shake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 6, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -6, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
  };

  // 当错误信息变化时触发震动动画
  React.useEffect(() => {
    if (errorMessage) {
      shake();
    }
  }, [errorMessage]);

  const progress = ((currentIndex) / totalCount) * 100;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}>
      {/* 进度条 */}
      <View style={styles.progressSection}>
        <View style={styles.progressBar}>
          <View
            style={[styles.progressFill, { width: `${progress}%` }]}
          />
        </View>
        <Text style={styles.progressText}>
          数学题 {currentIndex + 1}/{totalCount} | 正确 {correctCount}
        </Text>
      </View>

      {/* 题目卡片 */}
      <Animated.View
        style={[styles.questionCard, { transform: [{ translateX: shakeAnim }] }]}>
        <Text style={styles.questionIndex}>
          第 {currentIndex + 1} 题
        </Text>
        <Text style={styles.questionText}>{problem.question}</Text>

        <TextInput
          ref={inputRef}
          style={styles.answerInput}
          value={answer}
          onChangeText={setAnswer}
          keyboardType="numeric"
          placeholder="输入你的答案"
          placeholderTextColor="#AAA"
          returnKeyType="done"
          onSubmitEditing={handleSubmit}
          autoFocus
          selectTextOnFocus
        />

        <TouchableOpacity
          style={[styles.submitBtn, !answer.trim() && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={!answer.trim()}
          activeOpacity={0.8}>
          <Text style={styles.submitBtnText}>提交答案</Text>
        </TouchableOpacity>
      </Animated.View>

      {/* 错误提示 */}
      {errorMessage ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorIcon}>❌</Text>
          <Text style={styles.errorText}>{errorMessage}</Text>
        </View>
      ) : null}

      {/* 键盘提示 */}
      <Text style={styles.keyboardHint}>
        输入数字答案后按回车提交
      </Text>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  progressSection: {
    marginBottom: 20,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#2196F3',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: '#888',
    textAlign: 'center',
    marginTop: 6,
  },
  questionCard: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E3F2FD',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  questionIndex: {
    fontSize: 13,
    color: '#999',
    marginBottom: 12,
  },
  questionText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 28,
    textAlign: 'center',
  },
  answerInput: {
    width: '100%',
    height: 56,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderRadius: 14,
    paddingHorizontal: 20,
    fontSize: 24,
    textAlign: 'center',
    color: '#333',
    backgroundColor: '#FAFAFA',
    marginBottom: 16,
  },
  submitBtn: {
    width: '100%',
    height: 50,
    backgroundColor: '#2196F3',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnDisabled: {
    backgroundColor: '#BBDEFB',
  },
  submitBtnText: {
    color: '#FFF',
    fontSize: 17,
    fontWeight: '600',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF3F3',
    padding: 14,
    borderRadius: 12,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#FFCDD2',
  },
  errorIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  errorText: {
    fontSize: 14,
    color: '#D32F2F',
    flex: 1,
  },
  keyboardHint: {
    textAlign: 'center',
    fontSize: 11,
    color: '#BBB',
    marginTop: 16,
  },
});
