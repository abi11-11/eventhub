
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Exclude problematic react-native temporary directories from file watching
config.projectRoot = __dirname;
config.watchFolders = [__dirname];

// Aggressive blacklist to prevent file watcher errors
const defaultBlacklist = config.resolver.blacklistRE || [];
config.resolver.blacklistRE = [
  ...defaultBlacklist,
  /node_modules\/\.react-native-.*/,
  /node_modules\/react-native\/template/,
  /\.git\/.*/,
  /\.gradle\/.*/,
];

// Additional file watching configuration
config.resolver.useWatchman = true;

module.exports = config;
