import { AuthProvider } from '@/hooks/AuthProvider';
import { useFonts } from 'expo-font';
import { SplashScreen, Stack } from 'expo-router';
import React, { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';
import { Pressable, StyleSheet, View } from 'react-native';
import { TimerProvider, useTimer } from '../contexts/TimerContext';
import { MixedFontText } from '@/components/Shared/MixedFontText';

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
        <MixedFontText style={styles.breakLabelText}>休憩中</MixedFontText>
        <MixedFontText style={styles.breakTimeText}>{formatTime(secondsLeft)}</MixedFontText>
      </View>
      <Pressable style={styles.breakCloseCircle} onPress={closeTimer}>
        <MixedFontText style={styles.breakCloseButtonText}>×</MixedFontText>
      </Pressable>
    </View>
  );
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    'Klee One': require('../assets/fonts/KleeOne-SemiBold.ttf'),
    'SourceSerif4-Light': require('../assets/fonts/SourceSerif4-Light.ttf'),
    'SourceSerif4-Regular': require('../assets/fonts/SourceSerif4-Regular.ttf'),
    'SourceSerif4-Medium': require('../assets/fonts/SourceSerif4-Medium.ttf'),
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      // Hide the splash screen after the fonts have loaded (or an error was returned)
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  // Prevent rendering until the font has loaded or an error was returned
  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <AuthProvider>
      <TimerProvider>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <Stack>
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="login" options={{ headerShown: false }} />
            <Stack.Screen name="signup" options={{ headerShown: false }} />
            
            <Stack.Screen 
            name="password-reset-request" 
            options={{ 
                title: 'パスワードリセット',
                  headerShown: false }} 
          />
          <Stack.Screen 
            name="password-reset-confirm" 
            options={{ 
                 title: '新しいパスワード',
                   headerShown: false }} 
          />
          <Stack.Screen 
            name="select-level-mentor" 
            options={{ headerShown: false }} 
          />
            <Stack.Screen 
              name="create-post" 
              options={{ 
                presentation: 'modal',
                  title: '新規投稿',
                headerShown: false
              }} 

            />
            <Stack.Screen
              name="edit-profile"
              options={{

                presentation: 'modal', 
                title: 'プロフィール編集',
                headerShown: false

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
