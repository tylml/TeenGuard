// ============================================================
// TeenGuard - Lock Overlay Component
// Full-screen overlay displayed during lock state
// ============================================================

import React, { useEffect } from 'react';
import { View, StyleSheet, BackHandler, StatusBar } from 'react-native';

interface Props {
  children: React.ReactNode;
  visible: boolean;
}

/**
 * 锁屏覆盖层
 * 拦截物理返回键，提供全屏不可退出的锁定体验
 */
export default function LockOverlay({ children, visible }: Props) {
  useEffect(() => {
    if (!visible) return;

    // 拦截 Android 返回键
    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        // 返回 true 表示已消费事件，阻止默认行为
        return true;
      },
    );

    // 隐藏状态栏，防止下拉通知栏
    StatusBar.setHidden(true);

    return () => {
      backHandler.remove();
      StatusBar.setHidden(false);
    };
  }, [visible]);

  if (!visible) return null;

  return (
    <View style={styles.container}>
      <StatusBar hidden />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#FFFFFF',
    zIndex: 9999,
    elevation: 9999,
  },
});
