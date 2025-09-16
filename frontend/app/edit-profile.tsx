import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Image,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
  ScrollView,
} from 'react-native';
import { useAuth } from '@/hooks/useAuth';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { theme } from '@/styles/theme';

export default function EditProfileScreen() {
  // useAuthから必要な情報を取得
  const { user, accessToken, refreshUser } = useAuth();
  const router = useRouter();

  // 編集対象のstateを初期化
  const [bio, setBio] = useState(user?.bio || '');
  const [avatarUri, setAvatarUri] = useState<string | null>(user?.avatar || null);
  const [newAvatarAsset, setNewAvatarAsset] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      setBio(user.bio || '');
      setAvatarUri(user.avatar || null);
    }
  }, [user]);

  // 画像ピッカーで新しいアバターを選択する関数
  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        '許可が必要です',
        'プロフィール画像を変更するには、写真ライブラリへのアクセスを許可してください。'
      );
      return;
    }
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });
    if (!result.canceled) {
      const asset = result.assets[0];
      setAvatarUri(asset.uri); // プレビュー用のURIを更新
      setNewAvatarAsset(asset); // 送信用のファイル情報を保存
    }
  };

  // 変更を保存する関数
  const handleSave = async () => {
    if (!user || !accessToken) return;
    setIsSubmitting(true);

    try {
      // 投稿の時と同じように、FormDataを作成
      const formData = new FormData();
      formData.append('bio', bio);

      // 新しいアバターが選択されている場合のみ、ファイルを追加
      if (newAvatarAsset) {
        const uri =
          Platform.OS === 'ios' ? newAvatarAsset.uri.replace('file://', '') : newAvatarAsset.uri;
        const filename = newAvatarAsset.fileName || `avatar_${user.id}.jpg`;
        const mimeType = newAvatarAsset.mimeType || 'image/jpeg';
        formData.append('avatar_file', { uri, name: filename, type: mimeType } as any);
      }

      const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL;
      // プロフィール更新APIにPOSTリクエストを送信
      const response = await fetch(`${API_BASE_URL}/api/users/me/profile/`, {
        method: 'POST', // 投稿の時と同じPOSTメソッドを使用
        headers: {
          Authorization: `Bearer ${accessToken}`,
          // 'Content-Type'はfetchがFormDataを使う際に自動で設定するため、指定しない
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw errorData;
      }

      Alert.alert('成功', 'プロフィールを更新しました。');

      // ユーザー情報を再取得して、アプリ全体に変更を反映させる
      if (refreshUser) {
        await refreshUser();
      }

      // 前の画面に戻る
      router.back();
    } catch (error: any) {
      console.error('プロフィール更新エラー:', JSON.stringify(error, null, 2));
      Alert.alert('エラー', error.detail || 'プロフィールの更新に失敗しました。');
    } finally {
      setIsSubmitting(false);
    }
  };

  // user情報が読み込まれるまでローディング表示
  if (!user) {
    return <ActivityIndicator size="large" style={styles.centered} />;
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.innerContainer}>
        <Text style={styles.title}>プロフィール編集</Text>

        <TouchableOpacity onPress={pickImage} style={styles.avatarContainer}>
          <Image
            source={
              avatarUri
                ? { uri: avatarUri }
                : {
                    uri: `https://placehold.co/128x128/e0e0e0/555555?text=${user.username.charAt(0)}`,
                  }
            }
            style={styles.avatar}
          />
          <Text style={styles.avatarEditText}>画像を変更</Text>
        </TouchableOpacity>

        <Text style={styles.label}>自己紹介</Text>
        <TextInput
          style={styles.bioInput}
          value={bio}
          onChangeText={setBio}
          placeholder="自己紹介を入力..."
          multiline
        />

        <View style={styles.spacer} />

        <TouchableOpacity
          style={styles.saveButton}
          onPress={handleSave}
          disabled={isSubmitting}
        >
          <Text style={styles.saveButtonText}>{isSubmitting ? '保存中...' : '保存する'}</Text>
        </TouchableOpacity>
        {isSubmitting && <ActivityIndicator style={{ marginTop: 10 }} />}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.white,
  },
  innerContainer: {
    padding: theme.spacing.xl,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.white,
  },
  title: {
    fontSize: theme.typography.fontSizes['2xl'],
    fontWeight: theme.typography.fontWeights.bold,
    marginBottom: theme.spacing.xl,
    color: theme.colors.textDark,
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: theme.spacing['3xl'],
  },
  avatar: {
    width: 128,
    height: 128,
    borderRadius: 64, // Keep as is for perfect circle
    backgroundColor: theme.colors.backgroundLight,
  },
  avatarEditText: {
    marginTop: theme.spacing.sm,
    color: theme.colors.primary,
    fontWeight: theme.typography.fontWeights.semibold,
  },
  label: {
    fontSize: theme.typography.fontSizes.base,
    fontWeight: theme.typography.fontWeights.semibold,
    marginBottom: theme.spacing.sm,
    color: theme.colors.textMedium,
  },
  bioInput: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.layout.radius.md,
    padding: theme.spacing.md,
    height: 100,
    textAlignVertical: 'top',
    fontSize: theme.typography.fontSizes.base,
    color: theme.colors.textPrimary,
  },
  spacer: {
    flex: 1,
    minHeight: theme.spacing['4xl'],
  },
  saveButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.layout.radius.md,
    alignItems: 'center',
  },
  saveButtonText: {
    color: theme.colors.white,
    fontSize: theme.typography.fontSizes.base,
    fontWeight: theme.typography.fontWeights.bold,
  },
});
