import { useAuth } from '@/hooks/useAuth';
import { useLocalSearchParams, Link, useFocusEffect, useRouter } from 'expo-router';
import React, { useEffect, useState, useCallback } from 'react';
import { ActivityIndicator, StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { SimpleTopicView } from '../components/SimpleTopicView';
import UserDetailModal from '../components/UserDetailModal';
import MentorDashboard from '../components/MentorDashboard';

export default function HomeScreen() {
  const { accessToken, user, loading: authLoading, logout } = useAuth();
  const [modalVisible, setModalVisible] = useState(false);
  const [mentorDashboardVisible, setMentorDashboardVisible] = useState(false);
  const [selectedTopicId, setSelectedTopicId] = useState<string | undefined>(undefined);
  const [selectedUserId, setSelectedUserId] = useState<number | undefined>(undefined);
  const [currentTopicId, setCurrentTopicId] = useState<string | undefined>(undefined);
  const router = useRouter();

  const params = useLocalSearchParams();

  useFocusEffect(
    useCallback(() => {
      console.log('画面がフォーカスされたよ！');
    }, [])
  );

  useEffect(() => {
    if (params.openModal === 'true') {
      setModalVisible(true);
    }
  }, [params.openModal]);

  const handleUserPress = (topicId: string, userId: number) => {
    setSelectedTopicId(topicId);
    setSelectedUserId(userId);
    setModalVisible(true);
  };

  // 現在表示中のトピックIDを更新
  const handleTopicChange = (topicId: string) => {
    setCurrentTopicId(topicId);
  };

  // 師匠選択が必要な場合の処理
  const handleMentorSelectionRequired = (topicId: string) => {
    router.push(`/select-level-mentor?topicId=${topicId}`);
  };

  // 認証情報を読み込み中の表示
  if (authLoading || !user) {
    return <ActivityIndicator size="large" style={styles.centered} />;
  }
  if (!accessToken) {
    return (
      <View style={styles.centered}>
        <Text>ログインが必要です</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* ヘッダー部分 */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>師弟関係アプリ</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity
            style={styles.mentorDashboardButton}
            onPress={() => setMentorDashboardVisible(true)}
          >
            <Text style={styles.mentorDashboardButtonText}>師匠ダッシュボード</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.logoutButton} onPress={logout}>
            <Text style={styles.logoutButtonText}>ログアウト</Text>
          </TouchableOpacity>
        </View>
      </View>
      <Link href="/edit-profile" asChild>
        <TouchableOpacity style={styles.editButton}>
          <Text style={styles.editButtonText}>編集</Text>
        </TouchableOpacity>
      </Link>

      {/* SimpleTopicViewにonUserPress関数を渡して、タップイベントを受け取る */}
      <SimpleTopicView
        onUserPress={handleUserPress}
        onMentorSelectionRequired={handleMentorSelectionRequired}
        onTopicChange={handleTopicChange}
      />

      <UserDetailModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        topicId={selectedTopicId}
        userId={selectedUserId}
        selfUserId={user.id}
      />

      <MentorDashboard
        visible={mentorDashboardVisible}
        onClose={() => setMentorDashboardVisible(false)}
        topicId={currentTopicId}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  mentorDashboardButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  mentorDashboardButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  logoutButton: {
    backgroundColor: '#ff4444',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editButton: {
    position: 'absolute',
    top: 60,
    right: 24,
    backgroundColor: '#f0f0f0',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  editButtonText: {
    color: '#333',
    fontWeight: '600',
    fontSize: 14,
  },
});
