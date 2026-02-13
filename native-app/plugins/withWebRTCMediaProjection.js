const {
  AndroidConfig,
  createRunOncePlugin,
  withMainActivity,
} = require("expo/config-plugins");

const PERMISSIONS = [
  "android.permission.FOREGROUND_SERVICE",
  "android.permission.FOREGROUND_SERVICE_MEDIA_PROJECTION",
];

function withMediaProjectionPermissions(config) {
  return AndroidConfig.Permissions.withPermissions(config, PERMISSIONS);
}

function withMediaProjectionMainActivity(config) {
  return withMainActivity(config, (configWithActivity) => {
    const { modResults } = configWithActivity;
    const importLine =
      modResults.language === "kt"
        ? "import com.oney.WebRTCModule.WebRTCModuleOptions"
        : "import com.oney.WebRTCModule.WebRTCModuleOptions;";

    const enableLine =
      modResults.language === "kt"
        ? "    WebRTCModuleOptions.getInstance().enableMediaProjectionService = true"
        : "    WebRTCModuleOptions.getInstance().enableMediaProjectionService = true;";

    if (!modResults.contents.includes(importLine)) {
      modResults.contents = modResults.contents.replace(
        /import android\.os\.Bundle\n/,
        `import android.os.Bundle\n${importLine}\n`,
      );
    }

    if (!modResults.contents.includes("enableMediaProjectionService = true")) {
      modResults.contents = modResults.contents.replace(
        /\s*super\.onCreate\(null\)/,
        `\n${enableLine}\n    super.onCreate(null)`,
      );
    }

    configWithActivity.modResults = modResults;
    return configWithActivity;
  });
}

function withWebRTCMediaProjection(config) {
  config = withMediaProjectionPermissions(config);
  config = withMediaProjectionMainActivity(config);
  return config;
}

module.exports = createRunOncePlugin(
  withWebRTCMediaProjection,
  "with-webrtc-media-projection",
  "1.0.0",
);
