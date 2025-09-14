import { createThread } from '@/services/api/thread';
import React, { useState } from 'react';
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
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#1f2937',
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
    backgroundColor: '#f9fafb',
    minHeight: 60,
    textAlignVertical: 'top',
  },
  createButton: {
    backgroundColor: '#111',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  closeButton: {
    backgroundColor: '#e5e7eb',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#374151',
    fontSize: 15,
    fontWeight: 'bold',
  },
});
