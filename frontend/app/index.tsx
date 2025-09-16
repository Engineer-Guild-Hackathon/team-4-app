import { useAuth } from '@/hooks/AuthProvider';
import AntDesign from '@expo/vector-icons/AntDesign';
import Feather from '@expo/vector-icons/Feather';
import { Link, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MentorDashboard from '../components/MentorDashboard';
import PomodoroTimer from '../components/PomodoroTimer';
import { SimpleTopicView } from '../components/SimpleTopicView';
import UserDetailModal from '../components/UserDetailModal';

export default function HomeScreen() {
  const { user, loading: authLoading, logout } = useAuth();
  const [modalVisible, setModalVisible] = useState(false);
  const [mentorDashboardVisible, setMentorDashboardVisible] = useState(false);
  const [selectedTopicId, setSelectedTopicId] = useState<string | undefined>(undefined);
  const [selectedUserId, setSelectedUserId] = useState<number | undefined>(undefined);
  const [currentTopicId, setCurrentTopicId] = useState<string | null>(null);
  const router = useRouter();
  const [pomodoroVisible, setPomodoroVisible] = useState(false);
  const params = useLocalSearchParams();

  const [renderKey, setRenderKey] = useState(0);

  useEffect(() => {
    if (params.profileUpdated === 'true') {
      setRenderKey(prevKey => prevKey + 1);

      router.setParams({ profileUpdated: undefined });
    }
  }, [params.profileUpdatedm, router, params.profileUpdated]);

  useEffect(() => {
    if (params.openModal === 'true') {
      setSelectedTopicId(params.topicId as string);
      setSelectedUserId(Number(params.selfUserId));
      setModalVisible(true);
    }
  }, [params.openModal, params.topicId, params.selfUserId]);

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

  return (
    <View style={styles.container}>
      {currentTopicId && (
        <>
          <Link href="/edit-profile" asChild>
            <TouchableOpacity style={styles.editButton}>
              <Feather name="user" size={24} color="white" />
            </TouchableOpacity>
          </Link>
          <TouchableOpacity style={styles.headerCenterButton} onPress={() => setPomodoroVisible(true)}>
            <Text style={styles.pomodoroButtonText}>集中</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setMentorDashboardVisible(true)}
            style={styles.mentorshipButton}
          >
            <Feather name="user-plus" size={24} color="white" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.logoutButton} onPress={logout}>
            <AntDesign name="logout" size={24} color="white" />
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
      <PomodoroTimer 
        visible={pomodoroVisible}
        onClose={() => setPomodoroVisible(false)}
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
  // ... (以下、stylesの変更なし)
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
    headerCenterButton: {
    position: 'absolute',
    top: 60,
    left: '50%',
    transform: [{ translateX: -30 }],
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
  pomodoroButtonText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
});
