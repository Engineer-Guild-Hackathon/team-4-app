import { ThreadMessageOut, ThreadOut } from '@/types/thread';
import React, { useRef, useState } from 'react'; // useRefを追加
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
      setMessages(prevMessages => [...prevMessages, newMessage]);
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
        data={messages} // 初期表示はpropsから、送信後はstateから
        keyExtractor={msg => msg.id.toString()}
        style={styles.messageList}
        contentContainerStyle={styles.messageListContent}
        inverted // invertedはチャットUIの基本
        renderItem={({ item }: { item: ThreadMessageOut }) => (
          <View style={[styles.messageCard, {transform: [{scaleY: -1}]}]}>
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
    backgroundColor: '#fff',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 80, 
    backgroundColor: '#e5e7eb',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignItems: 'center',
  },
  backButtonText: {
    color: '#2563eb',
    fontWeight: 'bold',
    fontSize: 15,
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  messageList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  messageListContent: {
    paddingVertical: 10,
  },
  messageCard: {
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  messageAuthor: {
    fontWeight: 'bold',
    color: '#2563eb',
    marginBottom: 4,
  },
  messageContent: {
    fontSize: 15,
    color: '#374151',
    lineHeight: 22,
  },
  messageDate: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 6,
    alignSelf: 'flex-end',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 20,
    paddingTop: Platform.OS === 'ios' ? 10 : 8,
    paddingBottom: Platform.OS === 'ios' ? 10 : 8,
    paddingHorizontal: 15,
    fontSize: 16,
    backgroundColor: '#f9fafb',
    marginRight: 10,
    maxHeight: 120,
  },
  sendButton: {
    backgroundColor: '#111',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
  },
});