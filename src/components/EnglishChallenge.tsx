// ============================================================
// TeenGuard - English Speech Challenge Component
// ============================================================

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Platform,
} from 'react-native';
import { EnglishPhrase } from '../store/types';

interface Props {
  phrase: EnglishPhrase;
  currentIndex: number;
  totalCount: number;
  passCount: number;
  onSubmit: (recognizedText: string) => void;
}

// 模拟语音识别 (实际项目中使用 react-native-voice)
// 此组件为演示 UI，实际集成参见下方注释
export default function EnglishChallenge({
  phrase,
  currentIndex,
  totalCount,
  passCount,
  onSubmit,
}: Props) {
  const [isRecording, setIsRecording] = useState(false);
  const [recognizedText, setRecognizedText] = useState('');
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const recordingTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  // 录音动画
  useEffect(() => {
    if (isRecording) {
      const animation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.3,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 0.9,
            duration: 400,
            useNativeDriver: true,
          }),
        ]),
      );
      animation.start();
      return () => animation.stop();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isRecording, pulseAnim]);

  /**
   * 开始录音
   * 实际项目中使用 react-native-voice:
   *
   * import Voice from '@voiceflow/react-native-voice';
   *
   * Voice.onSpeechResults((e) => {
   *   setRecognizedText(e.value[0]);
   * });
   * Voice.start('en-US');
   */
  const startRecording = async () => {
    setIsRecording(true);
    setHasSubmitted(false);
    setRecognizedText('');

    // 模拟 3 秒后获得识别结果
    recordingTimer.current = setTimeout(() => {
      // 模拟有一定准确率的识别结果
      const simulatedResults = [
        phrase.targetText,
        phrase.targetText.toLowerCase(),
        phrase.targetText.replace(/\s+/g, ' ').trim() + ' um',
        phrase.targetText.slice(0, Math.floor(phrase.targetText.length * 0.8)),
      ];
      const randomResult =
        simulatedResults[Math.floor(Math.random() * simulatedResults.length)];
      setRecognizedText(randomResult);
      setIsRecording(false);
    }, 3000);
  };

  /**
   * 停止录音
   * 实际项目中: Voice.stop();
   */
  const stopRecording = () => {
    if (recordingTimer.current) {
      clearTimeout(recordingTimer.current);
    }
    setIsRecording(false);
    // 如果还没识别到结果，使用模拟文本
    if (!recognizedText) {
      setRecognizedText(phrase.targetText);
    }
  };

  const handleSubmit = () => {
    if (!recognizedText) return;
    setHasSubmitted(true);
    onSubmit(recognizedText);
  };

  const handleRetry = () => {
    setRecognizedText('');
    setHasSubmitted(false);
    startRecording();
  };

  const progress = ((currentIndex) / totalCount) * 100;

  return (
    <View style={styles.container}>
      {/* 进度条 */}
      <View style={styles.progressSection}>
        <View style={styles.progressBar}>
          <View
            style={[styles.progressFill, { width: `${progress}%` }]}
          />
        </View>
        <Text style={styles.progressText}>
          英语口语 {currentIndex + 1}/{totalCount} | 通过 {passCount}
        </Text>
      </View>

      {/* 题目卡片 */}
      <View style={styles.phraseCard}>
        <Text style={styles.phaseLabel}>
          {phrase.difficulty === 'hard' && phrase.targetText.includes('?')
            ? '请用英语回答以下问题'
            : '请大声朗读以下内容'}
        </Text>

        <Text style={styles.targetText}>{phrase.targetText}</Text>

        <Text style={styles.hintText}>💡 中文提示: {phrase.hint}</Text>

        {/* 录音按钮 */}
        <Animated.View
          style={[
            styles.recordBtnOuter,
            { transform: [{ scale: pulseAnim }] },
          ]}>
          <TouchableOpacity
            style={[
              styles.recordBtn,
              isRecording && styles.recordBtnActive,
            ]}
            onPress={isRecording ? stopRecording : startRecording}
            activeOpacity={0.7}>
            <Text style={styles.recordIcon}>
              {isRecording ? '⏹' : '🎤'}
            </Text>
            <Text style={styles.recordLabel}>
              {isRecording ? '点击停止' : '点击录音'}
            </Text>
          </TouchableOpacity>
        </Animated.View>

        {isRecording && (
          <View style={styles.recordingIndicator}>
            <View style={styles.recordingDot} />
            <Text style={styles.recordingText}>正在聆听...</Text>
          </View>
        )}
      </View>

      {/* 识别结果 */}
      {recognizedText ? (
        <View style={styles.resultCard}>
          <Text style={styles.resultLabel}>识别结果:</Text>
          <Text style={styles.resultText}>"{recognizedText}"</Text>

          {!hasSubmitted && (
            <View style={styles.actionRow}>
              <TouchableOpacity
                style={styles.retryBtn}
                onPress={handleRetry}>
                <Text style={styles.retryBtnText}>🔄 重新录音</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.confirmBtn}
                onPress={handleSubmit}>
                <Text style={styles.confirmBtnText}>✅ 确认提交</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      ) : null}

      {/* 提示 */}
      <View style={styles.tipCard}>
        <Text style={styles.tipIcon}>💡</Text>
        <Text style={styles.tipText}>
          请用标准英语发音朗读，确保环境安静
        </Text>
      </View>
    </View>
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
    backgroundColor: '#4CAF50',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: '#888',
    textAlign: 'center',
    marginTop: 6,
  },
  phraseCard: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E8F5E9',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  phaseLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  targetText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2E7D32',
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 34,
  },
  hintText: {
    fontSize: 14,
    color: '#999',
    marginBottom: 24,
  },
  recordBtnOuter: {
    marginBottom: 12,
  },
  recordBtn: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#E0E0E0',
  },
  recordBtnActive: {
    backgroundColor: '#FFEBEE',
    borderColor: '#EF5350',
  },
  recordIcon: {
    fontSize: 32,
    marginBottom: 4,
  },
  recordLabel: {
    fontSize: 12,
    color: '#666',
  },
  recordingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  recordingDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FF5722',
    marginRight: 8,
  },
  recordingText: {
    color: '#E65100',
    fontSize: 14,
    fontWeight: '500',
  },
  resultCard: {
    backgroundColor: '#F5F5F5',
    borderRadius: 16,
    padding: 20,
    marginTop: 16,
  },
  resultLabel: {
    fontSize: 13,
    color: '#888',
    marginBottom: 4,
  },
  resultText: {
    fontSize: 18,
    color: '#333',
    fontStyle: 'italic',
    marginBottom: 16,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  retryBtn: {
    flex: 1,
    height: 44,
    backgroundColor: '#FFF',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#DDD',
  },
  retryBtnText: {
    fontSize: 14,
    color: '#666',
  },
  confirmBtn: {
    flex: 1,
    height: 44,
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmBtnText: {
    fontSize: 14,
    color: '#FFF',
    fontWeight: '600',
  },
  tipCard: {
    flexDirection: 'row',
    backgroundColor: '#F0F8FF',
    padding: 14,
    borderRadius: 12,
    marginTop: 16,
    alignItems: 'flex-start',
  },
  tipIcon: {
    fontSize: 16,
    marginRight: 8,
    marginTop: 1,
  },
  tipText: {
    fontSize: 12,
    color: '#666',
    flex: 1,
    lineHeight: 18,
  },
});
