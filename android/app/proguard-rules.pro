# TeenGuard ProGuard Rules
# 保留 React Native 相关类
-keep class com.facebook.react.** { *; }
-keep class com.facebook.hermes.** { *; }

# 保留 TeenGuard 原生模块
-keep class com.teenguard.** { *; }
