import { UserCreateOut } from '@/types/user';
import { apiClient } from '@/utils/apiClient';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, View, TouchableOpacity } from 'react-native';
import { theme } from '@/styles/theme';

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
    try {
      const res = await apiClient<UserCreateOut>('/api/users/', {
        method: 'POST',
        body: { username, email, password },
      });
      // access, refresh保存
      await SecureStore.setItemAsync('accessToken', res.access);
      await SecureStore.setItemAsync('refreshToken', res.refresh);
      setSuccess('ユーザー作成に成功しました');
      setUsername('');
      setEmail('');
      setPassword('');
      router.replace('/'); // index.tsxに遷移
    } catch (e: any) {
      setError(e.message || 'ユーザー作成に失敗しました');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>ユーザー作成</Text>
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
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {success ? <Text style={styles.success}>{success}</Text> : null}
      <TouchableOpacity style={styles.button} onPress={handleCreate}>
        <Text style={styles.buttonText}>ユーザー作成</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing[8], // Corresponds to 32px
    backgroundColor: theme.colors.white,
  },
  title: {
    fontSize: theme.typography.fontSize['2xl'],
    fontWeight: theme.typography.fontWeights.bold,
    marginBottom: theme.spacing[8], // Corresponds to 32px
    color: theme.colors.textDark,
  },
  input: {
    width: '100%',
    maxWidth: 320,
    height: 48,
    borderColor: theme.colors.border,
    borderWidth: 1,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing[4], // Corresponds to 16px
    paddingHorizontal: theme.spacing[4], // Corresponds to 16px
    fontSize: theme.typography.fontSize.base,
    backgroundColor: theme.colors.backgroundLighter,
  },
  error: {
    color: theme.colors.danger,
    marginBottom: theme.spacing.md,
  },
  success: {
    color: theme.colors.success,
    marginBottom: theme.spacing.md,
  },
  button: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing[4], // Corresponds to 16px
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    marginTop: theme.spacing[2], // Corresponds to 8px
  },
  buttonText: {
    color: theme.colors.white,
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeights.bold,
  },
});
