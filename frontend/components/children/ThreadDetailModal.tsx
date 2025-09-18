import { ThreadMessageOut, ThreadOut } from '@/types/thread';
import { theme, remToPx } from '@/styles/theme';
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
    backgroundColor: theme.colors.background.primary,
    padding: remToPx(theme.spacing[5]),
  },
  title: {
    fontSize: remToPx(theme.typography.fontSize.xl),
    fontWeight: theme.typography.fontWeight.bold,
    marginBottom: remToPx(theme.spacing[4]),
    color: theme.colors.text.primary,
    textAlign: 'center',
  },
  messageCard: {
    backgroundColor: theme.colors.background.secondary,
    borderRadius: remToPx(theme.borderRadius.lg),
    padding: remToPx(theme.spacing[4]),
    marginBottom: remToPx(theme.spacing[3]),
  },
  messageAuthor: {
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.link,
    marginBottom: remToPx(theme.spacing[1]),
  },
  messageContent: {
    fontSize: remToPx(theme.typography.fontSize.base),
    color: theme.colors.text.primary,
    marginBottom: remToPx(theme.spacing[1]),
  },
  messageDate: {
    fontSize: remToPx(theme.typography.fontSize.sm),
    color: theme.colors.text.secondary,
  },
  inputContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: remToPx(theme.spacing[16]),
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: remToPx(theme.spacing[5]),
    paddingVertical: remToPx(theme.spacing[2]),
    backgroundColor: theme.colors.background.primary,
    borderTopWidth: 1,
    borderColor: theme.colors.border,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: remToPx(theme.borderRadius.lg),
    padding: remToPx(theme.spacing[3]),
    fontSize: remToPx(theme.typography.fontSize.base),
    backgroundColor: theme.colors.background.secondary,
    marginRight: remToPx(theme.spacing[3]),
    minHeight: 40,
    maxHeight: 80,
    color: theme.colors.text.primary,
  },
  sendButton: {
    backgroundColor: theme.colors.text.primary,
    borderRadius: remToPx(theme.borderRadius.lg),
    paddingVertical: remToPx(theme.spacing[3]),
    paddingHorizontal: remToPx(theme.spacing[5]),
    alignItems: 'center',
    shadowColor: theme.colors.shadow.strong,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  sendButtonText: {
    color: theme.colors.text.inverse,
    fontSize: remToPx(theme.typography.fontSize.base),
    fontWeight: theme.typography.fontWeight.bold,
  },
  closeButton: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: remToPx(theme.spacing[2]),
    backgroundColor: theme.colors.text.primary,
    borderRadius: remToPx(theme.borderRadius.lg),
    paddingVertical: remToPx(theme.spacing[3]),
    alignItems: 'center',
    marginHorizontal: remToPx(theme.spacing[5]),
  },
  closeButtonText: {
    color: theme.colors.text.inverse,
    fontSize: remToPx(theme.typography.fontSize.base),
    fontWeight: theme.typography.fontWeight.bold,
  },
});
