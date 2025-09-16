import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'expo-router';
import { theme } from '@/styles/theme';

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
    } catch (e: any) {
      setError(e.message || 'ログインに失敗しました');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>ログイン</Text>
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
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
        <Text style={styles.buttonText}>{loading ? '認証中...' : 'ログイン'}</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.linkButton} onPress={() => router.push('/signup')}>
        <Text style={styles.linkButtonText}>新規ユーザー登録はこちら</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xxl,
    backgroundColor: theme.colors.white,
  },
  title: {
    fontSize: theme.typography.fontSizes['2xl'],
    fontWeight: theme.typography.fontWeights.bold,
    marginBottom: theme.spacing.xxl,
    color: theme.colors.textDark,
  },
  input: {
    width: '100%',
    maxWidth: 320,
    height: 48,
    borderColor: theme.colors.border,
    borderWidth: 1,
    borderRadius: theme.layout.radius.md,
    marginBottom: theme.spacing.lg,
    paddingHorizontal: theme.spacing.md,
    fontSize: theme.typography.fontSizes.base,
    backgroundColor: theme.colors.backgroundLighter,
  },
  error: {
    color: theme.colors.danger,
    marginBottom: theme.spacing.md,
  },
  button: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.layout.radius.md,
    alignItems: 'center',
  },
  buttonText: {
    color: theme.colors.white,
    fontSize: theme.typography.fontSizes.base,
    fontWeight: theme.typography.fontWeights.bold,
  },
  linkButton: {
    marginTop: theme.spacing.xxl,
  },
  linkButtonText: {
    color: theme.colors.link,
    fontSize: theme.typography.fontSizes.base,
  },
});
