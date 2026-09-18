const { withAndroidManifest, withDangerousMod, withAndroidStyles } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

function withAndroidTV(config, options = {}) {
  // 1. Modificações no AndroidManifest.xml
  config = withAndroidManifest(config, async (config) => {
    const manifest = config.modResults.manifest;

    if (!manifest['uses-feature']) {
      manifest['uses-feature'] = [];
    }

    // Habilitar suporte a Leanback (Android TV) com required=false para funcionar em celular também
    const hasLeanback = manifest['uses-feature'].some(
      (f) => f.$?.['android:name'] === 'android.software.leanback'
    );
    if (!hasLeanback) {
      manifest['uses-feature'].push({
        $: {
          'android:name': 'android.software.leanback',
          'android:required': 'false',
        },
      });
    }

    // Declarar que touchscreen NÃO é obrigatório (para rodar em TVs nativamente)
    const hasTouchscreen = manifest['uses-feature'].some(
      (f) => f.$?.['android:name'] === 'android.hardware.touchscreen'
    );
    if (!hasTouchscreen) {
      manifest['uses-feature'].push({
        $: {
          'android:name': 'android.hardware.touchscreen',
          'android:required': 'false',
        },
      });
    }

    // Configurar Banner de TV na aplicação e na Activity principal
    const app = manifest.application?.[0];
    if (app) {
      if (!app.$) app.$ = {};
      app.$['android:banner'] = '@drawable/tv_banner';

      const mainActivity = app.activity?.find((a) =>
        a.$?.['android:name']?.includes('MainActivity')
      );

      if (mainActivity) {
        if (!mainActivity.$) mainActivity.$ = {};
        mainActivity.$['android:banner'] = '@drawable/tv_banner';

        if (!mainActivity['intent-filter']) {
          mainActivity['intent-filter'] = [];
        }

        const hasLeanbackLauncher = mainActivity['intent-filter'].some((filter) =>
          filter.category?.some(
            (cat) => cat.$?.['android:name'] === 'android.intent.category.LEANBACK_LAUNCHER'
          )
        );

        if (!hasLeanbackLauncher) {
          mainActivity['intent-filter'].push({
            action: [{ $: { 'android:name': 'android.intent.action.MAIN' } }],
            category: [
              { $: { 'android:name': 'android.intent.category.LEANBACK_LAUNCHER' } },
            ],
          });
        }
      }
    }

    return config;
  });

  // 2. Configurar barra de navegação virtual preta e imersiva no styles.xml (Android)
  config = withAndroidStyles(config, async (config) => {
    const styles = config.modResults;
    if (styles.resources?.style) {
      const appTheme = styles.resources.style.find(
        (s) => s.$?.name === 'AppTheme'
      );
      if (appTheme) {
        if (!appTheme.item) appTheme.item = [];

        const setItem = (name, value) => {
          const existing = appTheme.item.find((i) => i.$?.name === name);
          if (existing) {
            existing._ = value;
          } else {
            appTheme.item.push({ $: { name }, _: value });
          }
        };

        setItem('android:navigationBarColor', '#000000');
        setItem('android:windowTranslucentNavigation', 'false');
        setItem('android:enforceNavigationBarContrast', 'false');
      }
    }
    return config;
  });

  // 3. Copiar assets/tv-banner.png para android/app/src/main/res/drawable/
  config = withDangerousMod(config, [
    'android',
    async (config) => {
      const bannerSource = path.resolve(
        config.modRequest.projectRoot,
        options.banner || 'assets/tv-banner.png'
      );
      if (fs.existsSync(bannerSource)) {
        const drawableDir = path.resolve(
          config.modRequest.platformProjectRoot,
          'app/src/main/res/drawable'
        );
        if (!fs.existsSync(drawableDir)) {
          fs.mkdirSync(drawableDir, { recursive: true });
        }
        const targetPath = path.join(drawableDir, 'tv_banner.png');
        fs.copyFileSync(bannerSource, targetPath);
      }
      return config;
    },
  ]);

  return config;
}

module.exports = withAndroidTV;
