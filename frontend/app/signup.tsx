import { UserCreateOut } from '@/types/user';
import { apiClient } from '@/utils/apiClient';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, View, TouchableOpacity, KeyboardAvoidingView, TouchableWithoutFeedback, Platform, Keyboard } from 'react-native';
import { theme } from '@/styles/theme';
import { MixedFontText } from '@/components/Shared/MixedFontText';
import { formSubmitHaptic, successHaptic, errorHaptic } from '@/utils/haptics';

const remToPx = (rem: string) => parseFloat(rem) * 16;

export default function UserCreateScreen() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleCreate = async () => {
    setError('');
    setSuccess('');
    formSubmitHaptic();
    try {
      const res = await apiClient<UserCreateOut>('/api/users/', {
        method: 'POST',
        body: { username, email, password },
      });
      // access, refresh保存
      await SecureStore.setItemAsync('accessToken', res.access);
      await SecureStore.setItemAsync('refreshToken', res.refresh);
      successHaptic();
      setSuccess('ユーザー作成に成功しました');
      setUsername('');
      setEmail('');
      setPassword('');
      router.replace('/'); // index.tsxに遷移
    } catch (e: unknown) {
      errorHaptic();
      setError((e as Error).message || 'ユーザー作成に失敗しました');
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.keyboardAvoidingContainer}
    >
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
    <View style={styles.container}>
      <MixedFontText style={styles.title}>ユーザー作成</MixedFontText>
      <TextInput
        style={styles.input}
        placeholder="ユーザー名"
        autoCapitalize="none"
        value={username}
        onChangeText={setUsername}
      />
      <TextInput
        style={styles.input}
        placeholder="メールアドレス"
        autoCapitalize="none"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={styles.input}
        placeholder="パスワード"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      {error ? <MixedFontText style={styles.error}>{error}</MixedFontText> : null}
      {success ? <MixedFontText style={styles.success}>{success}</MixedFontText> : null}
      <TouchableOpacity style={styles.button} onPress={handleCreate}>
        <MixedFontText style={styles.buttonText}>ユーザー作成</MixedFontText>
      </TouchableOpacity>

      <TouchableOpacity style={styles.backButton} onPress={() => router.push('/login')}>
        <Text style={styles.backButtonText}>ログイン画面に戻る</Text>
      </TouchableOpacity>
    </View>
    </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: remToPx(theme.spacing[8]), // 2rem → 32px
    backgroundColor: theme.colors.background.primary,
  },
  title: {
    fontSize: remToPx(theme.typography.fontSize['2xl']),
    fontWeight: theme.typography.fontWeight.bold,
    marginBottom: remToPx(theme.spacing[8]),
    color: theme.colors.text.primary,
  },
  input: {
    width: '100%',
    maxWidth: 320,
    height: 48,
    borderColor: theme.colors.border,
    borderWidth: 1,
    borderRadius: remToPx(theme.borderRadius.md),
    marginBottom: remToPx(theme.spacing[4]),
    paddingHorizontal: remToPx(theme.spacing[4]),
    fontSize: remToPx(theme.typography.fontSize.base),
    backgroundColor: theme.colors.background.secondary,
    color: theme.colors.text.primary,
  },
  error: {
    color: theme.colors.semantic.error.main,
    marginBottom: remToPx(theme.spacing[4]),
  },
  success: {
    color: theme.colors.semantic.success.main,
    marginBottom: remToPx(theme.spacing[4]),
  },
  button: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: theme.colors.primary[300],
    paddingVertical: remToPx(theme.spacing[4]),
    borderRadius: remToPx(theme.borderRadius.md),
    alignItems: 'center',
    marginTop: remToPx(theme.spacing[2]),
  },
  buttonText: {
    color: theme.colors.text.inverse,
    fontSize: remToPx(theme.typography.fontSize.base),
    fontWeight: theme.typography.fontWeight.semibold,
  },
  backButton: {
    alignItems: 'center',
    padding: remToPx(theme.spacing[3]),
    marginTop: remToPx(theme.spacing[4]),
  },
  backButtonText: {
    color: theme.colors.text.link,
    fontSize: remToPx(theme.typography.fontSize.base),
    fontFamily: 'Klee One',
  },
  keyboardAvoidingContainer: {
    flex: 1,
  },
});
