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
import { useRouter } from 'expo-router';
import { apiClient } from '@/utils/apiClient';
import { theme } from '@/styles/theme';
import { MixedFontText } from '@/components/Shared/MixedFontText';

const remToPx = (rem: string) => parseFloat(rem) * 16;

export default function PasswordResetRequest() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleEmailSubmit = async () => {
    if (!email.trim()) {
      Alert.alert('エラー', 'メールアドレスを入力してください');
      return;
    }

    if (!email.includes('@')) {
      Alert.alert('エラー', '有効なメールアドレスを入力してください');
      return;
    }

    setLoading(true);
    try {
      await apiClient('/api/users/password-reset/', {
        method: 'POST',
        body: { email: email.trim() },
      });

      Alert.alert(
        'コード送信完了',
        'パスワードリセットコードを送信しました。メールをご確認ください。',
        [
          {
            text: 'OK',
            onPress: () => {
              setLoading(false);
              router.push({
                pathname: '/password-reset-confirm',
                params: { email: email.trim() },
              });
            },
          },
        ]
      );
    } catch (error) {
      console.error('パスワードリセットリクエストエラー:', error);
      Alert.alert('エラー', 'メール送信に失敗しました');
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        <MixedFontText style={styles.title}>パスワードリセット</MixedFontText>
        <MixedFontText style={styles.description}>
          登録されているメールアドレスを入力してください。
          パスワードリセット用の6桁コードをメールでお送りします。
        </MixedFontText>

        <View style={styles.inputContainer}>
          <MixedFontText style={styles.label}>メールアドレス</MixedFontText>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="example@email.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            editable={!loading}
          />
        </View>

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleEmailSubmit}
          disabled={loading}
        >
          <MixedFontText style={styles.buttonText}>
            {loading ? '送信中...' : 'コード送信'}
          </MixedFontText>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.push('/login')}
          disabled={loading}
        >
          <MixedFontText style={styles.backButtonText}>ログイン画面に戻る</MixedFontText>
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
  },
  description: {
    fontSize: remToPx(theme.typography.fontSize.base),
    textAlign: 'center',
    marginBottom: remToPx(theme.spacing[8]),
    color: theme.colors.text.secondary,
    lineHeight: 22,
  },
  inputContainer: {
    marginBottom: remToPx(theme.spacing[5]),
  },
  label: {
    fontSize: remToPx(theme.typography.fontSize.base),
    fontWeight: theme.typography.fontWeight.semibold,
    marginBottom: remToPx(theme.spacing[2]),
    color: theme.colors.text.primary,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: remToPx(theme.borderRadius.md),
    padding: remToPx(theme.spacing[3]),
    fontSize: remToPx(theme.typography.fontSize.base),
    backgroundColor: theme.colors.background.secondary,
    color: theme.colors.text.primary,
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
  },
  backButton: {
    alignItems: 'center',
    padding: remToPx(theme.spacing[3]),
  },
  backButtonText: {
    color: theme.colors.text.link,
    fontSize: remToPx(theme.typography.fontSize.base),
  },
});
