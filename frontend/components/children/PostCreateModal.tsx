import { useAuth } from '@/hooks/useAuth';
import { theme } from '@/styles/theme';
import { errorHaptic, formSubmitHaptic, selectionHaptic, successHaptic } from '@/utils/haptics';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useVideoPlayer, VideoView } from 'expo-video';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  Modal,
  Platform,
  ScrollView,
  StyleProp,
  StyleSheet,
  TextInput,
  TouchableWithoutFeedback,
  View,
  ViewStyle,
} from 'react-native';
import { Button } from '../Shared/Button';
import { MixedFontText } from '../Shared/MixedFontText';

const remToPx = (rem: string) => parseFloat(rem) * 16;

const VideoPreviewItem = ({ uri, style }: { uri: string; style: StyleProp<ViewStyle> }) => {
  const player = useVideoPlayer(uri, player => {
    player.muted = true;
  });
  return <VideoView player={player} style={style} />;
};

// 親から渡されるpropsの型
interface CreatePostModalProps {
  visible: boolean;
  onClose: () => void;
  topicId: string;
  onPostCreated: () => void; // 投稿成功を親に通知
}

export default function CreatePostModal({
  visible,
  onClose,
  topicId,
  onPostCreated,
}: CreatePostModalProps) {
  const { accessToken } = useAuth();
  const [content, setContent] = useState('');
  const [mediaAssets, setMediaAssets] = useState<ImagePicker.ImagePickerAsset[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPickingMedia, setIsPickingMedia] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);

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
      Alert.alert('メディアの読み込みに失敗しました', '別のファイルを選択してください。');
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
    // ... (その他のバリデーション) ...

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
        headers: { Authorization: `Bearer ${accessToken}` },
        body: formData,
      });
      if (!response.ok) {
        throw await response.json();
      }
      successHaptic();
      Alert.alert('成功', '気づきの投稿が完了しました！');
      setContent('');
      setMediaAssets([]);
      onPostCreated(); // 親に成功を通知
      onClose();       // モーダルを閉じる
    } catch (error: unknown) {
      errorHaptic();
      const errorMessage = (error as { message?: string })?.message || '投稿に失敗しました';
      Alert.alert('エラー', errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOverlayPress = () => {
    Keyboard.dismiss();
    if (!inputFocused) {
      onClose();
    }
  };

  return (
    <Modal visible={visible} animationType="fade" transparent={true} onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={handleOverlayPress} accessible={false}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.modalContainer}>
              <MixedFontText style={styles.title}>新しい気づき</MixedFontText>
              <TextInput
                style={styles.input}
                placeholder="学んだことを共有しよう..."
                value={content}
                onChangeText={setContent}
                multiline
                maxLength={500}
                onFocus={() => setInputFocused(true)}
                onBlur={() => setInputFocused(false)}
              />
              <Button
                variant="secondary"
                onPress={pickMedia}
                disabled={isPickingMedia}
                style={styles.mediaButton}
              >
                {isPickingMedia ? '...' : '画像・動画を選択'}
              </Button>
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
              <Button
                onPress={handlePost}
                disabled={isSubmitting}
                style={{ marginBottom: remToPx(theme.spacing[3]) }}
              >
                {isSubmitting ? '投稿中...' : '投稿する'}
              </Button>
              <Button variant="secondary" onPress={onClose}>
                閉じる
              </Button>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '90%',
    backgroundColor: theme.colors.background.primary,
    borderRadius: remToPx(theme.borderRadius.xl),
    padding: remToPx(theme.spacing[8]),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 6,
  },
  title: {
    fontSize: remToPx(theme.typography.fontSize.xl),
    fontWeight: theme.typography.fontWeight.bold,
    marginBottom: remToPx(theme.spacing[8]),
    color: theme.colors.text.primary,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: remToPx(theme.borderRadius.md),
    padding: remToPx(theme.spacing[4]),
    fontSize: remToPx(theme.typography.fontSize.base),
    marginBottom: remToPx(theme.spacing[4]),
    backgroundColor: theme.colors.background.secondary,
    minHeight: 120,
    textAlignVertical: 'top',
    color: theme.colors.text.primary,
  },
  mediaButton: {
    alignSelf: 'flex-start',
    marginBottom: remToPx(theme.spacing[4]),
  },
  previewContainer: {
    maxHeight: 80,
    marginBottom: remToPx(theme.spacing[6]),
  },
  previewImage: {
    width: 80,
    height: 80,
    borderRadius: remToPx(theme.borderRadius.md),
    marginRight: remToPx(theme.spacing[2]),
    backgroundColor: theme.colors.background.secondary,
  },
});

