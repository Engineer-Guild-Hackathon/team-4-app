import { useAuth } from '@/hooks/useAuth';
import { theme } from '@/styles/theme';
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

const remToPx = (rem: string) => parseFloat(rem) * 16;

export default function EditProfileScreen() {
  // useAuthから必要な情報を取得
  const { user, accessToken } = useAuth();
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

  if (!user) {
    return <ActivityIndicator size="large" style={styles.centered} />;
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.innerContainer}>
        <Text style={styles.title}>プロフィール編集</Text>

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

        <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={isSubmitting}>
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
    backgroundColor: theme.colors.background.primary,
  },
  innerContainer: {
    padding: remToPx(theme.spacing[8]), // xl
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background.primary,
  },
  title: {
    fontSize: remToPx(theme.typography.fontSize['2xl']),
    fontWeight: theme.typography.fontWeight.semibold,
    marginBottom: remToPx(theme.spacing[8]), // xl
    color: theme.colors.text.primary,
    fontFamily: 'Klee One',
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: remToPx(theme.spacing[12]), // 3xl
  },
  avatar: {
    width: 128,
    height: 128,
    borderRadius: 64,
    backgroundColor: theme.colors.background.secondary,
  },
  avatarEditText: {
    marginTop: remToPx(theme.spacing[2]), // sm
    color: theme.colors.primary[300],
    fontWeight: theme.typography.fontWeight.semibold,
    fontFamily: 'Klee One',
  },
  label: {
    fontSize: remToPx(theme.typography.fontSize.base),
    fontWeight: theme.typography.fontWeight.semibold,
    marginBottom: remToPx(theme.spacing[2]), // sm
    color: theme.colors.text.secondary,
    fontFamily: 'Klee One',
  },
  bioInput: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: remToPx(theme.borderRadius.md),
    padding: remToPx(theme.spacing[4]), // md
    height: 100,
    textAlignVertical: 'top',
    fontSize: remToPx(theme.typography.fontSize.base),
    color: theme.colors.text.primary,
    fontFamily: 'Klee One',
  },
  spacer: {
    flex: 1,
    minHeight: remToPx(theme.spacing[16]), // 4xl
  },
  saveButton: {
    backgroundColor: theme.colors.primary[300],
    paddingVertical: remToPx(theme.spacing[4]), // md
    borderRadius: remToPx(theme.borderRadius.md),
    alignItems: 'center',
  },
  saveButtonText: {
    color: theme.colors.text.inverse,
    fontSize: remToPx(theme.typography.fontSize.base),
    fontWeight: theme.typography.fontWeight.semibold,
    fontFamily: 'Klee One',
  },
});
