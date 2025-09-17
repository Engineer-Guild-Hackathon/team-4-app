import { getThreads, sendMessageToThread } from '@/services/api/thread';
import { ThreadOut } from '@/types/thread';
import * as Haptics from 'expo-haptics';
import { useCallback, useEffect, useState } from 'react';
import { theme } from '@/styles/theme';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import ThreadCreateModal from './ThreadCreateModal';
import ThreadDetailView from './ThreadDetailView';
import { Button } from '../Shared/Button';

type ThreadViewProps = {
  topicId: string;
  userId: number;
};

export default function ThreadView({ topicId, userId }: ThreadViewProps) {
  const [threads, setThreads] = useState<ThreadOut[]>([]);
  const [selectedThread, setSelectedThread] = useState<ThreadOut | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const reloadThreads = useCallback(async () => {
    try {
      setThreads(await getThreads(topicId, userId));
    } catch {
      setError('スレッドの取得に失敗しました');
    }
  }, [topicId, userId]);

  useEffect(() => {
    reloadThreads();
  }, [reloadThreads]);

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
      {error ? (
        <View style={styles.centered}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : threads.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.emptyText}>まだスレッドがありません</Text>
        </View>
      ) : (
        <ScrollView style={styles.pageContainer}>
          {threads.map(thread => (
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
          ))}
        </ScrollView>
      )}
      <Button
        variant="icon"
        style={styles.fab}
        textStyle={styles.fabText}
        onPress={() => setShowCreateModal(true)}
      >
        ＋
      </Button>

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

const remToPx = (rem: string) => parseFloat(rem) * 16;

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pageContainer: {
    padding: remToPx(theme.spacing[8]), // xl
    backgroundColor: theme.colors.background.primary,
  },
  modalTitle: {
    fontSize: remToPx(theme.typography.fontSize['2xl']),
    fontWeight: theme.typography.fontWeight.bold,
    marginBottom: remToPx(theme.spacing[6]), // lg
    color: theme.colors.text.primary,
  },
  // --- Thread List ---
  threadCard: {
    backgroundColor: theme.colors.background.primary,
    borderRadius: remToPx(theme.borderRadius.lg),
    padding: remToPx(theme.spacing[6]), // lg
    marginBottom: remToPx(theme.spacing[6]),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  threadTitle: {
    fontSize: remToPx(theme.typography.fontSize.base),
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.link,
    fontFamily: theme.typography.fontFamily.primary,
    marginBottom: remToPx(theme.spacing[2]), // xs
  },
  threadDate: {
    fontSize: remToPx(theme.typography.fontSize.sm),
    color: theme.colors.text.tertiary,
    fontFamily: theme.typography.fontFamily.primary,
    marginBottom: remToPx(theme.spacing[2]),
  },
  threadMsgCount: {
    fontSize: remToPx(theme.typography.fontSize.sm) + 1,
    color: theme.colors.semantic.success.main,
    fontWeight: theme.typography.fontWeight.bold,
  },
  emptyText: {
    color: theme.colors.text.tertiary,
    textAlign: 'center',
    marginTop: remToPx(theme.spacing[16]), // 4xl
    fontFamily: theme.typography.fontFamily.primary,
    fontSize: remToPx(theme.typography.fontSize.base),
  },
  errorText: {
    color: theme.colors.semantic.error.main,
    textAlign: 'center',
    marginTop: remToPx(theme.spacing[16]),
    fontSize: remToPx(theme.typography.fontSize.base),
    fontFamily: theme.typography.fontFamily.primary,
    fontWeight: theme.typography.fontWeight.bold,
  },
  detailContainer: {
    flex: 1,
    padding: remToPx(theme.spacing[8]),
    fontFamily: theme.typography.fontFamily.primary,
    backgroundColor: theme.colors.background.primary,
  },
  backButton: {
    marginBottom: remToPx(theme.spacing[4]), // md
    alignSelf: 'flex-start',
    backgroundColor: theme.colors.background.tertiary,
    borderRadius: remToPx(theme.borderRadius.md),
    paddingHorizontal: remToPx(theme.spacing[4]),
    paddingVertical: remToPx(theme.spacing[3]) - 2,
  },
  backButtonText: {
    color: theme.colors.text.link,
    fontWeight: theme.typography.fontWeight.bold,
    fontFamily: theme.typography.fontFamily.primary,
    fontSize: remToPx(theme.typography.fontSize.base) + 1,
  },
  detailTitle: {
    fontSize: remToPx(theme.typography.fontSize.xl),
    fontWeight: theme.typography.fontWeight.bold,
    marginBottom: remToPx(theme.spacing[4]) - 2,
    fontFamily: theme.typography.fontFamily.primary,
    color: theme.colors.text.primary,
  },
  detailLabel: {
    fontSize: remToPx(theme.typography.fontSize.base),
    color: theme.colors.text.secondary,
    marginBottom: remToPx(theme.spacing[2]),
    fontFamily: theme.typography.fontFamily.primary,
  },
  messagesContainer: {
    marginTop: remToPx(theme.spacing[6]),
  },
  messageCard: {
    backgroundColor: theme.colors.background.secondary,
    borderRadius: remToPx(theme.borderRadius.md),
    padding: remToPx(theme.spacing[4]) - 2,
    marginBottom: remToPx(theme.spacing[4]) - 2,
  },
  messageAuthor: {
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.link,
    fontFamily: theme.typography.fontFamily.primary,
    marginBottom: remToPx(theme.spacing[1]), // xxs
  },
  messageContent: {
    fontSize: remToPx(theme.typography.fontSize.base),
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fontFamily.primary,
    marginBottom: remToPx(theme.spacing[1]),
  },
  messageDate: {
    fontSize: remToPx(theme.typography.fontSize.sm),
    color: theme.colors.text.tertiary,
    fontFamily: theme.typography.fontFamily.primary,
  },
  fab: {
    position: 'absolute',
    right: remToPx(theme.spacing[8]),
    bottom: remToPx(theme.spacing[8]),
    width: 56,
    height: 56,
  },
  fabText: {
    fontSize: remToPx(theme.typography.fontSize['3xl']),
    lineHeight: remToPx(theme.typography.fontSize['3xl']),
  },
});
