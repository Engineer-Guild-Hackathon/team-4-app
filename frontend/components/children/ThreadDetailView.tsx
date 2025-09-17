import { ThreadMessageOut, ThreadOut } from '@/types/thread';
import React, { useRef, useState } from 'react'; // useRefを追加
import { theme } from '@/styles/theme';
import { FlatList, Platform, StyleSheet, Text, TextInput, View } from 'react-native';
import { Button } from '../Shared/Button';

interface ThreadDetailViewProps {
  thread: ThreadOut;
  onBack: () => void;
  onSendMessage: (content: string) => Promise<ThreadMessageOut>;
}

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
      console.error('メッセージ送信に失敗しました:', error);
    } finally {
      setSending(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* ヘッダー部分は変更なし */}
      <View style={styles.header}>
        <Button variant="secondary" size="sm" onPress={onBack} style={styles.backButton}>
          ← 戻る
        </Button>
        <View style={styles.titleContainer}>
          <Text style={styles.title} numberOfLines={1}>
            {thread.mentor.username} : {thread.starter.username}
          </Text>
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
        <Button
          style={styles.sendButton}
          textStyle={styles.sendButtonText}
          onPress={handleSend}
          disabled={sending}
        >
          {sending ? '...' : '➤'}
        </Button>
      </View>
    </View>
  );
}

const remToPx = (rem: string) => parseFloat(rem) * 16;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },
  header: {
    paddingHorizontal: remToPx(theme.spacing[6]), // lg
    paddingVertical: remToPx(theme.spacing[4]), // md
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.background.tertiary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 90,
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    fontSize: remToPx(theme.typography.fontSize.base),
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
  },
  messageList: {
    flex: 1,
    paddingHorizontal: remToPx(theme.spacing[6]), // lg
  },
  messageListContent: {
    paddingVertical: remToPx(theme.spacing[4]) - 2, // md - 2px
  },
  messageCard: {
    backgroundColor: theme.colors.background.secondary,
    borderRadius: remToPx(theme.borderRadius.lg),
    padding: remToPx(theme.spacing[4]), // md
    marginBottom: remToPx(theme.spacing[4]) - 2,
  },
  messageAuthor: {
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.link,
    marginBottom: remToPx(theme.spacing[2]), // xs
  },
  messageContent: {
    fontSize: remToPx(theme.typography.fontSize.base) + 1,
    color: theme.colors.text.secondary,
    lineHeight: remToPx(theme.typography.lineHeight.snug),
  },
  messageDate: {
    fontSize: remToPx(theme.typography.fontSize.sm),
    color: theme.colors.text.tertiary,
    marginTop: remToPx(theme.spacing[3]) - 2, // sm - 2px
    alignSelf: 'flex-end',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: remToPx(theme.spacing[4]) - 2, // md - 2px
    backgroundColor: theme.colors.background.primary,
    borderTopWidth: 1,
    borderTopColor: theme.colors.background.tertiary,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: remToPx(theme.borderRadius['2xl']),
    paddingTop: Platform.OS === 'ios' ? 10 : 8,
    paddingBottom: Platform.OS === 'ios' ? 10 : 8,
    paddingHorizontal: remToPx(theme.spacing[6]) - 1, // lg - 1px
    fontSize: remToPx(theme.typography.fontSize.base),
    backgroundColor: theme.colors.background.secondary,
    marginRight: remToPx(theme.spacing[4]) - 2, // md - 2px
    maxHeight: 120,
    color: theme.colors.text.primary,
  },
  sendButton: {
    backgroundColor: theme.colors.primary[300],
    borderRadius: remToPx(theme.borderRadius['2xl']),
    width: 40,
    height: 40,
  },
  sendButtonText: {
    color: theme.colors.text.inverse,
    fontSize: remToPx(theme.typography.fontSize.xl),
  },
});
