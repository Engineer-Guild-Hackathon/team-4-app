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
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '@/hooks/useAuth';
import { useVideoPlayer, VideoView } from 'expo-video';

const VideoPreviewItem = ({ uri, style }: { uri: string; style: any }) => {
  const player = useVideoPlayer(uri, player => {
    player.muted = true;
    player.play();
  });
  return <VideoView player={player} style={style} />;
};

// 親から渡されるpropsの型
interface CreatePostFormProps {
  topicId: string;
}

export default function CreatePostForm({ topicId }: CreatePostFormProps) {
  const { accessToken } = useAuth();
  const [content, setContent] = useState('');
  const [mediaAssets, setMediaAssets] = useState<ImagePicker.ImagePickerAsset[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPickingMedia, setIsPickingMedia] = useState(false);

  const pickMedia = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('許可が必要です', '投稿するには、写真ライブラリへのアクセスを許可してください。');
      return;
    }
    setIsPickingMedia(true);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsMultipleSelection: true,
        quality: 1,
      });
      if (!result.canceled) {
        setMediaAssets(result.assets);
      }
    } catch (error) {
      Alert.alert('メディアの読み込みに失敗しました', '別のファイルを選択してください。');
    } finally {
      setIsPickingMedia(false);
    }
  };

  const handlePost = async () => {
    if (!content.trim() && mediaAssets.length === 0) {
      Alert.alert('エラー', '投稿内容を入力するか、メディアを選択してください');
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
        headers: { Authorization: `Bearer ${accessToken}` },
        body: formData,
      });
      if (!response.ok) {
        throw await response.json();
      }
      Alert.alert('成功', '投稿が完了しました！');
      setContent('');
      setMediaAssets([]);
    } catch (error: any) {
      Alert.alert('エラー', error?.detail || '投稿に失敗しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.formContainer}>
      <TextInput
        style={styles.input}
        placeholder="3分間でアウトプットしよう..."
        value={content}
        onChangeText={setContent}
        multiline
      />
      <View style={styles.buttonContainer}>
        <Button
          title={isPickingMedia ? '...' : 'メディア選択'}
          onPress={pickMedia}
          disabled={isPickingMedia}
        />
      </View>
      <ScrollView horizontal style={styles.previewContainer}>
        {mediaAssets.map(asset =>
          asset.type === 'image' ? (
            <Image key={asset.assetId} source={{ uri: asset.uri }} style={styles.previewImage} />
          ) : (
            <VideoPreviewItem key={asset.assetId} uri={asset.uri} style={styles.previewImage} />
          )
        )}
      </ScrollView>
      <Button
        title={isSubmitting ? '投稿中...' : '投稿する'}
        onPress={handlePost}
        disabled={isSubmitting}
      />
      {isSubmitting && <ActivityIndicator />}
    </View>
  );
}

const styles = StyleSheet.create({
  formContainer: {
    flex: 1,
    padding: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    borderRadius: 8,
    height: 120,
    textAlignVertical: 'top',
    marginBottom: 10,
    fontSize: 16,
  },
  buttonContainer: {
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  previewContainer: {
    maxHeight: 80,
    marginBottom: 10,
  },
  previewImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 10,
    backgroundColor: '#e0e0e0',
  },
});
