package com.teenguard;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.SharedPreferences;
import android.graphics.Color;
import android.graphics.PixelFormat;
import android.os.Build;
import android.os.IBinder;
import android.util.Log;
import android.view.Gravity;
import android.view.KeyEvent;
import android.view.View;
import android.view.WindowManager;
import android.widget.FrameLayout;
import android.widget.TextView;

import androidx.annotation.Nullable;

/**
 * 锁屏覆盖层服务
 * 使用 SYSTEM_ALERT_WINDOW 权限创建全屏覆盖层
 * 该覆盖层无法通过返回键、Home键、通知栏等正常方式退出
 *
 * 重要: 此服务通过前台服务保持存活
 * 关机重启后通过 MonitoringService 自动恢复
 */
public class LockScreenService extends Service {

    private static final String TAG = "TeenGuard_LockService";
    private static final String CHANNEL_ID = "teenguard_lock_channel";
    private static final int NOTIFICATION_ID = 1002;

    public static final String ACTION_SHOW = "SHOW_LOCK_OVERLAY";

    private WindowManager windowManager;
    private View overlayView;
    private SharedPreferences lockPrefs;
    private boolean isOverlayShown = false;
    private BroadcastReceiver screenOffReceiver;

    @Override
    public void onCreate() {
        super.onCreate();
        Log.d(TAG, "LockScreenService onCreate");

        windowManager = (WindowManager) getSystemService(WINDOW_SERVICE);
        lockPrefs = getSharedPreferences("teenguard_lock_state", Context.MODE_PRIVATE);

        createNotificationChannel();

        // 注册屏幕关闭广播 - 防止通过关机键绕过
        registerScreenOffReceiver();
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        Log.d(TAG, "LockScreenService onStartCommand");

        if (intent != null && ACTION_SHOW.equals(intent.getAction())) {
            showOverlay();
            startForeground(NOTIFICATION_ID, buildNotification());
        }

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
        hideOverlay();
        unregisterScreenOffReceiver();
        Log.d(TAG, "LockScreenService onDestroy");
    }

