// ============================================================
// TeenGuard - Game List Management Screen
// Manage known game packages for detection
// ============================================================

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
  SafeAreaView,
} from 'react-native';
import { KNOWN_GAME_PACKAGES } from '../constants/defaults';
import {
  getCustomGamePackages,
  addCustomGamePackage,
  removeCustomGamePackage,
} from '../utils/gameDetector';

interface GameEntry {
  packageName: string;
  appName: string;
  isCustom: boolean;
}

export default function GameListScreen({ navigation }: any) {
  const [customPackages, setCustomPackages] = useState(getCustomGamePackages());
  const [showAddForm, setShowAddForm] = useState(false);
  const [newPackageName, setNewPackageName] = useState('');
  const [newAppName, setNewAppName] = useState('');

  const allGames: GameEntry[] = [
    ...Object.entries(KNOWN_GAME_PACKAGES).map(([pkg, name]) => ({
      packageName: pkg,
      appName: name,
      isCustom: false,
    })),
    ...Object.entries(customPackages).map(([pkg, name]) => ({
      packageName: pkg,
      appName: name,
      isCustom: true,
    })),
  ];

  const handleAdd = useCallback(() => {
    if (!newPackageName.trim() || !newAppName.trim()) {
      Alert.alert('输入不完整', '请输入游戏包名和应用名称');
      return;
    }

    addCustomGamePackage(newPackageName.trim(), newAppName.trim());
    setCustomPackages(getCustomGamePackages());
    setNewPackageName('');
    setNewAppName('');
    setShowAddForm(false);

    Alert.alert('添加成功', `已添加 "${newAppName}" 到游戏识别列表`);
  }, [newPackageName, newAppName]);

  const handleRemove = useCallback((packageName: string, appName: string) => {
    Alert.alert(
      '确认删除',
      `确定要从识别列表中移除 "${appName}" 吗？`,
      [
        { text: '取消', style: 'cancel' },
        {
          text: '删除',
          style: 'destructive',
          onPress: () => {
            removeCustomGamePackage(packageName);
            setCustomPackages(getCustomGamePackages());
          },
        },
      ],
    );
  }, []);

  const renderItem = ({ item }: { item: GameEntry }) => (
    <View style={styles.gameItem}>
      <View style={styles.gameInfo}>
        <Text style={styles.gameName}>{item.appName}</Text>
        <Text style={styles.gamePackage}>{item.packageName}</Text>
        {item.isCustom && <Text style={styles.customBadge}>自定义</Text>}
      </View>
      {item.isCustom && (
        <TouchableOpacity
          style={styles.removeBtn}
          onPress={() => handleRemove(item.packageName, item.appName)}>
          <Text style={styles.removeBtnText}>删除</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* 头部 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← 返回</Text>
        </TouchableOpacity>
        <Text style={styles.title}>游戏识别列表</Text>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => setShowAddForm(!showAddForm)}>
          <Text style={styles.addBtnText}>
            {showAddForm ? '取消' : '+ 添加'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* 添加表单 */}
      {showAddForm && (
        <View style={styles.addForm}>
          <TextInput
            style={styles.addInput}
            value={newPackageName}
            onChangeText={setNewPackageName}
            placeholder="游戏包名 (如 com.example.game)"
            placeholderTextColor="#AAA"
            autoCapitalize="none"
            autoCorrect={false}
          />
          <TextInput
            style={styles.addInput}
            value={newAppName}
            onChangeText={setNewAppName}
            placeholder="游戏名称 (如 王者荣耀)"
            placeholderTextColor="#AAA"
          />
          <TouchableOpacity style={styles.addConfirmBtn} onPress={handleAdd}>
            <Text style={styles.addConfirmText}>确认添加</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* 列表 */}
      <FlatList
        data={allGames}
        keyExtractor={item => item.packageName}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <Text style={styles.listHeader}>
            已识别游戏: {allGames.length} 款
          </Text>
        }
        ListEmptyComponent={
          <Text style={styles.emptyText}>暂无游戏记录</Text>
        }
      />

      {/* 底部说明 */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          💡 提示: 内置列表包含常见游戏。{'\n'}
          如果孩子的游戏未被识别，请手动添加其包名。{'\n'}
          可在手机设置的"应用信息"中查看应用的包名。
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backText: {
    fontSize: 15,
    color: '#2196F3',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  addBtn: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addBtnText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 14,
  },
  addForm: {
    margin: 16,
    padding: 16,
    backgroundColor: '#FFF',
    borderRadius: 16,
    gap: 10,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  addInput: {
    height: 44,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 10,
    paddingHorizontal: 14,
    fontSize: 14,
    color: '#333',
    backgroundColor: '#FAFAFA',
  },
  addConfirmBtn: {
    backgroundColor: '#4CAF50',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  addConfirmText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '600',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  listHeader: {
    fontSize: 13,
    color: '#888',
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  gameItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 14,
    borderRadius: 12,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  gameInfo: {
    flex: 1,
  },
  gameName: {
    fontSize: 15,
    fontWeight: '500',
    color: '#333',
  },
  gamePackage: {
    fontSize: 11,
    color: '#AAA',
    marginTop: 2,
    fontFamily: 'monospace',
  },
  customBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#E3F2FD',
    color: '#1565C0',
    fontSize: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    overflow: 'hidden',
  },
  removeBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: '#FFF3F3',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FFCDD2',
    marginLeft: 12,
  },
  removeBtnText: {
    color: '#D32F2F',
    fontSize: 13,
  },
  emptyText: {
    textAlign: 'center',
    color: '#AAA',
    fontSize: 14,
    marginTop: 40,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  footerText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    lineHeight: 20,
  },
});
