import { ThreadMessageOut, ThreadOut } from '@/types/thread';
import React, { useState } from 'react';
import {
    FlatList,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

interface ThreadDetailViewProps {
  thread: ThreadOut;
  onBack: () => void;
  onSendMessage: (content: string) => Promise<ThreadMessageOut>;
}

// ★ ヘッダーの高さを定義（KeyboardAvoidingViewで使う）
const HEADER_HEIGHT = 80;

export default function ThreadDetailView({ thread, onBack, onSendMessage }: ThreadDetailViewProps) {
  const [content, setContent] = useState('');
  const [sending, setSending] = useState(false);
  const [messages, setMessages] = useState<ThreadMessageOut[]>(thread.messages);

  const handleSend = async () => {
    if (!content.trim()) return;
    setSending(true);
    try {
      const message = await onSendMessage(content);
      setMessages(prevMessages => [...prevMessages, message]);
      setContent('');
    } finally {
      setSending(false);
    }
  };

  return (
    // ★ 修正点1: KeyboardAvoidingViewを一番外側にし、スタイルとオフセットを設定
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#fff' }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={HEADER_HEIGHT}
    >
      <View style={styles.container}>
        {/* ヘッダー部分 */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <Text style={styles.backButtonText}>← 戻る</Text>
          </TouchableOpacity>
            <Text style={styles.title}>{thread.mentor.username} : {thread.starter.username}</Text>
        </View>

        {/* ★ 修正点2: FlatListを直接配置し、invertedプロパティを追加 */}
        <FlatList
          data={[...messages].reverse()} // ★ メッセージを逆順にする
          keyExtractor={msg => msg.id.toString()}
          style={styles.messageList}
          inverted // ★ これがチャットUIのキモ
          renderItem={({ item }: { item: ThreadMessageOut }) => (
            <View style={styles.messageCard}>
              <Text style={styles.messageAuthor}>{item.author?.username}</Text>
              <Text style={styles.messageContent}>{item.content}</Text>
              <Text style={styles.messageDate}>{new Date(item.created_at).toLocaleString()}</Text>
            </View>
          )}
        />

        {/* 入力欄 */}
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
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    padding: 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  backButton: {
    marginBottom: 12,
    alignSelf: 'flex-start',
    backgroundColor: '#e5e7eb',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  backButtonText: {
    color: '#2563eb',
    fontWeight: 'bold',
    fontSize: 15,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    textAlign: 'center',
  },
  messageList: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 10,
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
    borderRadius: 20, // 角を丸くしてチャットらしく
    paddingVertical: 8,
    paddingHorizontal: 15,
    fontSize: 16,
    backgroundColor: '#f9fafb',
    marginRight: 10,
    maxHeight: 100, // 高さを少し増やす
  },
  sendButton: {
    backgroundColor: '#111',
    borderRadius: 20,
    padding: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
  },
});
