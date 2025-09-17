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
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { Button } from '../Shared/Button';

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
            <Button
              variant="primary"
              onPress={handleCreate}
              loading={loading}
              style={styles.button}
            >
              {loading ? '作成中...' : '作成'}
            </Button>
            <Button variant="secondary" onPress={onClose} style={styles.button}>
              閉じる
            </Button>
          </View>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const remToPx = (rem: string) => parseFloat(rem) * 16;

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
    padding: remToPx(theme.spacing[20]), // xxl
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 6,
  },
  title: {
    fontSize: remToPx(theme.typography.fontSize.xl),
    fontWeight: theme.typography.fontWeight.bold,
    marginBottom: remToPx(theme.spacing[8]), // lg
    color: theme.colors.text.primary,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: remToPx(theme.borderRadius.md),
    padding: remToPx(theme.spacing[4]), // md
    fontSize: remToPx(theme.typography.fontSize.base),
    marginBottom: remToPx(theme.spacing[8]), // lg
    backgroundColor: theme.colors.background.secondary,
    minHeight: 60,
    textAlignVertical: 'top',
    color: theme.colors.text.primary,
  },
  button: {
    marginBottom: remToPx(theme.spacing[3]),
  },
});
