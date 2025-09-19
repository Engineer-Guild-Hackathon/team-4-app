import { Button } from '@/components/Shared/Button';
import { MixedFontText } from '@/components/Shared/MixedFontText';
import { useAuth } from '@/hooks/AuthProvider';
import { deleteMentorRequest, getMentorRequestStatus } from '@/services/api/mentorship';
import { remToPx, theme } from '@/styles/theme';
import { importantActionHaptic } from '@/utils/haptics';
import Feather from '@expo/vector-icons/Feather';
import { Link, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import MentorDashboard from '../components/MentorDashboard';
import PomodoroTimer from '../components/PomodoroTimer';
import { SimpleTopicView } from '../components/SimpleTopicView';
import UserDetailModal from '../components/UserDetailModal';
import { useTimer } from '../contexts/TimerContext';

export default function HomeScreen() {
  const { user, loading: authLoading } = useAuth();
  const [modalVisible, setModalVisible] = useState(false);
  const [mentorDashboardVisible, setMentorDashboardVisible] = useState(false);
  const [selectedTopicId, setSelectedTopicId] = useState<string | undefined>(undefined);
  const [selectedUserId, setSelectedUserId] = useState<number | undefined>(undefined);
  const [currentTopicId, setCurrentTopicId] = useState<string | null>(null);
  const router = useRouter();
  const params = useLocalSearchParams();
  const [renderKey, setRenderKey] = useState(0);
  const { startTimerSession, phase } = useTimer();

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

  const handleTopicChange = async (topicId: string | null) => {
    setCurrentTopicId(topicId);

    // トピック切り替え時にリクエストが存在するか確認
    if (!topicId || !user) return; // トピックまたはユーザーが未選択の場合は処理しない

    try {
      const statusResponse = (await getMentorRequestStatus(user.id, topicId)) as {
        status: string;
        request_id?: number;
        to_username?: string;
        message?: string;
      };

      // 承認済みの場合：リクエストを削除して通知してリロード
      if (statusResponse.status === 'approved') {
        if (statusResponse.request_id) {
          await deleteMentorRequest(statusResponse.request_id);
        }
        Alert.alert('承認されました！', '師匠選択が承認されました。', [
          {
            text: 'OK',
            onPress: () => {
              // リロード（画面を再描画）
              setRenderKey(prevKey => prevKey + 1);
            },
          },
        ]);
        return;
      }

      // 拒否された場合：リクエストを削除して師匠選択へ
      else if (statusResponse.status === 'rejected') {
        if (statusResponse.request_id) {
          await deleteMentorRequest(statusResponse.request_id);
        }
        Alert.alert('拒否されました', '師匠選択リクエストが拒否されました。', [
          {
            text: 'OK',
            onPress: () => {
              // 師匠選択画面へ遷移
              router.push(`/select-level-mentor?topicId=${topicId}`);
            },
          },
        ]);
        return;
      }

      // リクエストがない場合：師匠選択が必要か確認
      else {
        await checkMentorSelectionNeeded(topicId);
        return;
      }
    } catch (error) {
      await checkMentorSelectionNeeded(topicId);
    }
  };

  // 師匠選択が必要か確認する関数
  const checkMentorSelectionNeeded = async (topicId: string) => {
    try {
      const { checkMentorSelectionRequired } = await import('@/services/api/mentorship');
      const selectionResponse = (await checkMentorSelectionRequired(topicId)) as {
        required: boolean;
        user_status?: string;
      };

      if (selectionResponse.required) {
        // 師匠選択が必要な場合、師匠選択画面へ遷移
        router.push(`/select-level-mentor?topicId=${topicId}`);
      }
    } catch (error) {
      console.error('師匠選択必要確認エラー:', error);
    }
  };

  const handleMentorSelectionRequired = (topicId: string) => {
    router.push(`/select-level-mentor?topicId=${topicId}`);
  };

  const handleStartPomodoro = () => {
    // 現在選択中のトピックIDを引数にして、グローバルタイマーの設定画面を開く
    startTimerSession(currentTopicId!);
  };

  if (authLoading || !user) {
    return <ActivityIndicator size="large" style={styles.centered} />;
  }

  return (
    <View style={styles.container}>
      <SimpleTopicView
        key={renderKey}
        onUserPress={handleUserPress}
        onMentorSelectionRequired={handleMentorSelectionRequired}
        onTopicChange={handleTopicChange}
      />

      {currentTopicId && (
        <>
          <Link href="/edit-profile" asChild>
            <Button variant="icon" size="icon" style={styles.editButton}>
              <Feather name="user" size={24} color="white" />
            </Button>
          </Link>
          {phase !== 'break' && (
            <TouchableOpacity
              style={styles.headerCenterButton}
              onPress={() => {
                importantActionHaptic();
                handleStartPomodoro();
              }}
            >
              <MixedFontText style={styles.pomodoroButtonText}>集中</MixedFontText>
            </TouchableOpacity>
          )}
          <Button
            variant="icon"
            size="icon"
            onPress={() => setMentorDashboardVisible(true)}
            style={styles.mentorshipButton}
          >
            <Feather name="user-plus" size={24} color="white" />
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
      <PomodoroTimer />
    </View>
  );
}

const fabBaseStyle: ViewStyle = {
  position: 'absolute',
  right: remToPx(theme.spacing[6]), // 24px
  height: 60,
  width: 60,
  backgroundColor: theme.colors.primary[400],
  justifyContent: 'center',
  alignItems: 'center',
  borderRadius: remToPx(theme.borderRadius.full),
  zIndex: 10,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.25,
  shadowRadius: 3.84,
  elevation: 5,
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
  headerCenterButton: {
    position: 'absolute',
    top: 60,
    left: '50%',
    transform: [{ translateX: -40 }], // Adjust based on final width
    backgroundColor: theme.colors.background.secondary,
    paddingVertical: remToPx(theme.spacing[2]),
    paddingHorizontal: remToPx(theme.spacing[4]),
    borderRadius: remToPx(theme.borderRadius.xl),
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
  },
  pomodoroButtonText: {
    fontSize: remToPx(theme.typography.fontSize.base),
    color: theme.colors.text.link,
    fontWeight: theme.typography.fontWeight.semibold,
  },
});
