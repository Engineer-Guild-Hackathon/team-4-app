import { Button } from '@/components/Shared/Button';
import { useAuth } from '@/hooks/AuthProvider';
import { theme } from '@/styles/theme';
import AntDesign from '@expo/vector-icons/AntDesign';
import Feather from '@expo/vector-icons/Feather';
import { Link, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import MentorDashboard from '../components/MentorDashboard';
import PomodoroTimer from '../components/PomodoroTimer';
import { SimpleTopicView } from '../components/SimpleTopicView';
import UserDetailModal from '../components/UserDetailModal';

const remToPx = (rem: string) => parseFloat(rem) * 16;

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
  }, [params.profileUpdated, router]);
  const handleUserPress = (topicId: string, userId: number) => {
    setSelectedTopicId(topicId);
    setSelectedUserId(userId);
    setModalVisible(true);
  };

  if (authLoading || !user) {
    return <ActivityIndicator size="large" style={styles.centered} />;
  }

  return (
    <View style={styles.container}>
      <SimpleTopicView
        key={renderKey}
        onUserPress={handleUserPress}
        onTopicChange={topicId => setCurrentTopicId(topicId)}
      />

      {currentTopicId && (
        <>
          <Link href="/edit-profile" asChild>
            <Button variant="icon" size="icon" style={styles.editButton}>
              <Feather name="user" size={24} color="white" />
            </Button>
          </Link>
          <TouchableOpacity
            style={styles.headerCenterButton}
            onPress={() => setPomodoroVisible(true)}
          >
            <Text style={styles.pomodoroButtonText}>集中</Text>
          </TouchableOpacity>
          <Button
            variant="icon"
            size="icon"
            onPress={() => setMentorDashboardVisible(true)}
            style={styles.mentorshipButton}
          >
            <Feather name="user-plus" size={24} color="white" />
          </Button>
          <Button variant="icon" size="icon" style={styles.logoutButton} onPress={logout}>
            <AntDesign name="logout" size={24} color="white" />
          </Button>
        </>
      )}

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

// ★ 修正点: スタイルの定義方法を改善
const fabBaseStyle: ViewStyle = {
  position: 'absolute',
  right: 24,
  height: 60,
  width: 60,
  backgroundColor: theme.colors.primary[400],
  justifyContent: 'center',
  alignItems: 'center',
  borderRadius: 30,
  zIndex: 10,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.5,
  shadowRadius: 5,
  elevation: 2,
  borderWidth: 0,
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background.primary,
  },
  infoText: {
    fontFamily: 'Klee One',
    fontSize: remToPx(theme.typography.fontSize.lg),
    color: theme.colors.text.primary,
  },
  editButton: {
    ...fabBaseStyle,
    top: 60,
  },
  mentorshipButton: {
    ...fabBaseStyle,
    top: 150,
  },
  logoutButton: {
    ...fabBaseStyle,
    top: 240,
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