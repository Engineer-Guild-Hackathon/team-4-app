import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { apiClient } from '@/utils/apiClient';
import { theme } from '@/styles/theme';

const remToPx = (rem: string) => parseFloat(rem) * 16;

export default function PasswordResetConfirm() {
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { email } = useLocalSearchParams<{ email: string }>();

  const handleCodeSubmit = async () => {
    if (!code.trim() || code.length !== 6) {
      Alert.alert('エラー', '6桁のコードを入力してください');
      return;
    }

    if (!newPassword.trim()) {
      Alert.alert('エラー', '新しいパスワードを入力してください');
      return;
    }

    if (!confirmPassword.trim()) {
      Alert.alert('エラー', 'パスワード確認を入力してください');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('エラー', 'パスワードが一致しません');
      return;
    }

    if (newPassword.length < 8) {
      Alert.alert('エラー', 'パスワードは8文字以上で入力してください');
      return;
    }

    setLoading(true);
    try {
      await apiClient('/api/users/password-reset/confirm/', {
        method: 'POST',
        body: {
          email: email?.trim(),
          code: code.trim(),
          new_password: newPassword,
        },
      });

      Alert.alert(
        'パスワードリセット完了',
        'パスワードが正常にリセットされました。新しいパスワードでログインしてください。',
        [
          {
            text: 'OK',
            onPress: () => router.push('/login'),
          },
        ]
      );
    } catch (error) {
      console.error('パスワードリセット確認エラー:', error);
      Alert.alert(
        'エラー',
        'パスワードリセットに失敗しました'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        <Text style={styles.title}>コード入力</Text>
        <Text style={styles.description}>
          メールに送信された6桁のコードと新しいパスワードを入力してください。
        </Text>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>6桁のコード</Text>
          <TextInput
            style={styles.input}
            value={code}
            onChangeText={setCode}
            placeholder="123456"
            keyboardType="numeric"
            maxLength={6}
            autoCapitalize="none"
            autoCorrect={false}
            editable={!loading}
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>新しいパスワード</Text>
          <TextInput
            style={styles.input}
            value={newPassword}
            onChangeText={setNewPassword}
            placeholder="8文字以上で入力"
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            editable={!loading}
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>パスワード確認</Text>
          <TextInput
            style={styles.input}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder="パスワードを再入力"
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            editable={!loading}
          />
        </View>

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleCodeSubmit}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? '処理中...' : 'パスワード更新'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          disabled={loading}
        >
          <Text style={styles.backButtonText}>メール入力に戻る</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.push('/login')}
          disabled={loading}
        >
          <Text style={styles.backButtonText}>ログイン画面に戻る</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },
  content: {
    flex: 1,
    padding: remToPx(theme.spacing[5]),
    justifyContent: 'center',
  },
  title: {
    fontSize: remToPx(theme.typography.fontSize['2xl']),
    fontWeight: theme.typography.fontWeight.bold,
    textAlign: 'center',
    marginBottom: remToPx(theme.spacing[5]),
    color: theme.colors.text.primary,
    fontFamily: 'Klee One',
  },
  description: {
    fontSize: remToPx(theme.typography.fontSize.base),
    textAlign: 'center',
    marginBottom: remToPx(theme.spacing[8]),
    color: theme.colors.text.secondary,
    lineHeight: 22,
    fontFamily: 'Klee One',
  },
  inputContainer: {
    marginBottom: remToPx(theme.spacing[5]),
  },
  label: {
    fontSize: remToPx(theme.typography.fontSize.base),
    fontWeight: theme.typography.fontWeight.semibold,
    marginBottom: remToPx(theme.spacing[2]),
    color: theme.colors.text.primary,
    fontFamily: 'Klee One',
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: remToPx(theme.borderRadius.md),
    padding: remToPx(theme.spacing[3]),
    fontSize: remToPx(theme.typography.fontSize.base),
    backgroundColor: theme.colors.background.secondary,
    color: theme.colors.text.primary,
    fontFamily: 'Klee One',
  },
  button: {
    backgroundColor: theme.colors.primary[300],
    padding: remToPx(theme.spacing[4]),
    borderRadius: remToPx(theme.borderRadius.md),
    alignItems: 'center',
    marginBottom: remToPx(theme.spacing[5]),
  },
  buttonDisabled: {
    backgroundColor: theme.colors.neutral[400],
  },
  buttonText: {
    color: theme.colors.text.inverse,
    fontSize: remToPx(theme.typography.fontSize.base),
    fontWeight: theme.typography.fontWeight.semibold,
    fontFamily: 'Klee One',
  },
  backButton: {
    alignItems: 'center',
    padding: remToPx(theme.spacing[3]),
  },
  backButtonText: {
    color: theme.colors.text.link,
    fontSize: remToPx(theme.typography.fontSize.base),
    fontFamily: 'Klee One',
  },
});
