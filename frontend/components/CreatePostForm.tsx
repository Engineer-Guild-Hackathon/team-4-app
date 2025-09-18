import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TextInput,
  Image,
  ScrollView,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '@/hooks/useAuth';
import { useVideoPlayer, VideoView } from 'expo-video';
import { Button } from './Shared/Button';
import { theme } from '@/styles/theme';
import { remToPx } from '@/styles/typography';

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
      <Button
        variant="secondary"
        size="sm"
        onPress={pickMedia}
        loading={isPickingMedia}
        style={styles.mediaButton}
      >
        {isPickingMedia ? '...' : 'メディア選択'}
      </Button>
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
        variant="primary"
        onPress={handlePost}
        loading={isSubmitting}
        style={styles.postButton}
      >
        アウトプットを投稿する
      </Button>
      {isSubmitting && <ActivityIndicator />}
    </View>
  );
}

const styles = StyleSheet.create({
  formContainer: {
    flex: 1,
    paddingVertical: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: remToPx(theme.spacing[3]),
    borderRadius: remToPx(theme.borderRadius.md),
    height: 120,
    textAlignVertical: 'top',
    marginBottom: remToPx(theme.spacing[4]),
    fontSize: remToPx(theme.typography.fontSize.base),
    fontFamily: theme.typography.fontFamily.primary,
    color: theme.colors.text.primary,
    backgroundColor: theme.colors.background.secondary,
  },
  mediaButton: {
    alignItems: 'flex-start',
    alignSelf: 'flex-start',
    marginBottom: remToPx(theme.spacing[4]),
  },
  previewContainer: {
    maxHeight: 100,
    marginBottom: remToPx(theme.spacing[4]),
  },
  previewImage: {
    width: 100,
    height: 100,
    borderRadius: remToPx(theme.borderRadius.md),
    marginRight: remToPx(theme.spacing[3]),
    backgroundColor: theme.colors.neutral[300],
  },
  postButton: {
    marginTop: 'auto',
    marginBottom: remToPx(theme.spacing[2]),
  },
});
