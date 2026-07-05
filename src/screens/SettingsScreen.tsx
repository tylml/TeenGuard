// ============================================================
// TeenGuard - Settings Screen
// Parental settings with PIN protection
// ============================================================

import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  SafeAreaView,
  Switch,
} from 'react-native';
import DifficultySelector from '../components/DifficultySelector';
import { useApp } from '../store/AppContext';
import { Difficulty, AppSettings } from '../store/types';

export default function SettingsScreen({ navigation }: any) {
  const { state, updateSettings } = useApp();
  const { settings } = state;

  // 本地编辑状态
  const [dailyLimit, setDailyLimit] = useState(
    String(settings.dailyLimitMinutes),
  );
  const [mathDifficulty, setMathDifficulty] = useState(settings.mathDifficulty);
  const [englishDifficulty, setEnglishDifficulty] = useState(
    settings.englishDifficulty,
  );
  const [mathCount, setMathCount] = useState(
    String(settings.mathQuestionCount),
  );
  const [englishCount, setEnglishCount] = useState(
    String(settings.englishQuestionCount),
  );

  // PIN 修改
  const [showChangePin, setShowChangePin] = useState(false);
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');

  // 验证 PIN 是否可以访问设置
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pinInput, setPinInput] = useState('');

  // 如果是初始设置（没有PIN），直接允许访问
  useEffect(() => {
    if (!settings.pinHash || !settings.isInitialized) {
      setIsAuthenticated(true);
    }
  }, [settings.pinHash, settings.isInitialized]);

  const handlePinSubmit = useCallback(() => {
    // 使用与 LockService 相同的简单哈希验证
    let hash = 0;
    for (let i = 0; i < pinInput.length; i++) {
      const char = pinInput.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash |= 0;
    }
    const salt = 'TeenGuard_Secure_Salt_2024';
    let combined = salt + pinInput + hash.toString();
    let result = '';
    for (let i = 0; i < combined.length; i++) {
      result += combined.charCodeAt(i).toString(16);
    }

    if (result === settings.pinHash) {
      setIsAuthenticated(true);
      setPinInput('');
    } else {
      Alert.alert('密码错误', '请重试');
      setPinInput('');
    }
  }, [pinInput, settings.pinHash]);

  const handleSave = useCallback(() => {
    const limit = parseInt(dailyLimit, 10);
    const mathQty = parseInt(mathCount, 10);
    const engQty = parseInt(englishCount, 10);

    if (isNaN(limit) || limit < 5 || limit > 480) {
      Alert.alert('输入错误', '每日时限应在5-480分钟之间');
      return;
    }
    if (isNaN(mathQty) || mathQty < 1 || mathQty > 20) {
      Alert.alert('输入错误', '数学题数量应在1-20之间');
      return;
    }
    if (isNaN(engQty) || engQty < 1 || engQty > 20) {
      Alert.alert('输入错误', '英语题数量应在1-20之间');
      return;
    }

    updateSettings({
      dailyLimitMinutes: limit,
      mathDifficulty,
      englishDifficulty,
      mathQuestionCount: mathQty,
      englishQuestionCount: engQty,
    });

    Alert.alert('保存成功', '设置已更新');
  }, [
    dailyLimit,
    mathCount,
    englishCount,
    mathDifficulty,
    englishDifficulty,
    updateSettings,
  ]);

  const handleChangePin = useCallback(() => {
    if (newPin.length !== 4 || !/^\d{4}$/.test(newPin)) {
      Alert.alert('格式错误', 'PIN码必须为4位数字');
      return;
    }
    if (newPin !== confirmPin) {
      Alert.alert('不匹配', '两次输入的新PIN码不一致');
      return;
    }

    // 验证旧密码
    let hash = 0;
    for (let i = 0; i < currentPin.length; i++) {
      const char = currentPin.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash |= 0;
    }
    const salt = 'TeenGuard_Secure_Salt_2024';
    let combined = salt + currentPin + hash.toString();
    let result = '';
    for (let i = 0; i < combined.length; i++) {
      result += combined.charCodeAt(i).toString(16);
    }

    if (result !== settings.pinHash && settings.pinHash !== '') {
      Alert.alert('密码错误', '当前密码不正确');
      return;
    }

    // 生成新PIN哈希
    let newHash = 0;
    for (let i = 0; i < newPin.length; i++) {
      const char = newPin.charCodeAt(i);
      newHash = (newHash << 5) - newHash + char;
      newHash |= 0;
    }
    let newCombined = salt + newPin + newHash.toString();
    let newResult = '';
    for (let i = 0; i < newCombined.length; i++) {
      newResult += newCombined.charCodeAt(i).toString(16);
    }

    updateSettings({
      pinHash: newResult,
      isInitialized: true,
    });

    setShowChangePin(false);
    setCurrentPin('');
    setNewPin('');
    setConfirmPin('');

    Alert.alert('成功', 'PIN码已更新。请牢记新密码！');
  }, [currentPin, newPin, confirmPin, settings.pinHash, updateSettings]);

  // PIN 验证界面
  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.pinGate}>
          <Text style={styles.pinGateIcon}>🔐</Text>
          <Text style={styles.pinGateTitle}>需要家长密码</Text>
          <Text style={styles.pinGateDesc}>
            请输入4位家长密码以访问设置
          </Text>
          <TextInput
            style={styles.pinInput}
            value={pinInput}
            onChangeText={text => setPinInput(text.replace(/[^0-9]/g, '').slice(0, 4))}
            keyboardType="numeric"
            maxLength={4}
            placeholder="****"
            placeholderTextColor="#CCC"
            secureTextEntry
            autoFocus
          />
          <TouchableOpacity
            style={[
              styles.pinSubmitBtn,
              pinInput.length < 4 && styles.pinSubmitBtnDisabled,
            ]}
            onPress={handlePinSubmit}
            disabled={pinInput.length < 4}>
            <Text style={styles.pinSubmitText}>验证</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}>
            <Text style={styles.backBtnText}>返回</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* 返回按钮 */}
        <TouchableOpacity
          style={styles.backNav}
          onPress={() => navigation.goBack()}>
          <Text style={styles.backNavText}>← 返回主页</Text>
        </TouchableOpacity>

        <Text style={styles.screenTitle}>家长设置</Text>
        <Text style={styles.screenSubtitle}>
          调整游戏时限和解锁挑战难度
        </Text>

        {/* 每日游戏时限 */}
        <View style={styles.settingGroup}>
          <Text style={styles.settingLabel}>⏱ 每日游戏时限 (分钟)</Text>
          <TextInput
            style={styles.numberInput}
            value={dailyLimit}
            onChangeText={setDailyLimit}
            keyboardType="numeric"
            maxLength={3}
            placeholder="60"
            placeholderTextColor="#CCC"
          />
          <Text style={styles.settingHint}>建议: 60-120分钟 | 范围: 5-480分钟</Text>
        </View>

        {/* 数学难度 */}
        <View style={styles.settingGroup}>
          <DifficultySelector
            label="📐 数学题难度"
            value={mathDifficulty}
            onChange={setMathDifficulty}
          />
        </View>

        {/* 英语难度 */}
        <View style={styles.settingGroup}>
          <DifficultySelector
            label="🗣 英语口语难度"
            value={englishDifficulty}
            onChange={setEnglishDifficulty}
          />
        </View>

        {/* 题目数量 */}
        <View style={styles.settingRow}>
          <View style={styles.settingHalf}>
            <Text style={styles.settingLabel}>📝 数学题数</Text>
            <TextInput
              style={styles.numberInput}
              value={mathCount}
              onChangeText={setMathCount}
              keyboardType="numeric"
              maxLength={2}
              placeholder="3"
              placeholderTextColor="#CCC"
            />
          </View>
          <View style={styles.settingHalf}>
            <Text style={styles.settingLabel}>🎤 英语题数</Text>
            <TextInput
              style={styles.numberInput}
              value={englishCount}
              onChangeText={setEnglishCount}
              keyboardType="numeric"
              maxLength={2}
              placeholder="2"
              placeholderTextColor="#CCC"
            />
          </View>
        </View>

        {/* PIN 管理 */}
        <View style={styles.settingGroup}>
          <Text style={styles.settingLabel}>🔑 家长密码管理</Text>
          {!showChangePin ? (
            <TouchableOpacity
              style={styles.pinChangeBtn}
              onPress={() => setShowChangePin(true)}>
              <Text style={styles.pinChangeBtnText}>
                {settings.pinHash ? '修改家长密码' : '设置家长密码 (首次)'}
              </Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.pinChangeForm}>
              {settings.pinHash ? (
                <TextInput
                  style={styles.pinField}
                  value={currentPin}
                  onChangeText={t => setCurrentPin(t.replace(/[^0-9]/g, '').slice(0, 4))}
                  keyboardType="numeric"
                  maxLength={4}
                  placeholder="当前密码"
                  placeholderTextColor="#CCC"
                  secureTextEntry
                />
              ) : null}
              <TextInput
                style={styles.pinField}
                value={newPin}
                onChangeText={t => setNewPin(t.replace(/[^0-9]/g, '').slice(0, 4))}
                keyboardType="numeric"
                maxLength={4}
                placeholder="新密码 (4位数字)"
                placeholderTextColor="#CCC"
                secureTextEntry
              />
              <TextInput
                style={styles.pinField}
                value={confirmPin}
                onChangeText={t => setConfirmPin(t.replace(/[^0-9]/g, '').slice(0, 4))}
                keyboardType="numeric"
                maxLength={4}
                placeholder="确认新密码"
                placeholderTextColor="#CCC"
                secureTextEntry
              />
              <View style={styles.pinChangeActions}>
                <TouchableOpacity
                  style={styles.pinConfirmBtn}
                  onPress={handleChangePin}>
                  <Text style={styles.pinConfirmText}>确认修改</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.pinCancelBtn}
                  onPress={() => {
                    setShowChangePin(false);
                    setCurrentPin('');
                    setNewPin('');
                    setConfirmPin('');
                  }}>
                  <Text style={styles.pinCancelText}>取消</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        {/* 保存按钮 */}
        <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
          <Text style={styles.saveBtnText}>💾 保存所有设置</Text>
        </TouchableOpacity>

        {/* 游戏列表管理入口 */}
        <TouchableOpacity
          style={styles.gameListBtn}
          onPress={() => navigation.navigate('GameList')}>
          <Text style={styles.gameListBtnText}>
            🎮 管理游戏识别列表 →
          </Text>
        </TouchableOpacity>

        <Text style={styles.disclaimer}>
          ⚠️ 请务必牢记家长密码。如需重置，需要卸载并重新安装应用（数据将丢失）。
        </Text>
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
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  backNav: {
    marginTop: 12,
    marginBottom: 8,
  },
  backNavText: {
    fontSize: 15,
    color: '#2196F3',
  },
  screenTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#1A237E',
    marginBottom: 4,
  },
  screenSubtitle: {
    fontSize: 14,
    color: '#888',
    marginBottom: 24,
  },
  settingGroup: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  settingRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  settingHalf: {
    flex: 1,
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 18,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  settingLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  settingHint: {
    fontSize: 11,
    color: '#AAA',
    marginTop: 6,
  },
  numberInput: {
    height: 48,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    backgroundColor: '#FAFAFA',
  },
  pinChangeBtn: {
    backgroundColor: '#F0F0F0',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  pinChangeBtnText: {
    fontSize: 15,
    color: '#333',
    fontWeight: '500',
  },
  pinChangeForm: {
    gap: 10,
  },
  pinField: {
    height: 48,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#333',
    backgroundColor: '#FAFAFA',
  },
  pinChangeActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  pinConfirmBtn: {
    flex: 1,
    backgroundColor: '#F44336',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  pinConfirmText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  pinCancelBtn: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  pinCancelText: {
    color: '#666',
    fontSize: 14,
  },
  saveBtn: {
    backgroundColor: '#2196F3',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#2196F3',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  saveBtnText: {
    color: '#FFF',
    fontSize: 17,
    fontWeight: 'bold',
  },
  gameListBtn: {
    backgroundColor: '#FFF',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  gameListBtnText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  disclaimer: {
    fontSize: 12,
    color: '#F44336',
    textAlign: 'center',
    lineHeight: 18,
  },
  // PIN Gate styles
  pinGate: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  pinGateIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  pinGateTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  pinGateDesc: {
    fontSize: 14,
    color: '#888',
    marginBottom: 24,
    textAlign: 'center',
  },
  pinInput: {
    width: 200,
    height: 56,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderRadius: 14,
    paddingHorizontal: 20,
    fontSize: 28,
    textAlign: 'center',
    letterSpacing: 8,
    color: '#333',
    backgroundColor: '#FAFAFA',
    marginBottom: 16,
  },
  pinSubmitBtn: {
    width: 200,
    height: 48,
    backgroundColor: '#2196F3',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  pinSubmitBtnDisabled: {
    backgroundColor: '#BBDEFB',
  },
  pinSubmitText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  backBtn: {
    padding: 12,
  },
  backBtnText: {
    fontSize: 15,
    color: '#2196F3',
  },
});
