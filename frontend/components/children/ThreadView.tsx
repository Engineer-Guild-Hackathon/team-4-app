import { getThreads, sendMessageToThread } from '@/services/api/thread';
import { ThreadOut } from '@/types/thread';
import * as Haptics from 'expo-haptics';
import { useEffect, useState } from 'react';
import { theme } from '@/styles/theme';
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
    padding: theme.spacing.xl,
    backgroundColor: theme.colors.backgroundLighter, // Assuming f3f4f6 is similar
  },
  modalTitle: {
    fontSize: theme.typography.fontSizes['2xl'],
    fontWeight: theme.typography.fontWeights.bold,
    marginBottom: theme.spacing.lg,
    color: theme.colors.textDark,
  },
  threadCard: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.layout.radius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    ...theme.shadows.sm,
  },
  threadTitle: {
    fontSize: theme.typography.fontSizes.base,
    fontWeight: theme.typography.fontWeights.bold,
    color: theme.colors.link,
    marginBottom: theme.spacing.xs,
  },
  threadDate: {
    fontSize: theme.typography.fontSizes.sm,
    color: theme.colors.textGray,
    marginBottom: theme.spacing.xs,
  },
  threadMsgCount: {
    fontSize: theme.typography.fontSizes.sm + 1,
    color: theme.colors.green,
    fontWeight: theme.typography.fontWeights.bold,
  },
  emptyText: {
    color: theme.colors.textGray,
    textAlign: 'center',
    marginTop: theme.spacing['4xl'],
    fontSize: theme.typography.fontSizes.base,
  },
  errorText: {
    color: theme.colors.error,
    textAlign: 'center',
    marginTop: theme.spacing['4xl'],
    fontSize: theme.typography.fontSizes.base,
    fontWeight: theme.typography.fontWeights.bold,
  },
  detailContainer: {
    flex: 1,
    padding: theme.spacing.xl,
    backgroundColor: theme.colors.white,
  },
  backButton: {
    marginBottom: theme.spacing.md,
    alignSelf: 'flex-start',
    backgroundColor: theme.colors.borderExtraLight,
    borderRadius: theme.layout.radius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm - 2,
  },
  backButtonText: {
    color: theme.colors.link,
    fontWeight: theme.typography.fontWeights.bold,
    fontSize: theme.typography.fontSizes.md + 1,
  },
  detailTitle: {
    fontSize: theme.typography.fontSizes.xl,
    fontWeight: theme.typography.fontWeights.bold,
    marginBottom: theme.spacing.md - 2,
    color: theme.colors.textDark,
  },
  detailLabel: {
    fontSize: theme.typography.fontSizes.md,
    color: theme.colors.textMedium,
    marginBottom: theme.spacing.xs,
  },
  messagesContainer: {
    marginTop: theme.spacing.lg,
  },
  messageCard: {
    backgroundColor: theme.colors.backgroundLighter,
    borderRadius: theme.layout.radius.md,
    padding: theme.spacing.md - 2,
    marginBottom: theme.spacing.md - 2,
  },
  messageAuthor: {
    fontWeight: theme.typography.fontWeights.bold,
    color: theme.colors.link,
    marginBottom: theme.spacing.xxs,
  },
  messageContent: {
    fontSize: theme.typography.fontSizes.md,
    color: theme.colors.textMedium,
    marginBottom: theme.spacing.xxs,
  },
  messageDate: {
    fontSize: theme.typography.fontSizes.sm,
    color: theme.colors.textGray,
  },
  fab: {
    position: 'absolute',
    right: theme.spacing.xxl,
    bottom: theme.spacing['4xl'] - 8,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.colors.black,
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.shadows.lg,
  },
  fabText: {
    color: theme.colors.white,
    fontSize: theme.typography.fontSizes['4xl'],
    fontWeight: theme.typography.fontWeights.bold,
    lineHeight: theme.typography.lineHeights.loose,
  },
});
