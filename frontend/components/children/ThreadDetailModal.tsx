import { ThreadMessageOut, ThreadOut } from '@/types/thread';
import { useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { MixedFontText } from '@/components/Shared/MixedFontText';
import { buttonHaptic, formSubmitHaptic, successHaptic, errorHaptic } from '@/utils/haptics';

interface ThreadDetailModalProps {
  visible: boolean;
  onClose: () => void;
  thread: ThreadOut;
  onSendMessage?: (content: string) => Promise<void>;
}

export default function ThreadDetailModal({
  visible,
  onClose,
  thread,
  onSendMessage,
}: ThreadDetailModalProps) {
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!message.trim()) return;
    setSending(true);
    try {
      await onSendMessage?.(message);
      setMessage('');
    } finally {
      setSending(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.container}>
          <MixedFontText style={styles.title}>スレッド詳細</MixedFontText>
          <FlatList
            data={thread.messages}
            keyExtractor={msg => msg.id.toString()}
            renderItem={({ item }: { item: ThreadMessageOut }) => (
              <View style={styles.messageCard}>
                <MixedFontText style={styles.messageAuthor}>{item.author?.username}</MixedFontText>
                <MixedFontText style={styles.messageContent}>{item.content}</MixedFontText>
                <MixedFontText style={styles.messageDate}>{new Date(item.created_at).toLocaleString()}</MixedFontText>
              </View>
            )}
            contentContainerStyle={{ paddingBottom: 80 }}
          />
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="メッセージを入力"
              value={message}
              onChangeText={setMessage}
              multiline
            />
            <TouchableOpacity style={styles.sendButton} onPress={handleSend} disabled={sending}>
              <MixedFontText style={styles.sendButtonText}>{sending ? '送信中...' : '送信'}</MixedFontText>
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <MixedFontText style={styles.closeButtonText}>閉じる</MixedFontText>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#1f2937',
    textAlign: 'center',
  },
  messageCard: {
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
  },
  messageAuthor: {
    fontWeight: 'bold',
    color: '#2563eb',
    marginBottom: 2,
  },
  messageContent: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 2,
  },
  messageDate: {
    fontSize: 12,
    color: '#6b7280',
  },
  inputContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 70,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    backgroundColor: '#fff',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
    backgroundColor: '#f9fafb',
    marginRight: 10,
    minHeight: 40,
    maxHeight: 80,
  },
  sendButton: {
    backgroundColor: '#111',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 18,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  sendButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
  },
  closeButton: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 10,
    backgroundColor: '#000',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginHorizontal: 20,
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
