package com.teenguard;

import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.provider.Settings;
import android.util.Log;

import androidx.annotation.NonNull;

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;

/**
 * 锁屏覆盖层模块 (React Native Bridge)
 * 管理系统级覆盖层的显示/隐藏
 * 覆盖层不可通过返回键、Home键或通知栏退出
 */
public class LockScreenModule extends ReactContextBaseJavaModule {

    private static final String TAG = "TeenGuard_LockScreen";
    private static final String MODULE_NAME = "LockScreenModule";

    private final ReactApplicationContext reactContext;

    public LockScreenModule(ReactApplicationContext context) {
        super(context);
        this.reactContext = context;
    }

    @NonNull
    @Override
    public String getName() {
        return MODULE_NAME;
    }

    /**
     * 显示系统级覆盖层
     * 绘制一个全屏窗口覆盖在所有应用之上（包括系统UI）
     */
    @ReactMethod
    public void showOverlay(Promise promise) {
        try {
            if (!canDrawOverlaysSync()) {
                promise.reject("PERMISSION_DENIED",
                    "需要授予\"显示在其他应用上层\"权限");
                return;
            }

            Intent serviceIntent = new Intent(reactContext, LockScreenService.class);
            serviceIntent.setAction("SHOW_LOCK_OVERLAY");

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                reactContext.startForegroundService(serviceIntent);
            } else {
                reactContext.startService(serviceIntent);
            }

            Log.d(TAG, "Lock overlay shown");
            promise.resolve(true);
        } catch (Exception e) {
            Log.e(TAG, "Failed to show overlay", e);
            promise.reject("OVERLAY_FAILED", e.getMessage());
        }
    }

    /**
     * 隐藏系统级覆盖层
     */
    @ReactMethod
    public void hideOverlay(Promise promise) {
        try {
            Intent serviceIntent = new Intent(reactContext, LockScreenService.class);
            reactContext.stopService(serviceIntent);

            Log.d(TAG, "Lock overlay hidden");
            promise.resolve(true);
        } catch (Exception e) {
            Log.e(TAG, "Failed to hide overlay", e);
            promise.reject("HIDE_FAILED", e.getMessage());
        }
    }

    /**
     * 检查是否有悬浮窗权限
     */
    @ReactMethod
    public void canDrawOverlays(Promise promise) {
        promise.resolve(canDrawOverlaysSync());
    }

    /**
     * 打开系统设置页面以授权悬浮窗权限
     */
    @ReactMethod
    public void requestOverlayPermission(Promise promise) {
        try {
            Intent intent = new Intent(
                Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                Uri.parse("package:" + reactContext.getPackageName())
            );
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);

            Activity currentActivity = getCurrentActivity();
            if (currentActivity != null) {
                currentActivity.startActivity(intent);
                promise.resolve(true);
            } else {
                // 如果没有 Activity，直接从 Context 启动
                reactContext.startActivity(intent);
                promise.resolve(true);
            }
        } catch (Exception e) {
            Log.e(TAG, "Failed to request overlay permission", e);
            promise.reject("REQUEST_FAILED", e.getMessage());
        }
    }

    /**
     * 同步检查悬浮窗权限
     */
    private boolean canDrawOverlaysSync() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            return Settings.canDrawOverlays(reactContext);
        }
        // Android 6.0 以下默认允许
        return true;
    }
}
