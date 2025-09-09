import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet } from 'react-native';
import { apiClient } from '@/utils/apiClient';
import { useAuth } from '@/hooks/useAuth';

export default function UserCreateScreen() {
  const { authedApi } = useAuth();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleCreate = async () => {
    setError('');
    setSuccess('');
    try {
      await authedApi('/users', {
        method: 'POST',
        body: { username, email, password },
      });
      setSuccess('ユーザー作成に成功しました');
      setUsername('');
      setEmail('');
      setPassword('');
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
      <Button title="ユーザー作成" onPress={handleCreate} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
  },
  input: {
    width: '100%',
    maxWidth: 320,
    height: 48,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 16,
    paddingHorizontal: 12,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  error: {
    color: 'red',
    marginBottom: 12,
  },
  success: {
    color: 'green',
    marginBottom: 12,
  },
});
