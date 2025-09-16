import { useAuth } from '@/hooks/useAuth';
import AntDesign from '@expo/vector-icons/AntDesign';
import Feather from '@expo/vector-icons/Feather';
import { Link, useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MentorDashboard from '../components/MentorDashboard';
import { SimpleTopicView } from '../components/SimpleTopicView';
import UserDetailModal from '../components/UserDetailModal';

export default function HomeScreen() {
  const { accessToken, user, loading: authLoading, logout } = useAuth();
  const [modalVisible, setModalVisible] = useState(false);
  const [mentorDashboardVisible, setMentorDashboardVisible] = useState(false);
  const [selectedTopicId, setSelectedTopicId] = useState<string | undefined>(undefined);
  const [selectedUserId, setSelectedUserId] = useState<number | undefined>(undefined);
  const [currentTopicId, setCurrentTopicId] = useState<string | null>(null);
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
  const handleTopicChange = (topicId: string | null) => {
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
      {currentTopicId && (
        <>
          {/* プロフィール編集ボタン */}
          <Link href="/edit-profile" asChild>
            <TouchableOpacity style={styles.editButton}>
              <Feather name="user" size={24} color="white" />
            </TouchableOpacity>
          </Link>

          {/* 師匠ダッシュボードボタン */}
          <TouchableOpacity
            onPress={() => setMentorDashboardVisible(true)}
            style={styles.mentorshipButton}
          >
            <Feather name="user-plus" size={24} color="white" />
          </TouchableOpacity>

          {/* ログアウトボタン */}
          <TouchableOpacity style={styles.logoutButton} onPress={logout}>
            <AntDesign name="logout" size={24} color="white" />
          </TouchableOpacity>
        </>
      )}

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
        topicId={currentTopicId!}
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
    position: 'absolute',
    top: 240,
    right: 24,
    height: 60,
    width: 60,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 30,
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.5,
    shadowRadius: 5,
    elevation: 2,
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
    height: 60,
    width: 60,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 30,
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.5,
    shadowRadius: 5,
    elevation: 2,
  },
  mentorshipButton: {
    position: 'absolute',
    top: 150,
    right: 24,
    height: 60,
    width: 60,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 30,
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.5,
    shadowRadius: 5,
    elevation: 2,
  },
  editButtonText: {
    color: '#333',
    fontWeight: '600',
    fontSize: 14,
  },
});
