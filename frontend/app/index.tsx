import { useAuth } from '@/hooks/useAuth';
import AntDesign from '@expo/vector-icons/AntDesign';
import Feather from '@expo/vector-icons/Feather';
import { theme } from '@/styles/theme';
import { Link, useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
// ★ 修正点 1: useState をインポート
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

  // ★ 修正点 2: SimpleTopicView を再レンダリングするためのキーを管理するstate
  const [renderKey, setRenderKey] = useState(0);

  // ★ 修正点 3: 画面がフォーカスされるたびにキーを更新し、再レンダリングをトリガーする
  useFocusEffect(
    useCallback(() => {
      console.log('画面がフォーカスされたため、SimpleTopicViewを再描画します。');
      // キーの値を更新することで、keyプロップを持つコンポーネントが再マウントされる
      setRenderKey(prevKey => prevKey + 1);
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

  const handleTopicChange = (topicId: string | null) => {
    setCurrentTopicId(topicId);
  };

  const handleMentorSelectionRequired = (topicId: string) => {
    router.push(`/select-level-mentor?topicId=${topicId}`);
  };

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
          <Link href="/edit-profile" asChild>
            <TouchableOpacity style={styles.editButton}>
              <Feather name="user" size={24} color={theme.colors.white} />
            </TouchableOpacity>
          </Link>
          <TouchableOpacity
            onPress={() => setMentorDashboardVisible(true)}
            style={styles.mentorshipButton}
          >
            <Feather name="user-plus" size={24} color={theme.colors.white} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.logoutButton} onPress={logout}>
            <AntDesign name="logout" size={24} color={theme.colors.white} />
          </TouchableOpacity>
        </>
      )}

      {/* ★ 修正点 4: SimpleTopicViewにkeyプロップを渡す */}
      <SimpleTopicView
        key={renderKey}
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
    backgroundColor: theme.colors.white,
  },
  logoutButton: {
    position: 'absolute',
    top: theme.spacing['7xl'] * 3,
    right: theme.spacing.xxl,
    height: 60,
    width: 60,
    backgroundColor: theme.colors.black,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: theme.layout.radius.full,
    zIndex: 10,
    ...theme.shadows.lg,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.white,
  },
  editButton: {
    position: 'absolute',
    top: theme.spacing['6xl'],
    right: theme.spacing.xxl,
    height: 60,
    width: 60,
    backgroundColor: theme.colors.black,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: theme.layout.radius.full,
    zIndex: 10,
    ...theme.shadows.lg,
  },
  mentorshipButton: {
    position: 'absolute',
    top: theme.spacing['7xl'] + theme.spacing['6xl'],
    right: theme.spacing.xxl,
    height: 60,
    width: 60,
    backgroundColor: theme.colors.black,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: theme.layout.radius.full,
    zIndex: 10,
    ...theme.shadows.lg,
  },
});
