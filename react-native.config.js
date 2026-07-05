module.exports = {
  project: {
    ios: {
      sourceDir: './ios',
    },
    android: {
      sourceDir: './android',
    },
  },
  dependencies: {
    // 强制 react-native-voice 自动链接
    '@voiceflow/react-native-voice': {
      platforms: {
        android: null, // 使用自动链接
        ios: {},
      },
    },
  },
};
