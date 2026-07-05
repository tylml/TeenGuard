package com.teenguard;

import android.app.Activity;
import android.app.AppOpsManager;
import android.app.usage.UsageStats;
import android.app.usage.UsageStatsManager;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.ApplicationInfo;
import android.content.pm.PackageManager;
import android.os.Process;
import android.provider.Settings;
import android.util.Log;

import androidx.annotation.NonNull;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.modules.core.DeviceEventManagerModule;

import java.text.SimpleDateFormat;
import java.util.Calendar;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.HashSet;

/**
 * 应用使用监控模块 (React Native Bridge)
 * 使用 UsageStatsManager 监控前台应用
 * 配合 MonitoringService 在后台持续运行
 */
public class AppUsageModule extends ReactContextBaseJavaModule {

    private static final String TAG = "TeenGuard_AppUsage";
    private static final String MODULE_NAME = "GameMonitorModule";
    private static final String PREFS_NAME = "teenguard_monitor";
    private static final String KEY_TODAY_SECONDS = "today_gaming_seconds";
    private static final String KEY_TODAY_DATE = "today_date";
    private static final String KEY_KNOWN_GAMES = "known_game_packages";

    private final ReactApplicationContext reactContext;
    private SharedPreferences prefs;
    private boolean isMonitoring = false;
    private Thread monitorThread;
    private Set<String> knownGamePackages;

    public AppUsageModule(ReactApplicationContext context) {
        super(context);
        this.reactContext = context;
        this.prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);

        // 加载已知游戏包名
        this.knownGamePackages = prefs.getStringSet(KEY_KNOWN_GAMES, new HashSet<>());

