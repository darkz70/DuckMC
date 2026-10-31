package com.duckmc.launcher;

import android.content.Intent;
import android.content.pm.PackageManager;
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
 * DuckMCNative — нативные возможности лаунчера:
 *  - определение и запуск установленного Bedrock (com.mojang.minecraftpe)
 *  - открытие страницы в Google Play
 *  - «Установить из файла»: системный выбор APK → стандартный установщик Android
 *  - импорт .mcaddon/.mcpack: файл отдаётся самому Minecraft, он импортирует его официально
 *
 * Лаунчер ничего не скачивает со сторонних сайтов — только работает с файлами,
 * которые пользователь выбрал сам, и с официальным клиентом.
 */
@CapacitorPlugin(name = "DuckMCNative")
public class DuckMCPlugin extends Plugin {

    private static final String BEDROCK_PACKAGE = "com.mojang.minecraftpe";

    private boolean isPackageInstalled(String pkg) {
        try {
            getContext().getPackageManager().getPackageInfo(pkg, 0);
            return true;
        } catch (PackageManager.NameNotFoundException e) {
            return false;
        }
    }

    private String packageVersion(String pkg) {
        try {
            return getContext()
                .getPackageManager()
                .getPackageInfo(pkg, 0)
                .versionName;
        } catch (Exception e) {
            return null;
        }
    }

    @PluginMethod
    public void isBedrockInstalled(PluginCall call) {
        JSObject ret = new JSObject();
        ret.put("installed", isPackageInstalled(BEDROCK_PACKAGE));
        String v = packageVersion(BEDROCK_PACKAGE);
        ret.put("version", v == null ? "" : v);
        call.resolve(ret);
    }

    @PluginMethod
    public void launchBedrock(PluginCall call) {
        if (!isPackageInstalled(BEDROCK_PACKAGE)) {
            call.reject("not_installed");
            return;
        }
        Intent launch = getContext().getPackageManager().getLaunchIntentForPackage(BEDROCK_PACKAGE);
        if (launch == null) {
            call.reject("no_launch_intent");
            return;
        }
        launch.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        getContext().startActivity(launch);
        call.resolve();
    }

    @PluginMethod
    public void openStore(PluginCall call) {
        String pkg = call.getString("pkg", BEDROCK_PACKAGE);
        try {
            Intent i = new Intent(Intent.ACTION_VIEW, Uri.parse("market://details?id=" + pkg));
            i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getContext().startActivity(i);
            call.resolve();
        } catch (Exception e) {
            Intent web = new Intent(Intent.ACTION_VIEW, Uri.parse("https://play.google.com/store/apps/details?id=" + pkg));
            web.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getContext().startActivity(web);
            call.resolve();
        }
    }

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
        installFromUri(result.getData(), call);
    }

    private void installFromUri(Uri uri, PluginCall call) {
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
            copyStream(getContext().getContentResolver().openInputStream(uri), outFile);

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

    /** Выбор .mcaddon/.mcpack → официальный импорт самим Minecraft. */
    @PluginMethod
    public void pickAddonAndImport(PluginCall call) {
        Intent intent = new Intent(Intent.ACTION_OPEN_DOCUMENT);
        intent.addCategory(Intent.CATEGORY_OPENABLE);
        intent.setType("*/*");
        intent.putExtra(Intent.EXTRA_MIME_TYPES, new String[] { "application/octet-stream", "application/zip" });
        startActivityForResult(call, intent, "pickAddonResult");
    }

    @ActivityCallback
    private void pickAddonResult(PluginCall call, Intent result) {
        if (call == null || result == null || result.getData() == null) {
            if (call != null) call.reject("cancelled");
            return;
        }
        try {
            File outFile = new File(getContext().getCacheDir(), "duckmc-import.mcaddon");
            copyStream(getContext().getContentResolver().openInputStream(result.getData()), outFile);

            Uri addonUri = FileProvider.getUriForFile(
                getContext(),
                getContext().getPackageName() + ".fileprovider",
                outFile
            );
            Intent open = new Intent(Intent.ACTION_VIEW);
            open.setDataAndType(addonUri, "application/octet-stream");
            open.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_ACTIVITY_NEW_TASK);
            open.setPackage(BEDROCK_PACKAGE);
            try {
                getContext().startActivity(open);
            } catch (Exception e) {
                open.setPackage(null);
                getContext().startActivity(open);
            }
            JSObject ret = new JSObject();
            ret.put("started", true);
            call.resolve(ret);
        } catch (Exception e) {
            call.reject("import_failed", e.getMessage());
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
