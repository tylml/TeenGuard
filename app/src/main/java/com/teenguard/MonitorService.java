package com.teenguard;

import android.app.*;
import android.app.usage.UsageStats;
import android.app.usage.UsageStatsManager;
import android.content.*;
import android.os.*;
import android.provider.Settings;
import java.util.*;

public class MonitorService extends Service {
    private static final String PREFS = "teenguard_monitor";
    private static final Set<String> GAME_PACKAGES = new HashSet<>(Arrays.asList(
        "com.tencent.tmgp.sgame", "com.tencent.tmgp.pubgmhd",
        "com.miHoYo.GenshinImpact", "com.netease.party",
        "com.mojang.minecraftpe", "com.roblox.client",
        "com.supercell.clashofclans", "com.tencent.ig",
        "com.king.candycrushsaga", "com.innersloth.spacemafia",
        "com.kiloo.subwaysurf", "com.dts.freefireth",
        "com.ea.game.pvz2_row", "com.supercell.clashroyale",
        "com.netease.idv.googleplay", "com.YoStarEN.Arknights"
    ));

    @Override
    public void onCreate() {
        super.onCreate();
        String channelId = "teenguard_monitor";
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel ch = new NotificationChannel(channelId, "守护监控", NotificationManager.IMPORTANCE_LOW);
            ((NotificationManager) getSystemService(NOTIFICATION_SERVICE)).createNotificationChannel(ch);
        }
        Notification n = Build.VERSION.SDK_INT >= Build.VERSION_CODES.O ?
            new Notification.Builder(this, channelId)
                .setContentTitle("TeenGuard 监控中")
                .setContentText("正在守护...")
                .setSmallIcon(android.R.drawable.ic_lock_idle_lock)
                .build() :
            new Notification.Builder(this)
                .setContentTitle("TeenGuard 监控中")
                .setContentText("正在守护...")
                .setSmallIcon(android.R.drawable.ic_lock_idle_lock)
                .build();
        startForeground(1, n);
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        new Thread(() -> {
            while (true) {
                try { checkForegroundApp(); Thread.sleep(5000); }
                catch (InterruptedException e) { break; }
            }
        }).start();
        return START_STICKY;
    }

    private void checkForegroundApp() {
        if (!hasPermission(this)) return;
        UsageStatsManager usm = (UsageStatsManager) getSystemService(USAGE_STATS_SERVICE);
        long now = System.currentTimeMillis();
        List<UsageStats> stats = usm.queryUsageStats(UsageStatsManager.INTERVAL_DAILY, now - 10000, now);
        if (stats == null || stats.isEmpty()) return;
        UsageStats top = null;
        for (UsageStats s : stats) {
            if (top == null || s.getLastTimeUsed() > top.getLastTimeUsed()) top = s;
        }
        if (top == null) return;
        String pkg = top.getPackageName();
        SharedPreferences prefs = getSharedPreferences(PREFS, MODE_PRIVATE);
        prefs.edit().putString("current_app", pkg).apply();
        if (GAME_PACKAGES.contains(pkg)) {
            String today = new java.text.SimpleDateFormat("yyyy-MM-dd", Locale.getDefault()).format(new Date());
            String savedDate = prefs.getString("date", "");
            int secs = prefs.getInt("seconds", 0);
            if (!today.equals(savedDate)) { secs = 0; prefs.edit().putString("date", today).apply(); }
            prefs.edit().putInt("seconds", secs + 1).apply();
        }
    }

    @Override public IBinder onBind(Intent intent) { return null; }

    public static int getTodaySeconds(Context ctx) {
        SharedPreferences p = ctx.getSharedPreferences(PREFS, MODE_PRIVATE);
        String today = new java.text.SimpleDateFormat("yyyy-MM-dd", Locale.getDefault()).format(new Date());
        if (!today.equals(p.getString("date", ""))) return 0;
        return p.getInt("seconds", 0);
    }
    public static String getCurrentApp(Context ctx) {
        return ctx.getSharedPreferences(PREFS, MODE_PRIVATE).getString("current_app", "");
    }
    public static boolean isGameApp(Context ctx) {
        return GAME_PACKAGES.contains(getCurrentApp(ctx));
    }
    public static boolean hasPermission(Context ctx) {
        try {
            android.app.AppOpsManager appOps = (android.app.AppOpsManager) ctx.getSystemService(Context.APP_OPS_SERVICE);
            int mode = appOps.checkOpNoThrow("android:get_usage_stats", Process.myUid(), ctx.getPackageName());
            return mode == android.app.AppOpsManager.MODE_ALLOWED;
        } catch (Exception e) { return false; }
    }
    public static void resetToday(Context ctx) {
        ctx.getSharedPreferences(PREFS, MODE_PRIVATE).edit().putInt("seconds", 0).apply();
    }
}