        // 初始化预置游戏包名
        if (this.knownGamePackages.isEmpty()) {
            this.knownGamePackages = new HashSet<>();
            // 预置常见游戏包名
            String[] defaultGames = {
                "com.tencent.tmgp.sgame",       // 王者荣耀
                "com.tencent.tmgp.pubgmhd",     // 和平精英
                "com.miHoYo.GenshinImpact",     // 原神
                "com.HoYoverse.hkrpgoversea",   // 崩坏：星穹铁道
                "com.netease.party",            // 蛋仔派对
                "com.mojang.minecraftpe",       // 我的世界
                "com.riotgames.league.wildrift",// 英雄联盟手游
                "com.tencent.tmgp.cf",          // 穿越火线
                "com.netease.idv.googleplay",   // 第五人格
                "com.YoStarEN.Arknights",       // 明日方舟
                "com.netease.onmyoji",          // 阴阳师
                "com.supercell.clashofclans",   // 部落冲突
                "com.tencent.ig",               // PUBG Mobile
                "com.king.candycrushsaga",      // 糖果粉碎传奇
                "com.roblox.client",            // Roblox
            };
            for (String pkg : defaultGames) {
                this.knownGamePackages.add(pkg);
            }
            saveGamePackages();
        }
    }

    @NonNull
    @Override
    public String getName() {
        return MODULE_NAME;
    }

    // ========== React Native 可调用方法 ==========

    /**
     * 开始后台监控
     */
    @ReactMethod
    public void startMonitoring(Promise promise) {
        try {
            if (!hasUsageStatsPermission()) {
                promise.reject("PERMISSION_DENIED", "需要授予使用情况访问权限");
                return;
            }

            // 启动前台服务
            Intent serviceIntent = new Intent(reactContext, MonitoringService.class);
            serviceIntent.setAction("START_MONITORING");
            reactContext.startForegroundService(serviceIntent);

            isMonitoring = true;
            startMonitorThread();

            Log.d(TAG, "Monitoring started");
            promise.resolve(true);
        } catch (Exception e) {
            Log.e(TAG, "Failed to start monitoring", e);
            promise.reject("START_FAILED", e.getMessage());
        }
    }

    /**
     * 停止监控
     */
    @ReactMethod
    public void stopMonitoring(Promise promise) {
        try {
            isMonitoring = false;
            if (monitorThread != null) {
                monitorThread.interrupt();
                monitorThread = null;
            }

            Intent serviceIntent = new Intent(reactContext, MonitoringService.class);
            reactContext.stopService(serviceIntent);

            Log.d(TAG, "Monitoring stopped");
            promise.resolve(true);
        } catch (Exception e) {
            promise.reject("STOP_FAILED", e.getMessage());
        }
    }

    /**
     * 检查监控是否运行中
     */
    @ReactMethod
    public void isMonitoringActive(Promise promise) {
        promise.resolve(isMonitoring);
    }

    /**
     * 获取今日游戏时长（秒）
     */
    @ReactMethod
    public void getTodayGamingTime(Promise promise) {
        String today = getTodayDate();
        String savedDate = prefs.getString(KEY_TODAY_DATE, "");

        if (!today.equals(savedDate)) {
            // 新的一天，重置计数
            prefs.edit()
                .putInt(KEY_TODAY_SECONDS, 0)
                .putString(KEY_TODAY_DATE, today)
                .apply();
            promise.resolve(0);
        } else {
            int seconds = prefs.getInt(KEY_TODAY_SECONDS, 0);
            promise.resolve(seconds);
        }
    }

    /**
     * 获取已知游戏包名列表
     */
    @ReactMethod
    public void getKnownGamePackages(Promise promise) {
        WritableArray arr = Arguments.createArray();
        for (String pkg : knownGamePackages) {
            arr.pushString(pkg);
        }
        promise.resolve(arr);
    }

    /**
     * 添加自定义游戏包名
     */
    @ReactMethod
    public void addGamePackage(String packageName, Promise promise) {
        knownGamePackages.add(packageName);
        saveGamePackages();
        promise.resolve(true);
    }

    /**
     * 移除游戏包名
     */
    @ReactMethod
    public void removeGamePackage(String packageName, Promise promise) {
        knownGamePackages.remove(packageName);
        saveGamePackages();
        promise.resolve(true);
    }

    // ========== 内部方法 ==========

    /**
     * 开始监控线程 - 每5秒检查一次前台应用
     */
    private void startMonitorThread() {
        monitorThread = new Thread(() -> {
            String lastGamePackage = "";

            while (isMonitoring && !Thread.interrupted()) {
                try {
                    String currentPackage = getForegroundPackage();

                    // 检查是否在已知游戏列表中
                    if (knownGamePackages.contains(currentPackage)) {
                        // 检测到游戏运行
                        if (!currentPackage.equals(lastGamePackage)) {
                            // 新的游戏会话
                            String appName = getAppName(currentPackage);
                            sendEvent("onGameDetected", createGameEvent(currentPackage, appName));

                            if (lastGamePackage != null && knownGamePackages.contains(lastGamePackage)) {
                                sendEvent("onGameStopped", createStopEvent(lastGamePackage, 0));
                            }
                        }

                        // 累加游戏时长
                        addGamingSecond();
                        lastGamePackage = currentPackage;

                    } else {
                        // 当前不是游戏
                        if (lastGamePackage != null && !lastGamePackage.isEmpty()
                            && knownGamePackages.contains(lastGamePackage)) {
                            sendEvent("onGameStopped", createStopEvent(lastGamePackage, 0));
                        }
                        lastGamePackage = "";
                    }

                    // 检查是否超限
                    int todaySeconds = prefs.getInt(KEY_TODAY_SECONDS, 0);
                    // 默认 60 分钟 = 3600 秒
                    int dailyLimit = prefs.getInt("daily_limit_seconds", 3600);
                    if (todaySeconds >= dailyLimit) {
                        sendEvent("onLimitExceeded", createLimitEvent(todaySeconds));
                    }

                    Thread.sleep(5000); // 每5秒检查一次

                } catch (InterruptedException e) {
                    break;
                } catch (Exception e) {
                    Log.e(TAG, "Monitor thread error", e);
                }
            }
        });
        monitorThread.setName("TeenGuard-Monitor");
        monitorThread.setDaemon(true);
        monitorThread.start();
    }

    /**
     * 获取当前前台应用包名
     */
    private String getForegroundPackage() {
        try {
            UsageStatsManager usm = (UsageStatsManager)
                reactContext.getSystemService(Context.USAGE_STATS_SERVICE);

            long now = System.currentTimeMillis();
            long fiveSecondsAgo = now - 5000;

            List<UsageStats> stats = usm.queryUsageStats(
                UsageStatsManager.INTERVAL_DAILY,
                fiveSecondsAgo,
                now
            );

            if (stats != null && !stats.isEmpty()) {
                UsageStats recentStats = null;
                for (UsageStats stat : stats) {
                    if (recentStats == null ||
                        stat.getLastTimeUsed() > recentStats.getLastTimeUsed()) {
                        recentStats = stat;
                    }
                }
                if (recentStats != null) {
                    return recentStats.getPackageName();
                }
            }
        } catch (Exception e) {
            Log.e(TAG, "Error getting foreground package", e);
        }
        return "";
    }

    /**
     * 累加一秒游戏时间
     */
    private void addGamingSecond() {
        String today = getTodayDate();
        String savedDate = prefs.getString(KEY_TODAY_DATE, "");

        if (!today.equals(savedDate)) {
            prefs.edit()
                .putInt(KEY_TODAY_SECONDS, 1)
                .putString(KEY_TODAY_DATE, today)
                .apply();
        } else {
            int current = prefs.getInt(KEY_TODAY_SECONDS, 0);
            prefs.edit().putInt(KEY_TODAY_SECONDS, current + 1).apply();
        }
    }

    /**
     * 获取应用名称
     */
    private String getAppName(String packageName) {
        try {
            PackageManager pm = reactContext.getPackageManager();
            ApplicationInfo ai = pm.getApplicationInfo(packageName, 0);
            return (String) pm.getApplicationLabel(ai);
        } catch (Exception e) {
            // 从未知的包名中提取可读名称
            String[] parts = packageName.split("\\.");
            return parts[parts.length - 1];
        }
    }

    /**
     * 检查是否有 UsageStats 权限
     */
    private boolean hasUsageStatsPermission() {
        try {
            AppOpsManager appOps = (AppOpsManager)
                reactContext.getSystemService(Context.APP_OPS_SERVICE);
            int mode = appOps.checkOpNoThrow(
                AppOpsManager.OPSTR_GET_USAGE_STATS,
                Process.myUid(),
                reactContext.getPackageName()
            );
            return mode == AppOpsManager.MODE_ALLOWED;
        } catch (Exception e) {
            return false;
        }
    }

    /**
     * 保存游戏包名列表
     */
    private void saveGamePackages() {
        prefs.edit().putStringSet(KEY_KNOWN_GAMES, knownGamePackages).apply();
    }

    private String getTodayDate() {
        return new SimpleDateFormat("yyyy-MM-dd", Locale.getDefault())
            .format(new Date());
    }

    // ========== 事件发送 ==========

    private void sendEvent(String eventName, WritableMap params) {
        reactContext
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
            .emit(eventName, params);
    }

    private WritableMap createGameEvent(String packageName, String appName) {
        WritableMap map = Arguments.createMap();
        map.putString("packageName", packageName);
        map.putString("appName", appName);
        return map;
    }

    private WritableMap createStopEvent(String packageName, int durationSeconds) {
        WritableMap map = Arguments.createMap();
        map.putString("packageName", packageName);
        map.putInt("durationSeconds", durationSeconds);
        return map;
    }

    private WritableMap createLimitEvent(int totalSeconds) {
        WritableMap map = Arguments.createMap();
        map.putInt("totalSeconds", totalSeconds);
        return map;
    }
}
