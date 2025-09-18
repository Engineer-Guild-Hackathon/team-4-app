import { useAuth } from '@/hooks/useAuth';
import { theme } from '@/styles/theme';
import { MixedFontText } from '@/components/Shared/MixedFontText';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useVideoPlayer, VideoView } from 'expo-video';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import { formSubmitHaptic, successHaptic, errorHaptic, selectionHaptic } from '@/utils/haptics';

const remToPx = (rem: string) => parseFloat(rem) * 16;

const VideoPreviewItem = ({ uri, style }: { uri: string; style: StyleProp<ViewStyle> }) => {
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
  const [isPickingMedia, setIsPickingMedia] = useState(false);

  const topicId = params.topicId as string;

  const pickMedia = async () => {
    selectionHaptic();
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      errorHaptic();
      Alert.alert('許可が必要です', '投稿するには、写真ライブラリへのアクセスを許可してください。');
      return;
    }

    setIsPickingMedia(true);
    try {
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsMultipleSelection: true,
        quality: 0.1,
      });

      if (!result.canceled) {
        setMediaAssets(result.assets);
        successHaptic();
      }
    } catch {
      errorHaptic();
      Alert.alert(
        'メディアの読み込みに失敗しました',
        '選択されたメディアの処理中にエラーが発生しました。別のファイルを選択するか、デバイスにダウンロードしてから再度お試しください。'
      );
    } finally {
      setIsPickingMedia(false);
    }
  };

  const handlePost = async () => {
    if (!content.trim() && mediaAssets.length === 0) {
      errorHaptic();
      Alert.alert('エラー', '投稿内容を入力するか、メディアを選択してください');
      return;
    }
    if (content.length > 500) {
      Alert.alert('エラー', '投稿内容は500文字以内で入力してください');
      return;
    }
    if (!topicId) {
      errorHaptic();
      Alert.alert('エラー', '投稿先のトピックが見つかりません');
      return;
    }

    formSubmitHaptic();
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
      } as unknown as Blob);
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

      successHaptic();
      Alert.alert('成功', '投稿が完了しました！');
      router.replace({ pathname: '/', params: { openModal: 'true' } });
    } catch (error: unknown) {
      errorHaptic();
      console.error('投稿エラー詳細:', JSON.stringify(error, null, 2));
      const errorMessage = (error as { detail?: string })?.detail || '投稿に失敗しました';
      Alert.alert('エラー', errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <MixedFontText style={styles.title}>新規投稿</MixedFontText>

      <TextInput
        style={styles.input}
        placeholder="学んだことを共有しよう..."
        value={content}
        onChangeText={setContent}
        multiline
        maxLength={500}
      />

      <TouchableOpacity style={styles.button} onPress={pickMedia} disabled={isPickingMedia}>
        <MixedFontText style={styles.buttonText}>
          {isPickingMedia ? 'メディアを読み込み中...' : '画像・動画を選択'}
        </MixedFontText>
      </TouchableOpacity>

      <ScrollView horizontal style={styles.previewContainer}>
        {mediaAssets.map(asset => {
          const cacheKey = asset.uri.split('?')[0];
          if (asset.type === 'image') {
            return (
              <Image
                key={asset.assetId}
                transition={300}
                source={{ uri: asset.uri, cacheKey }}
                style={styles.previewImage}
              />
            );
          } else if (asset.type === 'video') {
            return (
              <VideoPreviewItem key={asset.assetId} uri={asset.uri} style={styles.previewImage} />
            );
          }
          return null;
        })}
      </ScrollView>

      <View style={{ flex: 1 }} />

      <TouchableOpacity
        style={[styles.button, styles.submitButton]}
        onPress={handlePost}
        disabled={isSubmitting}
      >
        <MixedFontText style={[styles.buttonText, styles.submitButtonText]}>
          {isSubmitting ? '投稿中...' : '投稿する'}
        </MixedFontText>
      </TouchableOpacity>
      {isSubmitting && <ActivityIndicator style={{ marginTop: 10 }} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: remToPx(theme.spacing[5]), // 1.25rem → 20px
    backgroundColor: theme.colors.background.primary,
  },
  title: {
    fontSize: remToPx(theme.typography.fontSize['2xl']),
    fontWeight: theme.typography.fontWeight.bold,
    marginBottom: remToPx(theme.spacing[5]),
    color: theme.colors.text.primary,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: remToPx(theme.spacing[3]),
    borderRadius: remToPx(theme.borderRadius.md),
    height: 150,
    textAlignVertical: 'top',
    marginBottom: remToPx(theme.spacing[5]),
    fontSize: remToPx(theme.typography.fontSize.base),
    color: theme.colors.text.primary,
    backgroundColor: theme.colors.background.secondary,
  },
  previewContainer: {
    marginTop: remToPx(theme.spacing[4]),
    maxHeight: 100,
  },
  previewImage: {
    width: 100,
    height: 100,
    borderRadius: remToPx(theme.borderRadius.md),
    marginRight: remToPx(theme.spacing[3]),
    backgroundColor: theme.colors.neutral[300],
  },
  button: {
    backgroundColor: theme.colors.primary[300],
    paddingVertical: remToPx(theme.spacing[3]),
    paddingHorizontal: remToPx(theme.spacing[4]),
    borderRadius: remToPx(theme.borderRadius.md),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: remToPx(theme.spacing[4]),
  },
  buttonText: {
    color: theme.colors.text.inverse,
    fontSize: remToPx(theme.typography.fontSize.base),
    fontWeight: theme.typography.fontWeight.semibold,
  },
  submitButton: {
    marginTop: remToPx(theme.spacing[4]),
  },
  submitButtonText: {
    fontWeight: theme.typography.fontWeight.semibold,
  },
});
