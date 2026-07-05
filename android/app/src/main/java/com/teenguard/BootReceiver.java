package com.teenguard;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Build;
import android.util.Log;

/**
 * 开机启动广播接收器
 * 设备重启后自动恢复监控服务和锁屏状态
 *
 * 这是防止关机绕过锁屏的关键: 即使手机关机再开机,
 * 如果之前处于锁定状态, 锁屏覆盖层会在开机后自动显示
 */
public class BootReceiver extends BroadcastReceiver {

    private static final String TAG = "TeenGuard_Boot";

    @Override
    public void onReceive(Context context, Intent intent) {
        String action = intent.getAction();

        if (Intent.ACTION_BOOT_COMPLETED.equals(action) ||
            Intent.ACTION_LOCKED_BOOT_COMPLETED.equals(action)) {

            Log.d(TAG, "Boot completed - restoring services");

            // 检查是否有持久化的锁状态
            SharedPreferences lockPrefs = context.getSharedPreferences(
                "teenguard_lock_state", Context.MODE_PRIVATE
            );
            boolean wasLocked = lockPrefs.getBoolean("is_locked", false);

            // 启动监控服务
            Intent monitorIntent = new Intent(context, MonitoringService.class);
            monitorIntent.setAction(MonitoringService.ACTION_BOOT);
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                context.startForegroundService(monitorIntent);
            } else {
                context.startService(monitorIntent);
            }

            // 如果重启前处于锁定状态, 立即显示锁屏覆盖层
            if (wasLocked) {
                Log.d(TAG, "Restoring lock overlay after reboot");
                Intent lockIntent = new Intent(context, LockScreenService.class);
                lockIntent.setAction(LockScreenService.ACTION_SHOW);
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    context.startForegroundService(lockIntent);
                } else {
                    context.startService(lockIntent);
                }
            }
        }
    }
}
