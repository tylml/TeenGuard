// ============================================================
// TeenGuard - Root Application Component
// Anti-Gaming-Addiction "Teen Mode" App
// ============================================================

import React, { useEffect } from 'react';
import { StatusBar, LogBox } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AppProvider, useApp } from './src/store/AppContext';
import HomeScreen from './src/screens/HomeScreen';
import LockScreen from './src/screens/LockScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import GameListScreen from './src/screens/GameListScreen';

// 忽略开发中的警告
LogBox.ignoreLogs([
  'Non-serializable values were found in the navigation state',
  'EventEmitter.removeListener',
]);

const Stack = createNativeStackNavigator();

/**
 * 内部导航组件（需要访问 AppContext）
 */
function AppNavigator() {
  const { state } = useApp();
  const { isLocked } = state;

  // 当锁屏时，隐藏底部导航栏并显示锁屏
  if (isLocked) {
    return (
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen
          name="LockScreen"
          component={LockScreen}
          options={{
            // 关键设置：全屏模态，不可手势关闭，不可返回
            presentation: 'fullScreenModal',
            gestureEnabled: false,
            animation: 'none',
          }}
        />
      </Stack.Navigator>
    );
  }

  // 正常模式：主页 + 设置 + 游戏列表
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          animation: 'slide_from_right',
        }}
      />
      <Stack.Screen
        name="GameList"
        component={GameListScreen}
        options={{
          animation: 'slide_from_right',
        }}
      />
    </Stack.Navigator>
  );
}

/**
 * 根组件
 */
function App() {
  return (
    <SafeAreaProvider>
      <AppProvider>
        <StatusBar
          barStyle="dark-content"
          backgroundColor="#F8F9FA"
          translucent={false}
        />
        <NavigationContainer>
          <AppNavigator />
        </NavigationContainer>
      </AppProvider>
    </SafeAreaProvider>
  );
}

export default App;
