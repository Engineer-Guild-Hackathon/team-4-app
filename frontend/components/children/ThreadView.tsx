import { getThreads, sendMessageToThread } from '@/services/api/thread';
import { ThreadOut } from '@/types/thread';
import * as Haptics from 'expo-haptics';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import ThreadCreateModal from './ThreadCreateModal';
import ThreadDetailView from './ThreadDetailView';

type ThreadViewProps = {
  topicId: string;
  userId: number;
};

export default function ThreadView({ topicId, userId }: ThreadViewProps) {
  const [threads, setThreads] = useState<ThreadOut[]>([]);
  const [selectedThread, setSelectedThread] = useState<ThreadOut | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const reloadThreads = async () => {
    try {
      setThreads(await getThreads(topicId, userId));
    } catch (e) {
      setError('スレッドの取得に失敗しました');
    }
  };

  useEffect(() => {
    reloadThreads();
  }, [topicId, userId]);

  // 詳細ページを表示する場合
  if (selectedThread) {
    return (
      // ScrollViewなしで、ThreadDetailViewを直接レンダリングする
      <ThreadDetailView
        thread={selectedThread}
        onBack={() => setSelectedThread(null)}
        onSendMessage={async content => {
          const message = await sendMessageToThread(selectedThread.id, content);
          reloadThreads();
          return message;
        }}
      />
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <ScrollView style={styles.pageContainer}>
        {error ? (
          <Text style={styles.errorText}>{error}</Text>
        ) : threads.length === 0 ? (
          <Text style={styles.emptyText}>まだスレッドがありません</Text>
        ) : (
          threads.map(thread => (
            <TouchableOpacity
              key={thread.id}
              style={styles.threadCard}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                setSelectedThread(thread);
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.threadTitle}>
                starter: {thread.starter?.username} / mentor: {thread.mentor?.username}
              </Text>
              <Text style={styles.threadDate}>{new Date(thread.created_at).toLocaleString()}</Text>
              <Text style={styles.threadMsgCount}>メッセージ数: {thread.messages.length}</Text>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
      <TouchableOpacity
        style={styles.fab}
        activeOpacity={0.7}
        onPress={() => setShowCreateModal(true)}
      >
        <Text style={styles.fabText}>＋</Text>
      </TouchableOpacity>

      <ThreadCreateModal
        visible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        topicId={topicId}
        mentorId={userId}
        onCreated={reloadThreads}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  pageContainer: {
    padding: 20,
    backgroundColor: '#f3f4f6',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#1f2937',
  },
  threadCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  threadTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2563eb',
    marginBottom: 4,
  },
  threadDate: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  threadMsgCount: {
    fontSize: 13,
    color: '#10b981',
    fontWeight: 'bold',
  },
  emptyText: {
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 40,
    fontSize: 16,
  },
  errorText: {
    color: '#ef4444',
    textAlign: 'center',
    marginTop: 40,
    fontSize: 16,
    fontWeight: 'bold',
  },
  detailContainer: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
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
  detailTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#1f2937',
  },
  detailLabel: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 4,
  },
  messagesContainer: {
    marginTop: 16,
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
  fab: {
    position: 'absolute',
    right: 24,
    bottom: 32,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#111',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  fabText: {
    color: '#fff',
    fontSize: 32,
    fontWeight: 'bold',
    lineHeight: 36,
  },
});