    /**
     * 显示全屏覆盖层
     * 这是整个应用最核心的锁定机制
     */
    private void showOverlay() {
        if (isOverlayShown) return;

        try {
            // 创建覆盖层视图
            overlayView = createOverlayView();

            // WindowManager 参数配置
            int layoutFlag;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                // Android 8.0+ 使用 TYPE_APPLICATION_OVERLAY
                layoutFlag = WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY;
            } else {
                // 旧版本使用 TYPE_SYSTEM_OVERLAY
                layoutFlag = WindowManager.LayoutParams.TYPE_SYSTEM_OVERLAY;
            }

            WindowManager.LayoutParams params = new WindowManager.LayoutParams(
                WindowManager.LayoutParams.MATCH_PARENT,
                WindowManager.LayoutParams.MATCH_PARENT,
                layoutFlag,
                // 关键标志位:
                WindowManager.LayoutParams.FLAG_NOT_TOUCH_MODAL
                    | WindowManager.LayoutParams.FLAG_FULLSCREEN
                    | WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN
                    | WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON
                    | WindowManager.LayoutParams.FLAG_DISMISS_KEYGUARD
                    | WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED,
                PixelFormat.TRANSLUCENT
            );

            params.gravity = Gravity.TOP | Gravity.LEFT;
            params.x = 0;
            params.y = 0;

            windowManager.addView(overlayView, params);
            isOverlayShown = true;

            // 持久化锁状态
            lockPrefs.edit().putBoolean("is_locked", true).apply();

            Log.d(TAG, "Overlay shown successfully");
        } catch (Exception e) {
            Log.e(TAG, "Failed to show overlay", e);
        }
    }

    /**
     * 隐藏覆盖层
     */
    private void hideOverlay() {
        if (!isOverlayShown || overlayView == null) return;

        try {
            windowManager.removeView(overlayView);
            isOverlayShown = false;
            overlayView = null;

            // 清除持久化锁状态
            lockPrefs.edit().putBoolean("is_locked", false).apply();

            Log.d(TAG, "Overlay hidden");
        } catch (Exception e) {
            Log.e(TAG, "Failed to hide overlay", e);
        }
    }

    /**
     * 创建覆盖层视图
     * 这是一个简单的占位视图——实际的 React Native UI 通过 App.tsx 中的 LockScreen 组件显示
     * 此覆盖层的作用是:
     * 1. 在原生层面拦截所有触摸事件
     * 2. 拦截物理按键 (返回、Home、多任务)
     * 3. 确保即使 RN 进程被暂停，覆盖层依然存在
     */
    private View createOverlayView() {
        FrameLayout layout = new FrameLayout(this) {
            @Override
            public boolean dispatchKeyEvent(KeyEvent event) {
                // 拦截所有物理按键
                int keyCode = event.getKeyCode();
                switch (keyCode) {
                    case KeyEvent.KEYCODE_BACK:
                    case KeyEvent.KEYCODE_HOME:
                    case KeyEvent.KEYCODE_APP_SWITCH:
                    case KeyEvent.KEYCODE_VOLUME_UP:
                    case KeyEvent.KEYCODE_VOLUME_DOWN:
                    case KeyEvent.KEYCODE_MENU:
                    case KeyEvent.KEYCODE_SEARCH:
                        // 完全拦截这些按键
                        return true;
                }
                return super.dispatchKeyEvent(event);
            }
        };

        layout.setBackgroundColor(Color.WHITE);
        layout.setClickable(true);
        layout.setFocusable(true);
        layout.setFocusableInTouchMode(true);

        // 添加简单的文字提示（实际 UI 由 RN 端 LockScreen 渲染）
        TextView hintText = new TextView(this);
        hintText.setText("🔒 屏幕已锁定\n\n请返回 TeenGuard 应用\n完成挑战以解锁");
        hintText.setTextColor(Color.parseColor("#D32F2F"));
        hintText.setTextSize(16);
        hintText.setGravity(Gravity.CENTER);
        hintText.setTextAlignment(View.TEXT_ALIGNMENT_CENTER);

        FrameLayout.LayoutParams textParams = new FrameLayout.LayoutParams(
            FrameLayout.LayoutParams.WRAP_CONTENT,
            FrameLayout.LayoutParams.WRAP_CONTENT
        );
        textParams.gravity = Gravity.CENTER;
        layout.addView(hintText, textParams);

        return layout;
    }

    /**
     * 创建通知渠道
     */
    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                CHANNEL_ID,
                "屏幕锁定服务",
                NotificationManager.IMPORTANCE_LOW
            );
            channel.setDescription("保持屏幕锁定状态");
            channel.setShowBadge(false);

            NotificationManager manager = getSystemService(NotificationManager.class);
            if (manager != null) {
                manager.createNotificationChannel(channel);
            }
        }
    }

    /**
     * 构建前台服务通知
     */
    private Notification buildNotification() {
        Intent appIntent = getPackageManager()
            .getLaunchIntentForPackage(getPackageName());
        PendingIntent pendingIntent = PendingIntent.getActivity(
            this, 0, appIntent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            return new Notification.Builder(this, CHANNEL_ID)
                .setContentTitle("🔒 屏幕已锁定")
                .setContentText("游戏时间已超限，请完成挑战解锁")
                .setSmallIcon(android.R.drawable.ic_lock_idle_lock)
                .setOngoing(true)
                .setContentIntent(pendingIntent)
                .build();
        } else {
            return new Notification.Builder(this)
                .setContentTitle("🔒 屏幕已锁定")
                .setContentText("游戏时间已超限，请完成挑战解锁")
                .setSmallIcon(android.R.drawable.ic_lock_idle_lock)
                .setOngoing(true)
                .setContentIntent(pendingIntent)
                .setPriority(Notification.PRIORITY_LOW)
                .build();
        }
    }

    /**
     * 注册屏幕关闭广播接收器
     * 防止用户通过关机/重启绕过锁屏
     */
    private void registerScreenOffReceiver() {
        screenOffReceiver = new BroadcastReceiver() {
            @Override
            public void onReceive(Context context, Intent intent) {
                String action = intent.getAction();
                if (Intent.ACTION_SCREEN_OFF.equals(action)) {
                    // 屏幕关闭时确保锁状态已持久化
                    lockPrefs.edit().putBoolean("is_locked", true).apply();
                    Log.d(TAG, "Screen off - lock state persisted");
                } else if (Intent.ACTION_SCREEN_ON.equals(action)) {
                    // 屏幕重新打开时，如果仍锁定则重新显示覆盖层
                    if (lockPrefs.getBoolean("is_locked", false) && !isOverlayShown) {
                        showOverlay();
                        Log.d(TAG, "Screen on - overlay restored");
                    }
                }
            }
        };

        IntentFilter filter = new IntentFilter();
        filter.addAction(Intent.ACTION_SCREEN_OFF);
        filter.addAction(Intent.ACTION_SCREEN_ON);
        registerReceiver(screenOffReceiver, filter);
    }

    /**
     * 取消屏幕广播接收器
     */
    private void unregisterScreenOffReceiver() {
        if (screenOffReceiver != null) {
            try {
                unregisterReceiver(screenOffReceiver);
            } catch (Exception e) {
                Log.e(TAG, "Error unregistering receiver", e);
            }
            screenOffReceiver = null;
        }
    }
}
