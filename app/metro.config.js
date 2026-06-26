// Learn more: https://docs.expo.dev/guides/customizing-metro/
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Privy's deps (e.g. jose) ship modern "exports" maps. Enable package exports
// and prefer the browser/react-native conditions so they resolve to RN-safe
// builds instead of the Node build (which imports `buffer`/`node:crypto`).
config.resolver.unstable_enablePackageExports = true;
config.resolver.unstable_conditionNames = ['react-native', 'browser', 'require'];

module.exports = config;
