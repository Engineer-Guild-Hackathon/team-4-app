import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Button,
  Image,
  ScrollView,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '@/hooks/useAuth';
import { useVideoPlayer, VideoView } from 'expo-video';

const VideoPreviewItem = ({ uri, style }: { uri: string, style: any }) => {
  const player = useVideoPlayer(uri, player => {
    player.muted = true;
  });

  return (
    <VideoView 
      player={player} 
      style={style} 
      // allowsFullscreen={false} 
      // allowsPictureInPicture={false}
    />
  );
};

export default function CreatePostScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { accessToken } = useAuth();

  const [content, setContent] = useState('');
  const [mediaAssets, setMediaAssets] = useState<ImagePicker.ImagePickerAsset[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const topicId = params.topicId as string;

  const pickMedia = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('許可が必要です', '投稿するには、写真ライブラリへのアクセスを許可してください。');
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsMultipleSelection: true,
      quality: 1,
    });

    if (!result.canceled) {
      setMediaAssets([...mediaAssets, ...result.assets]);
    }
  };

  const handlePost = async () => {
    if (!content.trim() && mediaAssets.length === 0) {
      Alert.alert('エラー', '投稿内容を入力するか、メディアを選択してください。');
      return;
    }
    if (!topicId) {
      Alert.alert('エラー', '投稿先のトピックが見つかりません。');
      return;
    }

    setIsSubmitting(true);

    const formData = new FormData();
    formData.append('topic_id', topicId);
    formData.append('content', content);

    const metadata = [];
    for (const asset of mediaAssets) {
      const media_type = asset.type === 'image' ? 'image' : 'video';
      metadata.push({ media_type });

      formData.append('files', {
        uri: Platform.OS === 'ios' ? asset.uri.replace('file://', '') : asset.uri,
        name: asset.fileName || 'media.jpg',
        type: asset.mimeType || 'image/jpeg',
      } as any);
    }
    formData.append('metadata', JSON.stringify(metadata));

    try {
      const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL;
      const response = await fetch(`${API_BASE_URL}/api/posts/`, {
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

      Alert.alert('成功', '投稿が完了しました！');
      router.replace({ pathname: '/', params: { openModal: 'true' } });
    } catch (error: any) {
      console.error('投稿エラー詳細:', JSON.stringify(error, null, 2));
      const errorMessage =
        error?.detail ||
        '投稿に失敗しました。ネットワーク接続を確認するか、時間をおいて再試行してください。';
      Alert.alert('投稿エラー', errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>新規投稿</Text>

      <TextInput
        style={styles.input}
        placeholder="学んだことを共有しよう..."
        value={content}
        onChangeText={setContent}
        multiline
      />

      <Button title="画像・動画を選択" onPress={pickMedia} />

      <ScrollView horizontal style={styles.previewContainer}>
        {mediaAssets.map(asset => {
          if (asset.type === 'image') {
            return (
              <Image key={asset.assetId} source={{ uri: asset.uri }} style={styles.previewImage} />
            );
          } else if (asset.type === 'video') {
            return (
              <VideoPreviewItem 
                key={asset.assetId}
                uri={asset.uri}
                style={styles.previewImage}
              />
            );
          }
          return null;
        })}
      </ScrollView>

      <View style={{ flex: 1 }} />

      <Button
        title={isSubmitting ? '投稿中...' : '投稿する'}
        onPress={handlePost}
        disabled={isSubmitting}
      />
      {isSubmitting && <ActivityIndicator style={{ marginTop: 10 }} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    borderRadius: 8,
    height: 150,
    textAlignVertical: 'top',
    marginBottom: 20,
    fontSize: 16,
  },
  previewContainer: {
    marginTop: 15,
    maxHeight: 100,
  },
  previewImage: {
    width: 100,
    height: 100,
    borderRadius: 8,
    marginRight: 10,
    backgroundColor: '#e0e0e0',
  },
});
