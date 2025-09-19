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
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
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
      
      <View style={styles.centerContent}>
          <View style={styles.mentorSelectionContainer}>
            <Text style={styles.mentorSelectionTitle}>師匠を選択してください</Text>
            <Text style={styles.mentorSelectionSubtitle}>
              スライダーで目標レベルを設定すると、最適な師匠が自動で選択されます。
            </Text>

            <FlatList
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
    backgroundColor: '#fff',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  backButtonContainer: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 10,
  },
  backButton: {
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  backButtonText: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '500',
  },
  rightBarContainer: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'flex-end',
    width: 80,
  },
  centerContent: {
    flex: 1,
    alignItems: 'center',
    paddingLeft: 24,
    paddingRight: 80,
    paddingTop: 120
  },
  mentorSelectionContainer: {
    width: 300,
    marginBottom: 20,
  },
  mentorSelectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
    color: '#1f2937',
  },
  mentorSelectionSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
    color: '#6b7280',
  },
  mentorList: {
    maxHeight: 200,
  },
  mentorItem: {
    padding: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#f9fafb',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectedMentorItem: {
    backgroundColor: '#dbeafe',
    borderColor: '#60a5fa',
    borderWidth: 2,
    transform: [{ scale: 1.02 }],
    shadowColor: '#3b82f6',
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  mentorAvatar: {
    width: 32, height: 32, borderRadius: 16, marginRight: 12,
  },
  mentorName: {
    fontSize: 16, fontWeight: '600', color: '#374151', flex: 1,
  },
  mentorLevel: {
    fontSize: 14, color: '#6b7280',
  },
  postBox: {
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 20,
    marginTop: 20,
    width: 260,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 2,
  },
  postBoxTitle: {
    fontSize: 14, fontWeight: '600', color: '#6b7280', marginBottom: 12, textAlign: 'center',
  },
  postContent: {
    fontSize: 16,
    color: '#374151',
    marginBottom: 10,
  },
  noPostText: {
    textAlign: 'center', color: '#9ca3af',
  },
  media: {
    width: '100%',
    height: 150,
    borderRadius: 8,
    marginBottom: 12,
  },
  bottomButtonContainer: {
    position: 'absolute',
    left: 0, right: 0, bottom: 0,
    padding: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderTopWidth: 1,
    borderColor: '#e5e7eb',
  },
  joinButton: {
    backgroundColor: '#2563eb',
    borderRadius: 32,
    paddingVertical: 14,
    paddingHorizontal: 32,
    alignItems: 'center',
    shadowColor: '#000', shadowOpacity: 0.2, shadowOffset: { width: 0, height: 2 }, shadowRadius: 8,
  },
  joinButtonText: {
    color: '#fff', fontSize: 18, fontWeight: 'bold',
  },
  noSelectionButton: {
    paddingVertical: 12, marginTop: 12,
  },
  noSelectionButtonText: {
    fontSize: 15, color: '#6b7280', fontWeight: '500', textAlign: 'center',
  },
});