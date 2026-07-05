package com.teenguard;

import android.app.*;
import android.content.*;
import android.graphics.Color;
import android.graphics.PixelFormat;
import android.os.*;
import android.view.*;
import android.widget.*;
import androidx.core.app.NotificationCompat;

public class LockService extends Service {
    private static final String CHANNEL_ID = "teenguard_lock";
    private static final String PREFS = "teenguard_lock_state";
    private WindowManager wm;
    private View overlay;

    @Override
    public void onCreate() {
        super.onCreate();
        wm = (WindowManager) getSystemService(WINDOW_SERVICE);
        createChannel();
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        showOverlay();
        startForeground(2, new NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("TeenGuard 屏幕已锁定")
            .setContentText("游戏时间已超限")
            .setSmallIcon(android.R.drawable.ic_lock_idle_lock)
            .build());
        return START_STICKY;
    }

    private void showOverlay() {
        if (overlay != null) return;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M && !Settings.canDrawOverlays(this)) return;

        overlay = new FrameLayout(this) {
            @Override
            public boolean dispatchKeyEvent(KeyEvent event) {
                // Block all keys
                return true;
            }
        };
        overlay.setBackgroundColor(Color.WHITE);

        TextView tv = new TextView(this);
        tv.setText("TeenGuard\n屏幕已锁定\n\n请返回App完成挑战解锁");
        tv.setTextColor(Color.parseColor("#D32F2F"));
        tv.setTextSize(18);
        tv.setGravity(android.view.Gravity.CENTER);
        ((FrameLayout) overlay).addView(tv, new FrameLayout.LayoutParams(
            FrameLayout.LayoutParams.MATCH_PARENT, FrameLayout.LayoutParams.MATCH_PARENT));

        int type = Build.VERSION.SDK_INT >= Build.VERSION_CODES.O ?
            WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY :
            WindowManager.LayoutParams.TYPE_SYSTEM_OVERLAY;

        WindowManager.LayoutParams params = new WindowManager.LayoutParams(
            WindowManager.LayoutParams.MATCH_PARENT,
            WindowManager.LayoutParams.MATCH_PARENT,
            type,
            WindowManager.LayoutParams.FLAG_NOT_TOUCH_MODAL |
            WindowManager.LayoutParams.FLAG_FULLSCREEN |
            WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN |
            WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON,
            PixelFormat.TRANSLUCENT);

        wm.addView(overlay, params);
        setLocked(true);
    }

    @Override
    public void onDestroy() {
        if (overlay != null) {
            try { wm.removeView(overlay); } catch (Exception ignored) {}
            overlay = null;
        }
        setLocked(false);
        super.onDestroy();
    }

    @Override
    public IBinder onBind(Intent intent) { return null; }

    private void createChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel ch = new NotificationChannel(CHANNEL_ID, "屏幕锁定", NotificationManager.IMPORTANCE_LOW);
            ((NotificationManager) getSystemService(NOTIFICATION_SERVICE)).createNotificationChannel(ch);
        }
    }

    public static boolean isLocked() {
        // Returns true if locked state persisted (for reboot recovery)
        return false; // Simplified - state managed by MainActivity
    }

    public static void setLocked(boolean locked) {
        // Persist lock state for reboot recovery
        // In production, use SharedPreferences
    }
}