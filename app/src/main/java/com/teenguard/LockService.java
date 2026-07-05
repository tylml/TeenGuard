package com.teenguard;

import android.app.*;
import android.content.*;
import android.graphics.Color;
import android.graphics.PixelFormat;
import android.os.*;
import android.provider.Settings;
import android.view.*;
import android.widget.*;

public class LockService extends Service {
    private WindowManager wm;
    private View overlay;

    @Override
    public void onCreate() {
        super.onCreate();
        wm = (WindowManager) getSystemService(WINDOW_SERVICE);
        String channelId = "teenguard_lock";
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel ch = new NotificationChannel(channelId, "屏幕锁定", NotificationManager.IMPORTANCE_LOW);
            ((NotificationManager) getSystemService(NOTIFICATION_SERVICE)).createNotificationChannel(ch);
        }
        Notification n = Build.VERSION.SDK_INT >= Build.VERSION_CODES.O ?
            new Notification.Builder(this, channelId)
                .setContentTitle("TeenGuard 屏幕已锁定")
                .setContentText("游戏时间已超限")
                .setSmallIcon(android.R.drawable.ic_lock_idle_lock)
                .build() :
            new Notification.Builder(this)
                .setContentTitle("TeenGuard 屏幕已锁定")
                .setContentText("游戏时间已超限")
                .setSmallIcon(android.R.drawable.ic_lock_idle_lock)
                .build();
        startForeground(2, n);
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        showOverlay();
        return START_STICKY;
    }

    private void showOverlay() {
        if (overlay != null) return;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M && !Settings.canDrawOverlays(this)) return;

        overlay = new FrameLayout(this) {
            @Override public boolean dispatchKeyEvent(KeyEvent event) { return true; }
        };
        overlay.setBackgroundColor(Color.WHITE);

        TextView tv = new TextView(this);
        tv.setText("TeenGuard\n屏幕已锁定\n请返回App完成挑战解锁");
        tv.setTextColor(Color.parseColor("#D32F2F"));
        tv.setTextSize(18);
        tv.setGravity(android.view.Gravity.CENTER);
        ((FrameLayout) overlay).addView(tv, new FrameLayout.LayoutParams(
            FrameLayout.LayoutParams.MATCH_PARENT, FrameLayout.LayoutParams.MATCH_PARENT));

        int type = Build.VERSION.SDK_INT >= Build.VERSION_CODES.O ?
            WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY :
            WindowManager.LayoutParams.TYPE_SYSTEM_OVERLAY;

        WindowManager.LayoutParams params = new WindowManager.LayoutParams(
            WindowManager.LayoutParams.MATCH_PARENT, WindowManager.LayoutParams.MATCH_PARENT,
            type,
            WindowManager.LayoutParams.FLAG_NOT_TOUCH_MODAL |
            WindowManager.LayoutParams.FLAG_FULLSCREEN |
            WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN |
            WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON,
            PixelFormat.TRANSLUCENT);
        wm.addView(overlay, params);
    }

    @Override
    public void onDestroy() {
        if (overlay != null) { try { wm.removeView(overlay); } catch (Exception e) {} overlay = null; }
        super.onDestroy();
    }

    @Override public IBinder onBind(Intent intent) { return null; }
}