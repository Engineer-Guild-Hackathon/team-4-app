import { getThreads } from "@/services/api/thread";
import { ThreadOut } from "@/types/thread";
import { useEffect, useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

type ThreadViewProps = {
    topicId?: string;
    userId?: number;
};

export default function ThreadView({ topicId, userId }: ThreadViewProps) {
  const [threads, setThreads] = useState<ThreadOut[]>([]);
  const [selectedThread, setSelectedThread] = useState<ThreadOut | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        setError(null);
        const result = await getThreads(topicId, userId);
        setThreads(result);
      } catch (e: any) {
        setError(e?.message || 'スレッド取得に失敗しました');
      }
    })();
  }, [userId, topicId]);

  // 詳細ページ
  if (selectedThread) {
    // ... (この部分は変更なし)
    return (
      <View style={styles.detailContainer}>
        <TouchableOpacity style={styles.backButton} onPress={() => setSelectedThread(null)}>
          <Text style={styles.backButtonText}>← 戻る</Text>
        </TouchableOpacity>
        <Text style={styles.detailTitle}>スレッド詳細</Text>
        <Text style={styles.detailLabel}>starter: {selectedThread.starter?.username}</Text>
        <Text style={styles.detailLabel}>mentor: {selectedThread.mentor?.username}</Text>
        <Text style={styles.detailLabel}>作成日: {new Date(selectedThread.created_at).toLocaleString()}</Text>
        <Text style={styles.detailLabel}>メッセージ数: {selectedThread.messages.length}</Text>
        <View style={styles.messagesContainer}>
          {selectedThread.messages.map(msg => (
            <View key={msg.id} style={styles.messageCard}>
              <Text style={styles.messageAuthor}>{msg.author?.username}</Text>
              <Text style={styles.messageContent}>{msg.content}</Text>
              <Text style={styles.messageDate}>{new Date(msg.created_at).toLocaleString()}</Text>
            </View>
          ))}
        </View>
      </View>
    );
  }

  // ★★★ ここから下が一覧ページの修正箇所 ★★★
  return (
    // ★ 修正点1: 一番外側のViewに flex: 1 を追加して画面全体に広げる
    <View style={{ flex: 1 }}>
      <ScrollView 
        style={styles.pageContainer}
        // ★ 修正点2: スクロール時にFABの下にコンテンツが隠れるようにpaddingBottomを追加
        contentContainerStyle={{ paddingBottom: 80 }} 
      >
        <Text style={styles.modalTitle}>掲示板</Text>
        {error ? (
          <Text style={styles.errorText}>{error}</Text>
        ) : (
          threads.length === 0 ? (
            <Text style={styles.emptyText}>まだスレッドがありません</Text>
          ) : (
            threads.map(thread => (
              <TouchableOpacity
                key={thread.id}
                style={styles.threadCard}
                onPress={() => setSelectedThread(thread)}
                activeOpacity={0.8}
              >
                <Text style={styles.threadTitle}>starter: {thread.starter?.username} / mentor: {thread.mentor?.username}</Text>
                <Text style={styles.threadDate}>{new Date(thread.created_at).toLocaleString()}</Text>
                <Text style={styles.threadMsgCount}>メッセージ数: {thread.messages.length}</Text>
              </TouchableOpacity>
            ))
          )
        )}
      </ScrollView>
      {/* FABはScrollViewの外、親Viewの中に配置 */}
      <TouchableOpacity
        style={styles.fab}
        activeOpacity={0.7}
        onPress={() => Alert.alert('新規スレッド作成', 'ここで新しいThread作成画面を表示')}
      >
        <Text style={styles.fabText}>＋</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  // ... (pageContainer, modalTitleなどのスタイルは変更なし)

  // ★ 修正点3: flex: 1 を pageContainer から削除 (親Viewに移動したため)
  pageContainer: {
    padding: 20,
    backgroundColor: '#f3f4f6',
  },
  // ... (他のスタイルは変更なし)
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
    // zIndexは不要な場合が多いので削除してもOK
  },
  fabText: {
    color: '#fff',
    fontSize: 32,
    fontWeight: 'bold',
    lineHeight: 36,
  },
});