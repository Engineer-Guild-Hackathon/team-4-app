import { Stack } from 'expo-router';
import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';

export default function RootLayout() {

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen 
          name="password-reset-request" 
          options={{ 
            title: "パスワードリセット",
            headerShown: true 
          }} 
        />
        <Stack.Screen 
          name="password-reset-confirm" 
          options={{ 
            title: "新しいパスワード",
            headerShown: true 
          }} 
        />
      </Stack>
    </GestureHandlerRootView>
  );
}
