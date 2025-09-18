import { useAuth } from '@/hooks/useAuth';
import { theme } from '@/styles/theme';
import { MixedFontText } from '@/components/Shared/MixedFontText';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

export default function EditProfileScreen() {
  // useAuthから必要な情報を取得
  const { user, accessToken, logout } = useAuth();
  const router = useRouter();

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

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        '許可が必要です',
        'プロフィール画像を変更するには、写真ライブラリへのアクセスを許可してください。'
      );
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });
    if (!result.canceled) {
      const asset = result.assets[0];
      setAvatarUri(asset.uri);
      setNewAvatarAsset(asset);
    }
  };

  const handleSave = async () => {
    if (!user || !accessToken) return;
    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('bio', bio);

      if (newAvatarAsset) {
        const uri =
          Platform.OS === 'ios' ? newAvatarAsset.uri.replace('file://', '') : newAvatarAsset.uri;
        const filename = newAvatarAsset.fileName || `avatar_${user.id}.jpg`;
        const mimeType = newAvatarAsset.mimeType || 'image/jpeg';
        formData.append('avatar_file', { uri, name: filename, type: mimeType } as unknown as Blob);
      }

      const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL;
      const response = await fetch(`${API_BASE_URL}/api/users/me/profile/`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw errorData;
      }

      Alert.alert('成功', 'プロフィールを更新しました。');

      // 前の画面に戻る
      router.push('/?profileUpdated=true');
    } catch (error: any) {
      console.error('プロフィール更新エラー:', JSON.stringify(error, null, 2));
      Alert.alert(
        'エラー',
        (error as { detail?: string })?.detail || 'プロフィールの更新に失敗しました。'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'アカウント削除',
      'アカウントを削除すると、すべてのデータが永久に削除され、復元できません。本当に削除しますか？',
      [
        {
          text: 'キャンセル',
          style: 'cancel',
        },
        {
          text: '削除する',
          style: 'destructive',
          onPress: confirmDeleteAccount,
        },
      ]
    );
  };

  const confirmDeleteAccount = async () => {
    if (!user || !accessToken) return;
    setIsSubmitting(true);

    try {
      const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL;
      const response = await fetch(`${API_BASE_URL}/api/users/me/`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw errorData;
      }

      // アカウント削除成功後、即座にログアウト処理を実行
      await logout();

      Alert.alert('削除完了', 'アカウントが正常に削除されました。');
    } catch (error: any) {
      console.error('アカウント削除エラー:', JSON.stringify(error, null, 2));
      Alert.alert(
        'エラー',
        (error as { message?: string })?.message || 'アカウントの削除に失敗しました。'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return <ActivityIndicator size="large" style={styles.centered} />;
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.innerContainer}>
        <MixedFontText style={styles.title}>プロフィール編集</MixedFontText>

        <TouchableOpacity onPress={pickImage} style={styles.avatarContainer}>
          <Image
            source={{
              uri: avatarUri
                ? avatarUri
                : `https://placehold.co/128x128/e0e0e0/555555?text=${user.username.charAt(0)}`,
              cacheKey: avatarUri ? avatarUri.split('?')[0] : undefined,
            }}
            style={styles.avatar}
          />
          <MixedFontText style={styles.avatarEditText}>画像を変更</MixedFontText>
        </TouchableOpacity>

        <MixedFontText style={styles.label}>自己紹介</MixedFontText>
        <TextInput
          style={styles.bioInput}
          value={bio}
          onChangeText={setBio}
          placeholder="自己紹介を入力..."
          multiline
        />

        <View style={styles.spacer} />

        <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={isSubmitting}>
          <MixedFontText style={styles.saveButtonText}>{isSubmitting ? '保存中...' : '保存する'}</MixedFontText>
        </TouchableOpacity>
        {isSubmitting && <ActivityIndicator style={{ marginTop: 10 }} />}

        <View style={styles.dangerZone}>
         
          <TouchableOpacity 
            style={styles.deleteButton} 
            onPress={handleDeleteAccount} 
            disabled={isSubmitting}
          >
            <Text style={styles.deleteButtonText}>アカウントを削除</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },
  innerContainer: {
    padding: theme.remToPx(theme.spacing[8]), // xl
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background.primary,
  },
  title: {
    fontSize: theme.remToPx(theme.typography.fontSize['2xl']),
    fontWeight: theme.typography.fontWeight.semibold,
    marginBottom: theme.remToPx(theme.spacing[8]), // xl
    color: theme.colors.text.primary,
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: theme.remToPx(theme.spacing[12]), // 3xl
  },
  avatar: {
    width: 128,
    height: 128,
    borderRadius: 64,
    backgroundColor: theme.colors.background.secondary,
  },
  avatarEditText: {
    marginTop: theme.remToPx(theme.spacing[2]), // sm
    color: theme.colors.primary[300],
    fontWeight: theme.typography.fontWeight.semibold,
  },
  label: {
    fontSize: theme.remToPx(theme.typography.fontSize.base),
    fontWeight: theme.typography.fontWeight.semibold,
    marginBottom: theme.remToPx(theme.spacing[2]), // sm
    color: theme.colors.text.secondary,
  },
  bioInput: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.remToPx(theme.borderRadius.md),
    padding: theme.remToPx(theme.spacing[4]), // md
    height: 100,
    textAlignVertical: 'top',
    fontSize: theme.remToPx(theme.typography.fontSize.base),
    color: theme.colors.text.primary,
    
  },
  spacer: {
    flex: 1,
    minHeight: theme.remToPx(theme.spacing[16]), // 4xl
  },
  saveButton: {
    backgroundColor: theme.colors.primary[300],
    paddingVertical: theme.remToPx(theme.spacing[4]), // md
    borderRadius: theme.remToPx(theme.borderRadius.md),
    alignItems: 'center',
  },
  saveButtonText: {
    color: theme.colors.text.inverse,
    fontSize: theme.remToPx(theme.typography.fontSize.base),
    fontWeight: theme.typography.fontWeight.semibold,
  },
  dangerZone: {
    marginTop: theme.remToPx(theme.spacing[8]), // xl
    padding: theme.remToPx(theme.spacing[6]), // lg
    borderWidth: 1,
    borderColor: '#ef4444',
    borderRadius: theme.remToPx(theme.borderRadius.md),
    backgroundColor: '#fef2f2',
  },
  dangerZoneTitle: {
    fontSize: theme.remToPx(theme.typography.fontSize.lg),
    fontWeight: theme.typography.fontWeight.semibold,
    color: '#dc2626',
    marginBottom: theme.remToPx(theme.spacing[4]), // md
    fontFamily: 'Klee One',
  },
  deleteButton: {
    backgroundColor: '#dc2626',
    paddingVertical: theme.remToPx(theme.spacing[3]), // sm
    paddingHorizontal: theme.remToPx(theme.spacing[4]), // md
    borderRadius: theme.remToPx(theme.borderRadius.md),
    alignItems: 'center',
  },
  deleteButtonText: {
    color: theme.colors.text.inverse,
    fontSize: theme.remToPx(theme.typography.fontSize.sm),
    fontWeight: theme.typography.fontWeight.semibold,
    fontFamily: 'Klee One',
  },
});
