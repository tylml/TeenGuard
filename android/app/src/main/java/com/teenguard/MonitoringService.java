package com.teenguard;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Build;
import android.os.IBinder;
import android.util.Log;

import androidx.annotation.Nullable;
import androidx.core.app.NotificationCompat;

/**
 * 前台服务 - 保持后台监控持续运行
 * 显示持久通知，防止被系统杀死
 * 支持开机自启动以恢复锁屏状态
 */
public class MonitoringService extends Service {

    private static final String TAG = "TeenGuard_Service";
    private static final String CHANNEL_ID = "teenguard_monitor_channel";
    private static final int NOTIFICATION_ID = 1001;

    public static final String ACTION_START = "START_MONITORING";
    public static final String ACTION_STOP = "STOP_MONITORING";
    public static final String ACTION_BOOT = "BOOT_COMPLETED";

    private SharedPreferences lockPrefs;

    @Override
    public void onCreate() {
        super.onCreate();
        Log.d(TAG, "MonitoringService onCreate");

        lockPrefs = getSharedPreferences("teenguard_lock_state", Context.MODE_PRIVATE);

        createNotificationChannel();
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        Log.d(TAG, "Service onStartCommand");

        if (intent != null) {
            String action = intent.getAction();
            if (ACTION_STOP.equals(action)) {
                stopForeground(true);
                stopSelf();
                return START_NOT_STICKY;
            }
        }

        // 构建通知
        Notification notification = buildNotification();
        startForeground(NOTIFICATION_ID, notification);

        // 如果是开机启动，检查是否有持久化的锁状态
        if (intent != null && ACTION_BOOT.equals(intent.getAction())) {
            checkAndRestoreLockState();
        }

        // START_STICKY: 服务被杀后自动重启
        return START_STICKY;
    }

    @Nullable
    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    @Override
    public void onDestroy() {
        super.onDestroy();
        Log.d(TAG, "MonitoringService onDestroy");
    }

    /**
     * 检查并恢复锁屏状态 (用于开机自启动)
     * 如果关机前处于锁定状态，重启后继续锁定
     */
    private void checkAndRestoreLockState() {
        boolean wasLocked = lockPrefs.getBoolean("is_locked", false);
        if (wasLocked) {
            Log.d(TAG, "Restoring lock state after boot");
            // 发送广播通知 LockScreenService 显示覆盖层
            Intent lockIntent = new Intent(this, LockScreenService.class);
            lockIntent.setAction("SHOW_LOCK_OVERLAY");
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                startForegroundService(lockIntent);
            } else {
                startService(lockIntent);
            }
        }
    }

    /**
     * 创建通知渠道 (Android 8.0+)
     */
    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                CHANNEL_ID,
                "青少年守护监控",
                NotificationManager.IMPORTANCE_LOW
            );
            channel.setDescription("显示游戏时长监控状态");
            channel.setShowBadge(false);

            NotificationManager manager = getSystemService(NotificationManager.class);
            if (manager != null) {
                manager.createNotificationChannel(channel);
            }
        }
    }

    /**
     * 构建持久通知
     */
    private Notification buildNotification() {
        // 点击通知打开主应用
        Intent appIntent = getPackageManager()
            .getLaunchIntentForPackage(getPackageName());
        PendingIntent pendingIntent = PendingIntent.getActivity(
            this, 0, appIntent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        return new NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("TeenGuard 守护中")
            .setContentText("正在监控游戏使用时长")
            .setSmallIcon(android.R.drawable.ic_lock_idle_lock)
            .setOngoing(true)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .setContentIntent(pendingIntent)
            .setCategory(NotificationCompat.CATEGORY_SERVICE)
            .build();
    }
}
