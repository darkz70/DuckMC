package com.duckmc.launcher;

import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.provider.Settings;

import androidx.core.content.FileProvider;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.ActivityCallback;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.io.OutputStream;

/**
 * DuckMCNative — нативные возможности лаунчера.
 * «Установить из файла»: системный выбор APK пользователем → стандартный установщик Android.
 * Лаунчер ничего не скачивает со сторонних сайтов — работает только с файлами,
 * которые пользователь выбрал сам.
 */
@CapacitorPlugin(name = "DuckMCNative")
public class DuckMCPlugin extends Plugin {

    /** Выбор APK пользователем → установка через системный установщик. */
    @PluginMethod
    public void pickApkAndInstall(PluginCall call) {
        Intent intent = new Intent(Intent.ACTION_OPEN_DOCUMENT);
        intent.addCategory(Intent.CATEGORY_OPENABLE);
        intent.setType("application/vnd.android.package-archive");
        startActivityForResult(call, intent, "pickApkResult");
    }

    @ActivityCallback
    private void pickApkResult(PluginCall call, Intent result) {
        if (call == null || result == null || result.getData() == null) {
            if (call != null) call.reject("cancelled");
            return;
        }
        try {
            if (
                Build.VERSION.SDK_INT >= Build.VERSION_CODES.O &&
                !getContext().getPackageManager().canRequestPackageInstalls()
            ) {
                // Просим разрешение «Устанавливать неизвестные приложения» для нашего лаунчера
                Intent perm = new Intent(
                    Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES,
                    Uri.parse("package:" + getContext().getPackageName())
                );
                perm.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                getContext().startActivity(perm);
                call.reject("need_install_permission");
                return;
            }

            File outFile = new File(getContext().getCacheDir(), "duckmc-install.apk");
            copyStream(getContext().getContentResolver().openInputStream(result.getData()), outFile);

            Uri apkUri = FileProvider.getUriForFile(
                getContext(),
                getContext().getPackageName() + ".fileprovider",
                outFile
            );
            Intent install = new Intent(Intent.ACTION_VIEW);
            install.setDataAndType(apkUri, "application/vnd.android.package-archive");
            install.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_ACTIVITY_NEW_TASK);
            getContext().startActivity(install);

            JSObject ret = new JSObject();
            ret.put("started", true);
            call.resolve(ret);
        } catch (Exception e) {
            call.reject("install_failed", e.getMessage());
        }
    }

    private void copyStream(InputStream in, File outFile) throws Exception {
        if (in == null) throw new IllegalArgumentException("stream is null");
        try (OutputStream out = new FileOutputStream(outFile)) {
            byte[] buf = new byte[1 << 16];
            int n;
            while ((n = in.read(buf)) > 0) out.write(buf, 0, n);
        } finally {
            in.close();
        }
    }
}
