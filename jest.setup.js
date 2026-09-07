/* eslint-disable @typescript-eslint/no-require-imports */
import React from 'react';

// Mock MMKV
jest.mock('react-native-mmkv', () => {
  const store = new Map();
  return {
    MMKV: jest.fn().mockImplementation(() => ({
      getString: jest.fn((key) => store.get(key)),
      set: jest.fn((key, value) => {
        store.set(key, value);
      }),
      delete: jest.fn((key) => {
        store.delete(key);
      }),
      getAllKeys: jest.fn(() => Array.from(store.keys())),
      clearAll: jest.fn(() => store.clear()),
    })),
  };
});

// Mock react-native-google-cast
jest.mock('react-native-google-cast', () => {
  const { View } = require('react-native');
  return {
    __esModule: true,
    default: {
      showIntroductoryOverlay: jest.fn(),
      showExpandedControls: jest.fn(),
    },
    CastButton: (props) => <View testID="mock-cast-button" {...props} />,
    useCastSession: jest.fn(() => null),
    useCastDevice: jest.fn(() => null),
    useMediaStatus: jest.fn(() => null),
    useRemoteMediaClient: jest.fn(() => ({
      loadMedia: jest.fn(),
      play: jest.fn(),
      pause: jest.fn(),
      seek: jest.fn(),
      stop: jest.fn(),
    })),
    SessionManager: {
      endCurrentSession: jest.fn(),
    },
  };
});

// Mock react-native-video
jest.mock('react-native-video', () => {
  const { View } = require('react-native');
  return {
    __esModule: true,
    default: (props) => <View testID="mock-video-player" {...props} />,
  };
});

// Mock expo-video
jest.mock('expo-video', () => {
  const { View } = require('react-native');
  return {
    VideoView: (props) => <View testID="mock-expo-video-view" {...props} />,
    useVideoPlayer: jest.fn(() => ({
      play: jest.fn(),
      pause: jest.fn(),
      currentTime: 0,
      duration: 100,
      playing: true,
      status: 'readyToPlay',
      addListener: jest.fn(() => ({ remove: jest.fn() })),
    })),
  };
});

// Mock expo-image
jest.mock('expo-image', () => {
  const { Image } = require('react-native');
  return {
    Image: (props) => <Image testID="mock-expo-image" {...props} />,
  };
});

// Mock expo-clipboard
jest.mock('expo-clipboard', () => ({
  getStringAsync: jest.fn(() => Promise.resolve('')),
  setStringAsync: jest.fn(() => Promise.resolve(true)),
}));

// Mock safe area context
jest.mock('react-native-safe-area-context', () => {
  const inset = { top: 0, right: 0, bottom: 0, left: 0 };
  return {
    SafeAreaProvider: ({ children }) => children,
    SafeAreaView: ({ children }) => children,
    useSafeAreaInsets: () => inset,
  };
});

// Mock expo-updates
jest.mock('expo-updates', () => ({
  checkForUpdateAsync: jest.fn(() => Promise.resolve({ isAvailable: false })),
  fetchUpdateAsync: jest.fn(() => Promise.resolve()),
  reloadAsync: jest.fn(() => Promise.resolve()),
  useUpdates: jest.fn(() => ({
    isUpdateAvailable: false,
    isUpdatePending: false,
  })),
}));

