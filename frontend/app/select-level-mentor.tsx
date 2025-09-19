import { MixedFontText } from '@/components/Shared/MixedFontText';
import { VerticalLevelSelector } from '@/components/VerticalLevelSelector';
import { useAuth } from '@/hooks/AuthProvider';
import {
  createMentorRequest,
  getAvailableMentors,
  getMentorRequestStatus,
  getUserLevel,
  noMentorSelection,
} from '@/services/api/mentorship';
import { getPosts } from '@/services/api/post';
import { leaveTopic } from '@/services/api/topic';
import { getMe } from '@/services/api/user';
import { PostOut } from '@/types/post';
import {
  errorHaptic,
  formSubmitHaptic,
  selectionHaptic,
  successHaptic
} from '@/utils/haptics';
import { theme } from '@/styles/theme';
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

interface Mentor {
  id: number;
  username: string;
  level: number;
  avatar?: string;
}

export default function SelectLevelMentorScreen() {
  const params = useLocalSearchParams();
  const navigation = useNavigation();
  const router = useRouter();
  const topicId = params.topicId as string;
  const { user } = useAuth();

  const [level, setLevel] = useState(1);
  const [userLevelInfo, setUserLevelInfo] = useState<{ level: number; status: string } | null>(null);
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [selectedMentor, setSelectedMentor] = useState<Mentor | null>(null);
  const [posts, setPosts] = useState<PostOut[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [requestStatus, setRequestStatus] = useState<{ status: string; to_username?: string; } | null>(null);
  const flatListRef = useRef<FlatList<Mentor>>(null);


  useEffect(() => {
    navigation.setOptions?.({ title: 'レベル・師匠選択', headerBackTitle: 'ホーム' });
  }, [navigation]);

  // 初期データの読み込み
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoading(true);
        const [levelRes, mentorRes, statusRes] = await Promise.all([
          getUserLevel(topicId).catch(() => null) as Promise<{ level: number; status: string } | null>,
          getAvailableMentors(topicId).catch(() => []),
          user?.id ? getMentorRequestStatus(user.id, topicId).catch(() => null) : Promise.resolve(null),
        ]);

        const initialLevel = levelRes?.level ?? 1;
        setUserLevelInfo({ level: initialLevel, status: levelRes?.status ?? 'active' });
        setLevel(initialLevel);
        setMentors(mentorRes as Mentor[]);
        setRequestStatus(statusRes as any);
      } catch (error) {
        console.error('初期データの取得に失敗:', error);
      } finally {
        setLoading(false);
      }
    };
    loadInitialData();
  }, [topicId, user?.id]);

  const levelConstraints = useMemo(() => {
    if (!userLevelInfo) return { min: 1, max: 100 };
    switch (userLevelInfo.status) {
      case 'GRADUATED': return { min: userLevelInfo.level + 1, max: 100 };
      case 'EXPELLED': return { min: 1, max: userLevelInfo.level };
      default:
        if (mentors.length === 0) return { min: 1, max: 100 };
        const minLevel = Math.min(...mentors.map(m => m.level));
        const maxLevel = Math.max(...mentors.map(m => m.level));
        return { min: minLevel, max: maxLevel };
    }
  }, [userLevelInfo, mentors]);

  useEffect(() => {
    if (mentors.length === 0) return;
    const closestMentor = mentors.reduce((prev, curr) => 
      (Math.abs(curr.level - level) < Math.abs(prev.level - level) ? curr : prev)
    );
    if (closestMentor && closestMentor.id !== selectedMentor?.id) {
      selectionHaptic();
      setSelectedMentor(closestMentor);
      
      // 選択された師匠をFlatListの中央に表示
      const sortedMentors = mentors.sort((a, b) => b.level - a.level);
      const selectedIndex = sortedMentors.findIndex(mentor => mentor.id === closestMentor.id);
      if (selectedIndex !== -1 && flatListRef.current) {
        flatListRef.current.scrollToIndex({
          index: selectedIndex,
          animated: true,
          viewPosition: 0.5, // 中央に表示
        });
      }
    }
  }, [level, mentors, selectedMentor?.id]);

  useEffect(() => {
    if (!selectedMentor) { setPosts([]); return; }
    const fetchPosts = async () => {
      setLoadingPosts(true);
      try {
        setPosts(await getPosts(topicId, selectedMentor.id));
      } catch { setPosts([]); } 
      finally { setLoadingPosts(false); }
    };
    fetchPosts();
  }, [selectedMentor, topicId]);

  const handleMentorSelection = async () => {
    if (!selectedMentor) {
      errorHaptic();
      Alert.alert('エラー', '師匠を選択してください');
      return;
    }
    formSubmitHaptic();
    try {
      const response = (await createMentorRequest(selectedMentor.id, topicId)) as { status?: string; };
      if (response.status === 'approved') {
        successHaptic();
        Alert.alert('参加完了', '師匠選択が完了しました。トピックに参加しました。', [{ text: 'OK', onPress: () => router.replace('/') }]);
      } else {
        successHaptic();
        Alert.alert('リクエスト送信完了', '師匠選択リクエストを送信しました。師匠の承認をお待ちください。', [{ text: 'OK', onPress: () => router.replace('/') }]);
      }
    } catch (error) {
      errorHaptic();
      console.error('師匠選択エラー:', error);
      Alert.alert('エラー', '師匠選択に失敗しました');
    }
  };

  const handleNoMentorSelection = async () => {
    selectionHaptic();
    Alert.alert('確認', '師匠を選択せずに参加しますか？\n最高レベル+1に設定されます。', [
      { text: 'キャンセル', style: 'cancel' },
      {
        text: '参加する',
        onPress: async () => {
          formSubmitHaptic();
          try {
            const response = (await noMentorSelection(topicId)) as { new_level?: number; };
            successHaptic();
            Alert.alert('参加完了', `師匠選択をスキップしました。レベル${response.new_level}で参加しました。`, [{ text: 'OK', onPress: () => router.replace('/') }]);
          } catch (error) {
            errorHaptic();
            console.error('師匠選択スキップエラー:', error);
            Alert.alert('エラー', '参加に失敗しました');
          }
        },
      },
    ]);
  };

  const handleBack = async () => {
    Alert.alert('確認', '参加を取り消して戻りますか？', [
      { text: 'キャンセル', style: 'cancel' },
      {
        text: '戻る',
        style: 'destructive',
        onPress: async () => {
          try {
            const userResponse = await getMe();
            await leaveTopic(topicId, userResponse.id);
            router.replace('/');
          } catch (error) {
            console.error('参加取り消しエラー:', error);
            Alert.alert('エラー', '参加の取り消しに失敗しました');
          }
        },
      },
    ]);
  };
  
  const handleJoin = async () => {
    if (!selectedMentor) {
        Alert.alert('エラー', '師匠を選択してください');
        return;
    }
    await handleMentorSelection();
  };

  if (loading) {
    return <ActivityIndicator size="large" style={styles.centered} />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.backButtonContainer}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <MixedFontText style={styles.backButtonText}>← 戻る</MixedFontText>
        </TouchableOpacity>
      </View>
      
      <View style={styles.rightBarContainer}>
        <VerticalLevelSelector
          min={levelConstraints.min}
          max={levelConstraints.max}
          value={level}
          onChange={setLevel}
        />
      </View>
      
      <ScrollView 
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.centerContent}>
          <View style={styles.mentorSelectionContainer}>
            <Text style={styles.mentorSelectionTitle}>師匠を選択してください</Text>
            <Text style={styles.mentorSelectionSubtitle}>
              スライダーで目標レベルを設定すると、最適な師匠が自動で選択されます。
            </Text>

            <FlatList
              ref={flatListRef}
              data={mentors.sort((a, b) => b.level - a.level)}
              keyExtractor={item => item.id.toString()}
              renderItem={({ item }) => (
                <View style={[
                    styles.mentorItem,
                    selectedMentor?.id === item.id && styles.selectedMentorItem,
                  ]}>
                  <Image source={{ uri: item.avatar }} style={styles.mentorAvatar} />
                  <MixedFontText style={styles.mentorName}>{item.username}</MixedFontText>
                  <MixedFontText style={styles.mentorLevel}>Lv. {item.level}</MixedFontText>
                </View>
              )}
              style={styles.mentorList}
              scrollEnabled={false}
              nestedScrollEnabled={false}
              showsVerticalScrollIndicator={false}
              onScrollToIndexFailed={(info) => {
                // スクロール失敗時のフォールバック
                setTimeout(() => {
                  if (flatListRef.current && info.index < mentors.length) {
                    flatListRef.current.scrollToIndex({
                      index: info.index,
                      animated: true,
                      viewPosition: 0.5,
                    });
                  }
                }, 100);
              }}
            />
          </View>
          
          {selectedMentor && (
            loadingPosts ? (
              <ActivityIndicator style={{ marginTop: 20 }} />
            ) : (
              <View style={styles.postBox}>
                <Text style={styles.postBoxTitle}>{selectedMentor.username}の最新の気づき</Text>
                {posts.length > 0 ? (
                  <>
                    {posts[0].media?.[0]?.file && (
                      <Image source={{ uri: posts[0].media[0].file }} style={styles.media} />
                    )}
                    <MixedFontText style={styles.postContent} numberOfLines={3}>
                      {posts[0].content || '内容なし'}
                    </MixedFontText>
                  </>
                ) : (
                  <Text style={styles.noPostText}>まだ気づきがありません。</Text>
                )}
              </View>
            )
          )}
        </View>
      </ScrollView>

      <View style={styles.bottomButtonContainer}>
        <TouchableOpacity style={styles.joinButton} onPress={handleJoin}>
          <MixedFontText style={styles.joinButtonText}>
            {selectedMentor ? `${selectedMentor.username}に弟子入りする` : '参加する'}
          </MixedFontText>
        </TouchableOpacity>
        <TouchableOpacity style={styles.noSelectionButton} onPress={handleNoMentorSelection}>
          <MixedFontText style={styles.noSelectionButtonText}>師匠を選択せずに参加</MixedFontText>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: theme.colors.background.primary,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  backButtonContainer: {
    position: 'absolute',
    top: theme.remToPx(theme.spacing[12]), // 50px equivalent
    left: theme.remToPx(theme.spacing[5]), // 20px equivalent
    zIndex: 10,
  },
  backButton: {
    backgroundColor: theme.colors.background.secondary,
    borderWidth: 2,
    borderColor: theme.colors.primary[300],
    borderRadius: theme.remToPx(theme.borderRadius.full),
    paddingVertical: theme.remToPx(theme.spacing[2]), // 8px
    paddingHorizontal: theme.remToPx(theme.spacing[3]), // 12px
    shadowColor: theme.colors.shadow.soft,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.6,
    shadowRadius: 10,
    elevation: 6,
  },
  backButtonText: {
    fontSize: theme.remToPx(theme.typography.fontSize.base),
    color: theme.colors.text.primary,
    fontWeight: theme.typography.fontWeight.bold,
  },
  rightBarContainer: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'flex-end',
    width: 80,
    zIndex: 10,
  },
  scrollContainer: {
    flex: 1,
    paddingRight: 80,
  },
  scrollContent: {
    paddingBottom: 200, // ボタンエリア分の余白を確保
  },
  centerContent: {
    alignItems: 'center',
    paddingLeft: theme.remToPx(theme.spacing[6]), // 24px
    paddingTop: 120, // 120px
  },
  mentorSelectionContainer: {
    width: 300,
    marginBottom: theme.remToPx(theme.spacing[5]), // 20px
  },
  mentorSelectionTitle: {
    fontSize: theme.remToPx(theme.typography.fontSize.lg),
    fontWeight: theme.typography.fontWeight.bold,
    textAlign: 'center',
    marginBottom: theme.remToPx(theme.spacing[2]), // 8px
    color: theme.colors.text.primary,
  },
  mentorSelectionSubtitle: {
    fontSize: theme.remToPx(theme.typography.fontSize.sm),
    textAlign: 'center',
    marginBottom: theme.remToPx(theme.spacing[4]), // 16px
    color: theme.colors.text.secondary,
  },
  mentorList: {
    maxHeight: 200,
    flexGrow: 0, // FlatListの高さを固定
    borderWidth: 7,
    borderColor: theme.colors.primary[300],
    borderRadius: 0, // 真四角
    backgroundColor: theme.colors.background.secondary,
    padding: theme.remToPx(theme.spacing[2]), // 8px
    shadowColor: theme.colors.shadow.soft,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.6,
    shadowRadius: 10,
    elevation: 6,
  },
  mentorItem: {
    padding: theme.remToPx(theme.spacing[3]), // 12px
    borderWidth: 2,
    borderColor: theme.colors.primary[300],
    borderRadius: theme.remToPx(theme.borderRadius.full),
    marginBottom: theme.remToPx(theme.spacing[2]), // 8px
    backgroundColor: theme.colors.background.secondary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: theme.colors.shadow.soft,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.6,
    shadowRadius: 10,
    elevation: 6,
  },
  selectedMentorItem: {
    backgroundColor: theme.colors.primary[500],
    borderColor: theme.colors.primary[500],
    borderWidth: 2,
    transform: [{ scale: 1.02 }],
    shadowColor: theme.colors.primary[500],
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  mentorAvatar: {
    width: 32, 
    height: 32, 
    borderRadius: 16, 
    marginRight: theme.remToPx(theme.spacing[3]), // 12px
  },
  mentorName: {
    fontSize: theme.remToPx(theme.typography.fontSize.base),
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    flex: 1,
  },
  mentorLevel: {
    fontSize: theme.remToPx(theme.typography.fontSize.sm),
    color: theme.colors.text.secondary,
  },
  postBox: {
    backgroundColor: theme.colors.background.secondary,
    borderWidth: 2,
    borderColor: theme.colors.primary[300],
    borderRadius: theme.remToPx(theme.borderRadius.full),
    padding: theme.remToPx(theme.spacing[5]), // 20px
    marginTop: theme.remToPx(theme.spacing[5]), // 20px
    width: 260,
    shadowColor: theme.colors.shadow.soft,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.6,
    shadowRadius: 10,
    elevation: 6,
  },
  postBoxTitle: {
    fontSize: theme.remToPx(theme.typography.fontSize.sm),
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.secondary,
    marginBottom: theme.remToPx(theme.spacing[3]), // 12px
    textAlign: 'center',
  },
  postContent: {
    fontSize: theme.remToPx(theme.typography.fontSize.base),
    color: theme.colors.text.primary,
    marginBottom: theme.remToPx(theme.spacing[2]), // 8px
  },
  noPostText: {
    textAlign: 'center',
    color: theme.colors.text.tertiary,
  },
  media: {
    width: '100%',
    height: 150,
    borderRadius: theme.remToPx(theme.borderRadius.full),
    marginBottom: theme.remToPx(theme.spacing[3]), // 12px
  },
  bottomButtonContainer: {
    position: 'absolute',
    left: 0, 
    right: 0, 
    bottom: 0,
    padding: theme.remToPx(theme.spacing[6]), // 24px
    backgroundColor: theme.colors.frosted.light,
    borderTopWidth: 2,
    borderColor: theme.colors.primary[300],
  },
  joinButton: {
    backgroundColor: theme.colors.primary[500],
    borderRadius: theme.remToPx(theme.borderRadius.full),
    paddingVertical: theme.remToPx(theme.spacing[3]), // 12px
    paddingHorizontal: theme.remToPx(theme.spacing[8]), // 32px
    alignItems: 'center',
    shadowColor: theme.colors.shadow.soft,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.6,
    shadowRadius: 10,
    elevation: 6,
  },
  joinButtonText: {
    color: theme.colors.text.inverse,
    fontSize: theme.remToPx(theme.typography.fontSize.lg),
    fontWeight: theme.typography.fontWeight.bold,
  },
  noSelectionButton: {
    paddingVertical: theme.remToPx(theme.spacing[3]), // 12px
    marginTop: theme.remToPx(theme.spacing[3]), // 12px
  },
  noSelectionButtonText: {
    fontSize: theme.remToPx(theme.typography.fontSize.sm),
    color: theme.colors.text.secondary,
    fontWeight: theme.typography.fontWeight.bold,
    textAlign: 'center',
  },
});