import { checkThreadPermission, getThreads, sendMessageToThread } from '@/services/api/thread';
import { ThreadOut } from '@/types/thread';
import * as Haptics from 'expo-haptics';
import { useCallback, useEffect, useState } from 'react';
import { theme } from '@/styles/theme';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import ThreadCreateModal from './ThreadCreateModal';
import ThreadDetailView from './ThreadDetailView';
import { Button } from '../Shared/Button';
import { MixedFontText } from '@/components/Shared/MixedFontText';
import { Fontisto } from '@expo/vector-icons';
import { useAuth } from '@/hooks/AuthProvider';

type ThreadViewProps = {
  topicId: string;
  userId: number;
};

export default function ThreadView({ topicId, userId }: ThreadViewProps) {
  const [threads, setThreads] = useState<ThreadOut[]>([]);
  const [selectedThread, setSelectedThread] = useState<ThreadOut | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [canCreateThread, setCanCreateThread] = useState(false);
  const { user: selfUser } = useAuth();

  const reloadThreads = useCallback(async () => {
    try {
      const fetchedThreads = await getThreads(topicId, userId);
      console.log("APIから取得したスレッドデータ:", JSON.stringify(fetchedThreads, null, 2));

      setThreads(await getThreads(topicId, userId));
    } catch {
      setError('スレッドの取得に失敗しました');
    }
  }, [topicId, userId]);

  useEffect(() => {
    reloadThreads();
  }, [reloadThreads]);

  useEffect(() => {
    const verifyPermission = async () => {
      // 自分のスレッド一覧を見ている場合は、作成ボタンは表示しない
      if (selfUser && selfUser.id === userId) {
        setCanCreateThread(false);
        return;
      }
      try {        
        const result = await checkThreadPermission(userId, topicId);
        
        setCanCreateThread(result.can_create);
      } catch (error) {

        setCanCreateThread(false);
      }
    };
    if (topicId && userId && selfUser) {
      verifyPermission();
    }
  }, [topicId, userId, selfUser]);

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
          <MixedFontText style={styles.errorText}>{error}</MixedFontText>
        </View>
      ) : threads.length === 0 ? (
        <View style={styles.centered}>
          <MixedFontText style={styles.emptyText}>まだスレッドがありません</MixedFontText>
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
              <MixedFontText style={styles.threadTitle}>{thread.title}</MixedFontText>
              <MixedFontText style={styles.threadDate}>
                {new Date(thread.created_at).toLocaleString()}
              </MixedFontText>
              <MixedFontText
                style={styles.threadMsgCount}
              >{`メッセージ数: ${thread.messages.length}`}</MixedFontText>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
      {canCreateThread && (
      <Button
        variant="icon"
        style={styles.fab}
        textStyle={styles.fabText}
        onPress={() => setShowCreateModal(true)}
      >
        <Fontisto name="plus-a" size={24} color="#fff" />
      </Button>
      )}

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
    color: theme.colors.text.primary,
    marginBottom: remToPx(theme.spacing[2]), // xs
  },
  threadDate: {
    fontSize: remToPx(theme.typography.fontSize.sm),
    color: theme.colors.text.tertiary,
    marginBottom: remToPx(theme.spacing[2]),
  },
  threadMsgCount: {
    fontSize: remToPx(theme.typography.fontSize.sm),
    color: theme.colors.semantic.success.main,
    fontWeight: theme.typography.fontWeight.bold,
  },
  emptyText: {
    color: theme.colors.text.tertiary,
    textAlign: 'center',
    marginTop: remToPx(theme.spacing[16]), // 4xl,
    fontSize: remToPx(theme.typography.fontSize.base),
  },
  errorText: {
    color: theme.colors.semantic.error.main,
    textAlign: 'center',
    marginTop: remToPx(theme.spacing[16]),
    fontSize: remToPx(theme.typography.fontSize.base),
    fontWeight: theme.typography.fontWeight.bold,
  },
  detailContainer: {
    flex: 1,
    padding: remToPx(theme.spacing[8]),
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
    fontSize: remToPx(theme.typography.fontSize.base),
  },
  detailTitle: {
    fontSize: remToPx(theme.typography.fontSize.xl),
    fontWeight: theme.typography.fontWeight.bold,
    marginBottom: remToPx(theme.spacing[4]) - 2,
    color: theme.colors.text.primary,
  },
  detailLabel: {
    fontSize: remToPx(theme.typography.fontSize.base),
    color: theme.colors.text.secondary,
    marginBottom: remToPx(theme.spacing[2]),
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
    marginBottom: remToPx(theme.spacing[1]), // xxs
  },
  messageContent: {
    fontSize: remToPx(theme.typography.fontSize.base),
    color: theme.colors.text.secondary,
    marginBottom: remToPx(theme.spacing[1]),
  },
  messageDate: {
    fontSize: remToPx(theme.typography.fontSize.sm),
    color: theme.colors.text.tertiary,
  },
  fab: {
    backgroundColor: theme.colors.primary[500],
    position: 'absolute',
    right: remToPx(theme.spacing[8]),
    bottom: remToPx(theme.spacing[8]),
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    width: 56,
    height: 56,
  },
  fabText: {
    color: '#fff',
    fontSize: remToPx(theme.typography.fontSize['3xl']),
    lineHeight: remToPx(theme.typography.fontSize['3xl']),
  },
});
