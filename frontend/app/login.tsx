import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import { useAuth } from '@/hooks/AuthProvider';
import { useRouter } from 'expo-router';
import { theme } from '@/styles/theme';
import { MixedFontText } from '@/components/Shared/MixedFontText';

const remToPx = (rem: string) => parseFloat(rem) * 16;

export default function LoginScreen() {
  const { login, loading } = useAuth();
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async () => {
    setError('');
    try {
      await login(username, password);
    } catch (e: unknown) {
      setError('ユーザーネームまたはパスワードが正しくありません');
    }
  };

  return (
    <View style={styles.container}>
      <MixedFontText style={styles.title}>ログイン</MixedFontText>
      <TextInput
        style={styles.input}
        placeholder="ユーザー名"
        autoCapitalize="none"
        value={username}
        onChangeText={setUsername}
      />
      <TextInput
        style={styles.input}
        placeholder="パスワード"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      {error ? <MixedFontText style={styles.error}>{error}</MixedFontText> : null}
      <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
        <MixedFontText style={styles.buttonText}>{loading ? '認証中...' : 'ログイン'}</MixedFontText>
      </TouchableOpacity>

      {/* パスワードリセットリンク */}
      <TouchableOpacity
        style={styles.linkButton}
        onPress={() => router.push('/password-reset-request')}
      >
        <MixedFontText style={styles.linkText}>パスワードを忘れた方</MixedFontText>
      </TouchableOpacity>

      {/* ユーザー作成画面へのリンク */}
      <TouchableOpacity style={styles.linkButton} onPress={() => router.push('/signup')}>
        <MixedFontText style={styles.linkButtonText}>新規ユーザー登録はこちら</MixedFontText>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: remToPx(theme.spacing[20]), // xxl
    backgroundColor: theme.colors.background.primary,
  },
  title: {
    fontSize: remToPx(theme.typography.fontSize['2xl']),
    fontWeight: theme.typography.fontWeight.bold,
    marginBottom: remToPx(theme.spacing[20]), // xxl
    color: theme.colors.text.primary,
  },
  input: {
    width: '100%',
    maxWidth: 320,
    height: 48,
    borderColor: theme.colors.border,
    borderWidth: 1,
    borderRadius: remToPx(theme.borderRadius.md),
    marginBottom: remToPx(theme.spacing[8]), // lg
    paddingHorizontal: remToPx(theme.spacing[4]), // md
    fontSize: remToPx(theme.typography.fontSize.base),
    backgroundColor: theme.colors.background.secondary,
    color: theme.colors.text.primary, 
  },
  error: {
    color: theme.colors.semantic.error.main,
    marginBottom: remToPx(theme.spacing[4]), // md 
  },
  button: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: theme.colors.primary[300],
    paddingVertical: remToPx(theme.spacing[4]), // md
    borderRadius: remToPx(theme.borderRadius.md),
    alignItems: 'center',
  },
  buttonText: {
    color: theme.colors.text.inverse,
    fontSize: remToPx(theme.typography.fontSize.base),
    fontWeight: theme.typography.fontWeight.semibold,
  },
  linkButton: {
    marginTop: remToPx(theme.spacing[4]), // md
    paddingVertical: 8,
  },
  linkButtonText: {
    color: theme.colors.text.link,
    fontSize: remToPx(theme.typography.fontSize.base),
  },
  linkText: {
    color: theme.colors.text.link,
    fontSize: remToPx(theme.typography.fontSize.base),
    textAlign: 'center',
  },
});
