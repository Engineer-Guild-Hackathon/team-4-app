import { createThread } from '@/services/api/thread';
import React, { useState } from 'react';
import { theme } from '@/styles/theme';
import {
  Alert,
  Keyboard,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';

interface ThreadCreateModalProps {
  visible: boolean;
  onClose: () => void;
  topicId: string;
  mentorId: number;
  onCreated?: () => void;
}

export default function ThreadCreateModal({
  visible,
  onClose,
  topicId,
  mentorId,
  onCreated,
}: ThreadCreateModalProps) {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);

  // 背景タップ時の挙動: 入力欄がフォーカスされていなければモーダルを閉じる
  const handleOverlayPress = () => {
    Keyboard.dismiss();
    if (!inputFocused) {
      onClose();
    }
  };

  const handleCreate = async () => {
    if (!content.trim()) {
      Alert.alert('エラー', 'メッセージ内容を入力してください');
      return;
    }
    setLoading(true);
    try {
      await createThread({
        topic_id: topicId,
        mentor_id: mentorId,
        message: { content },
      });
      setContent('');
      onCreated?.();
      onClose();
      Alert.alert('成功', 'スレッドを作成しました');
    } catch (e: unknown) {
      if (e instanceof Error) {
        Alert.alert('エラー', e.message);
      } else {
        Alert.alert('エラー', '作成に失敗しました');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="fade" transparent={true} onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={handleOverlayPress} accessible={false}>
        <View style={styles.overlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.title}>新規スレッド作成</Text>
            <TextInput
              style={styles.input}
              placeholder="最初のメッセージ内容"
              value={content}
              onChangeText={setContent}
              multiline
              onFocus={() => setInputFocused(true)}
              onBlur={() => setInputFocused(false)}
            />
            <TouchableOpacity style={styles.createButton} onPress={handleCreate} disabled={loading}>
              <Text style={styles.createButtonText}>{loading ? '作成中...' : '作成'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeButtonText}>閉じる</Text>
            </TouchableOpacity>
          </View>
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
    backgroundColor: theme.colors.white,
    borderRadius: theme.layout.radius.xl,
    padding: theme.spacing.xxl,
    ...theme.shadows.lg,
  },
  title: {
    fontSize: theme.typography.fontSizes.xl,
    fontWeight: theme.typography.fontWeights.bold,
    marginBottom: theme.spacing.lg,
    color: theme.colors.textDark,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.layout.radius.md,
    padding: theme.spacing.md,
    fontSize: theme.typography.fontSizes.base,
    marginBottom: theme.spacing.lg,
    backgroundColor: theme.colors.backgroundLighter,
    minHeight: 60,
    textAlignVertical: 'top',
  },
  createButton: {
    backgroundColor: theme.colors.black,
    borderRadius: theme.layout.radius.md,
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
    marginBottom: theme.spacing.md - 2,
    ...theme.shadows.md,
  },
  createButtonText: {
    color: theme.colors.white,
    fontSize: theme.typography.fontSizes.base,
    fontWeight: theme.typography.fontWeights.bold,
  },
  closeButton: {
    backgroundColor: theme.colors.borderExtraLight,
    borderRadius: theme.layout.radius.md,
    paddingVertical: theme.spacing.md - 2,
    alignItems: 'center',
  },
  closeButtonText: {
    color: theme.colors.textMedium,
    fontSize: theme.typography.fontSizes.md + 1,
    fontWeight: theme.typography.fontWeights.bold,
  },
});
