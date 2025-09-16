import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Button,
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
      Alert.alert('許可が必要です', 'プロフィール画像を変更するには、写真ライブラリへのアクセスを許可してください。');
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
        const uri = Platform.OS === 'ios' ? newAvatarAsset.uri.replace('file://', '') : newAvatarAsset.uri;
        const filename = newAvatarAsset.fileName || `avatar_${user.id}.jpg`;
        const mimeType = newAvatarAsset.mimeType || 'image/jpeg';
        formData.append('avatar_file', { uri, name: filename, type: mimeType } as any);
      }
      
      const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL;
      // プロフィール更新APIにPOSTリクエストを送信
      const response = await fetch(`${API_BASE_URL}/api/users/me/profile/`, {
        method: 'POST', // 投稿の時と同じPOSTメソッドを使用
        headers: {
          'Authorization': `Bearer ${accessToken}`,
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
                : { uri: `https://placehold.co/128x128/e0e0e0/555555?text=${user.username.charAt(0)}` }
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
        
        <Button 
          title={isSubmitting ? "保存中..." : "保存する"}
          onPress={handleSave} 
          disabled={isSubmitting}
        />
        {isSubmitting && <ActivityIndicator style={{ marginTop: 10 }} />}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    innerContainer: {
        padding: 20,
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
    },
    avatarContainer: {
        alignItems: 'center',
        marginBottom: 30,
    },
    avatar: {
        width: 128,
        height: 128,
        borderRadius: 64,
        backgroundColor: '#f0f0f0',
    },
    avatarEditText: {
        marginTop: 8,
        color: '#007AFF',
        fontWeight: '600',
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 8,
    },
    bioInput: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 8,
        padding: 12,
        height: 100,
        textAlignVertical: 'top',
        fontSize: 16,
    },
    spacer: {
        flex: 1,
        minHeight: 40,
    },
});

