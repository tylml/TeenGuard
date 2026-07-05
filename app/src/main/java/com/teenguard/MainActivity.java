package com.teenguard;

import android.app.Activity;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.provider.Settings;
import android.view.KeyEvent;
import android.webkit.JavascriptInterface;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Toast;

public class MainActivity extends Activity {
    private WebView webView;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        webView = findViewById(R.id.webview);
        setupWebView();

        // Request overlay permission on first launch
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M && !Settings.canDrawOverlays(this)) {
            Intent intent = new Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                Uri.parse("package:" + getPackageName()));
            startActivityForResult(intent, 100);
        }
    }

    private void setupWebView() {
        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setAllowFileAccess(true);

        webView.setWebViewClient(new WebViewClient());
        webView.setWebChromeClient(new WebChromeClient());
        webView.addJavascriptInterface(new AppBridge(), "TeenGuard");

        webView.loadUrl("file:///android_asset/index.html");
    }

    @Override
    public void onBackPressed() {
        // Lock状态不允许退出
        webView.evaluateJavascript("javascript:getLockState()", value -> {
            if ("true".equals(value.replace("\"", ""))) {
                return; // 锁屏中，不退出
            }
            super.onBackPressed();
        });
    }

    @Override
    protected void onResume() {
        super.onResume();
        // Restore lock overlay if needed
        if (LockService.isLocked()) {
            startService(new Intent(this, LockService.class));
        }
    }

    public class AppBridge {
        @JavascriptInterface
        public void startMonitoring() {
            Intent intent = new Intent(MainActivity.this, MonitorService.class);
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                startForegroundService(intent);
            } else {
                startService(intent);
            }
            Toast.makeText(MainActivity.this, "监控已启动", Toast.LENGTH_SHORT).show();
        }

        @JavascriptInterface
        public void stopMonitoring() {
            stopService(new Intent(MainActivity.this, MonitorService.class));
            Toast.makeText(MainActivity.this, "监控已停止", Toast.LENGTH_SHORT).show();
        }

        @JavascriptInterface
        public void lockScreen() {
            Intent intent = new Intent(MainActivity.this, LockService.class);
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                startForegroundService(intent);
            } else {
                startService(intent);
            }
            LockService.setLocked(true);
        }

        @JavascriptInterface
        public void unlockScreen() {
            stopService(new Intent(MainActivity.this, LockService.class));
            LockService.setLocked(false);
        }

        @JavascriptInterface
        public int getTodayGamingSeconds() {
            return MonitorService.getTodaySeconds(MainActivity.this);
        }

        @JavascriptInterface
        public boolean hasUsageStatsPermission() {
            return MonitorService.hasPermission(MainActivity.this);
        }

        @JavascriptInterface
        public void openUsageStatsSettings() {
            startActivity(new Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS));
        }

        @JavascriptInterface
        public boolean canDrawOverlays() {
            return Build.VERSION.SDK_INT < Build.VERSION_CODES.M ||
                Settings.canDrawOverlays(MainActivity.this);
        }

        @JavascriptInterface
        public void openOverlaySettings() {
            Intent intent = new Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                Uri.parse("package:" + getPackageName()));
            startActivity(intent);
        }

        @JavascriptInterface
        public String getCurrentApp() {
            return MonitorService.getCurrentApp(MainActivity.this);
        }

        @JavascriptInterface
        public boolean isGameApp() {
            return MonitorService.isGameApp(MainActivity.this);
        }

        @JavascriptInterface
        public void resetTimer() {
            MonitorService.resetToday(MainActivity.this);
        }

        @JavascriptInterface
        public String getSettings() {
            return getSharedPreferences("teenguard_settings", MODE_PRIVATE)
                .getString("settings", "{}");
        }

        @JavascriptInterface
        public void saveSettings(String json) {
            getSharedPreferences("teenguard_settings", MODE_PRIVATE)
                .edit().putString("settings", json).apply();
        }

        @JavascriptInterface
        public String getPinHash() {
            return getSharedPreferences("teenguard_settings", MODE_PRIVATE)
                .getString("pin_hash", "");
        }

        @JavascriptInterface
        public void savePinHash(String hash) {
            getSharedPreferences("teenguard_settings", MODE_PRIVATE)
                .edit().putString("pin_hash", hash).apply();
        }

        @JavascriptInterface
        public void exitApp() {
            finishAffinity();
        }
    }
}