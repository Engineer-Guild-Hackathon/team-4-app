import { ThreadMessageOut, ThreadOut } from '@/types/thread';
import React, { useRef, useState } from 'react'; // useRefを追加
import { theme } from '@/styles/theme';
import {
    FlatList,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

interface ThreadDetailViewProps {
  thread: ThreadOut;
  onBack: () => void;
  onSendMessage: (content: string) => Promise<ThreadMessageOut>;
}

// ★ 1. モーダル用のキーボードオフセット値を定義
// この値は実際の表示を見ながら微調整が必要な場合があります
const MODAL_KEYBOARD_OFFSET = Platform.OS === 'ios' ? 200 : 0;

export default function ThreadDetailView({ thread, onBack, onSendMessage }: ThreadDetailViewProps) {
  const [content, setContent] = useState('');
  const [sending, setSending] = useState(false);
  const [messages, setMessages] = useState<ThreadMessageOut[]>(thread.messages);
  // ★ 2. FlatListを操作するためのrefを作成
  const flatListRef = useRef<FlatList>(null);

  const handleSend = async () => {
    if (!content.trim()) return;
    setSending(true);
    try {
      const newMessage = await onSendMessage(content);
      setMessages(prevMessages => [...prevMessages, newMessage].sort((a, b) => b.id - a.id));
      setContent('');
      // ★ 3. 送信後、すぐに一番下にスクロールする
      setTimeout(() => flatListRef.current?.scrollToOffset({ offset: 0, animated: true }), 100);
    } catch (error) {
      console.error("Message send failed:", error);
    } 
    finally {
      setSending(false);
    }
  };

  return (
    <View
      style={styles.container}
    >
      {/* ヘッダー部分は変更なし */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backButtonText}>← 戻る</Text>
        </TouchableOpacity>
        <View style={styles.titleContainer}>
          <Text style={styles.title} numberOfLines={1}>{thread.mentor.username} : {thread.starter.username}</Text>
        </View>
        <View style={{ width: styles.backButton.width }} />
      </View>
      
      {/* ★ 4. FlatListにrefとcontentContainerStyleを追加 */}
      <FlatList
        ref={flatListRef}
        data={messages.sort((a, b) => b.id - a.id)} // 初期表示はpropsから、送信後はstateから
        keyExtractor={msg => msg.id.toString()}
        style={styles.messageList}
        contentContainerStyle={styles.messageListContent}
        inverted // invertedはチャットUIの基本
        renderItem={({ item }: { item: ThreadMessageOut }) => (
          <View style={styles.messageCard}>
            <Text style={styles.messageAuthor}>{item.author?.username}</Text>
            <Text style={styles.messageContent}>{item.content}</Text>
            <Text style={styles.messageDate}>{new Date(item.created_at).toLocaleString()}</Text>
          </View>
        )}
        keyboardShouldPersistTaps="handled"
      />

      {/* 入力欄の部分は変更なし */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="メッセージを入力"
          value={content}
          onChangeText={setContent}
          multiline
        />
        <TouchableOpacity style={styles.sendButton} onPress={handleSend} disabled={sending}>
          <Text style={styles.sendButtonText}>{sending ? '送信中...' : '送信'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.white,
  },
  header: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderFaint,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 80, 
    backgroundColor: theme.colors.borderExtraLight,
    borderRadius: theme.layout.radius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm - 2,
    alignItems: 'center',
  },
  backButtonText: {
    color: theme.colors.link,
    fontWeight: theme.typography.fontWeights.bold,
    fontSize: theme.typography.fontSizes.md + 1,
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    fontSize: theme.typography.fontSizes.base,
    fontWeight: theme.typography.fontWeights.bold,
    color: theme.colors.textDark,
  },
  messageList: {
    flex: 1,
    paddingHorizontal: theme.spacing.lg,
  },
  messageListContent: {
    paddingVertical: theme.spacing.md - 2,
  },
  messageCard: {
    backgroundColor: theme.colors.backgroundLighter, // Assuming f3f4f6 is similar to this
    borderRadius: theme.layout.radius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md - 2,
  },
  messageAuthor: {
    fontWeight: theme.typography.fontWeights.bold,
    color: theme.colors.link,
    marginBottom: theme.spacing.xs,
  },
  messageContent: {
    fontSize: theme.typography.fontSizes.md + 1,
    color: theme.colors.textMedium,
    lineHeight: theme.typography.lineHeights.snug,
  },
  messageDate: {
    fontSize: theme.typography.fontSizes.sm,
    color: theme.colors.textGray,
    marginTop: theme.spacing.sm - 2,
    alignSelf: 'flex-end',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md - 2,
    backgroundColor: theme.colors.white,
    borderTopWidth: 1,
    borderTopColor: theme.colors.borderFaint,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.layout.radius['2xl'],
    paddingTop: Platform.OS === 'ios' ? 10 : 8,
    paddingBottom: Platform.OS === 'ios' ? 10 : 8,
    paddingHorizontal: theme.spacing.lg - 1,
    fontSize: theme.typography.fontSizes.base,
    backgroundColor: theme.colors.backgroundLighter,
    marginRight: theme.spacing.md - 2,
    maxHeight: 120,
  },
  sendButton: {
    backgroundColor: theme.colors.black,
    borderRadius: theme.layout.radius['2xl'],
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonText: {
    color: theme.colors.white,
    fontSize: theme.typography.fontSizes.md + 1,
    fontWeight: theme.typography.fontWeights.bold,
  },
});