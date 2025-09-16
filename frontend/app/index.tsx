import { useAuth } from '@/hooks/useAuth';
import AntDesign from '@expo/vector-icons/AntDesign';
import Feather from '@expo/vector-icons/Feather';
import { theme } from '@/styles/theme';
import { Link, useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View, ViewStyle } from 'react-native';
import MentorDashboard from '../components/MentorDashboard';
import { SimpleTopicView } from '../components/SimpleTopicView';
import UserDetailModal from '../components/UserDetailModal';
import { Button } from '@/components/Shared/Button';

const remToPx = (rem: string) => parseFloat(rem) * 16;

export default function HomeScreen() {
  const { accessToken, user, loading: authLoading, logout } = useAuth();
  const [modalVisible, setModalVisible] = useState(false);
  const [mentorDashboardVisible, setMentorDashboardVisible] = useState(false);
  const [selectedTopicId, setSelectedTopicId] = useState<string | undefined>(undefined);
  const [selectedUserId, setSelectedUserId] = useState<number | undefined>(undefined);
  const [currentTopicId, setCurrentTopicId] = useState<string | null>(null);
  const router = useRouter();

  const params = useLocalSearchParams();

  const [renderKey, setRenderKey] = useState(0);

  useFocusEffect(
    useCallback(() => {
      console.log('画面がフォーカスされたため、SimpleTopicViewを再描画します。');
      // キーの値を更新することで、keyプロップを持つコンポーネントが再マウントされる
      setRenderKey(prevKey => prevKey + 1);
    }, [])
  );

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
        <Text style={styles.infoText}>ログインが必要です</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {currentTopicId && (
        <>
          <Link href="/edit-profile" asChild>
            <Button variant="icon" size="icon" style={styles.editButton}>
              <Feather name="user" size={24} color="white" />
            </Button>
          </Link>
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

      <SimpleTopicView
        key={renderKey}
        onUserPress={handleUserPress}
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
  fabBase: {
    // This style is now defined in the fabBaseStyle constant below
    // and is no longer needed here.
  },
  logoutButton: {
    // This will be defined using the fabBaseStyle constant
  },
  editButton: {
    // This will be defined using the fabBaseStyle constant
  },
  mentorshipButton: {
    // This will be defined using the fabBaseStyle constant
  },
});

const fabBaseStyle: ViewStyle = {
  position: 'absolute',
  right: remToPx(theme.spacing[20]), // xxl
  zIndex: 10,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.1,
  shadowRadius: 6,
  elevation: 5,
  borderWidth: 0, // Override default border from Button
};

Object.assign(styles, {
  logoutButton: {
    ...fabBaseStyle,
    top: remToPx(theme.spacing[24]) * 3, // Approximating "7xl" × 3
  },
  editButton: {
    ...fabBaseStyle,
    top: remToPx(theme.spacing[24]), // Approximating "6xl"
  },
  mentorshipButton: {
    ...fabBaseStyle,
    top: remToPx(theme.spacing[24]) + remToPx(theme.spacing[24]), // "7xl" + "6xl"
  },
});
