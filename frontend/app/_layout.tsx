import { AuthProvider } from '@/hooks/AuthProvider';
import { Stack } from 'expo-router';
import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';
import { Pressable, Text, StyleSheet, View } from 'react-native';
import { TimerProvider, useTimer } from '../contexts/TimerContext';

const formatTime = (seconds: number) => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
};

const BreakTimerOverlay = () => {
  const { phase, secondsLeft, closeTimer } = useTimer();

  if (phase !== 'break') {
    return null;
  }

  return (
    <View style={styles.breakOverlayContainer}>
      <View style={styles.breakInfoCircle}>
        <Text style={styles.breakLabelText}>休憩中</Text>
        <Text style={styles.breakTimeText}>{formatTime(secondsLeft)}</Text>
      </View>
      <Pressable style={styles.breakCloseCircle} onPress={closeTimer}>
        <Text style={styles.breakCloseButtonText}>×</Text>
      </Pressable>
    </View>
  );
};

export default function RootLayout() {
  return (
    <AuthProvider>
      <TimerProvider>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <Stack>
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen 
              name="create-post" 
              options={{ 
                presentation: 'modal',
                title: '新規投稿' 
              }} 
            />
            <Stack.Screen
              name="edit-profile"
              options={{
                presentation: 'modal', 
                title: 'プロフィール編集',
              }}
            />
          </Stack>
          <BreakTimerOverlay />
        </GestureHandlerRootView>
      </TimerProvider>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  breakOverlayContainer: {
    position: 'absolute',
    top: 50,
    alignSelf: 'center',
    flexDirection: 'row', 
    alignItems: 'center',
    zIndex: 9999,
    gap: 12, 
  },
  breakInfoCircle: {
    width: 110,
    height: 50,
    borderRadius: 25, 
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  breakCloseCircle: {
    width: 50,
    height: 50,
    borderRadius: 25, 
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  breakLabelText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
  breakTimeText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    fontVariant: ['tabular-nums'],
  },
  breakCloseButtonText: {
    color: 'white',
    fontSize: 24,
    fontWeight: '300',
    lineHeight: 28,
  },
});

