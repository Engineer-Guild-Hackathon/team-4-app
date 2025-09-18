import { VerticalLevelSelector } from '@/components/VerticalLevelSelector';
import { useAuth } from '@/hooks/useAuth';
import {
  checkMentorSelectionRequired,
  createMentorRequest,
  getAvailableMentors,
  getMentorRequestStatus,
  getUserLevel,
  noMentorSelection,
} from '@/services/api/mentorship';
import { getPosts } from '@/services/api/post';
import { getTopicLevelInfo, joinTopic, leaveTopic } from '@/services/api/topic';
import { getMe } from '@/services/api/user';
import { PostMediaOut, PostOut } from '@/types/post';
import { MixedFontText } from '@/components/Shared/MixedFontText';
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
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
import { selectionHaptic, successHaptic, errorHaptic, formSubmitHaptic, buttonHaptic } from '@/utils/haptics';

const LEVEL_MIN = 1;
const LEVEL_MAX = 100;

interface Mentor {
  id: number;
  username: string;
}

export default function SelectLevelMentorScreen() {
  const params = useLocalSearchParams();
  const navigation = useNavigation();
  const router = useRouter();
  const topicId = params.topicId as string;
  const { accessToken, user } = useAuth();

  // ページタイトル変更
  useEffect(() => {
    navigation.setOptions?.({
      title: 'レベル・師匠選択',
      headerBackTitle: 'ホーム', // 「index」を「ホーム」に変更
    });
  }, [navigation]);

  // プログレスバーの値
  const [level, setLevel] = useState(5);

  // ユーザーの現在レベルとステータス
  const [userLevel, setUserLevel] = useState<number | null>(null);
  const [userStatus, setUserStatus] = useState<string | null>(null);

  // 師匠選択リクエストの状態
  const [requestStatus, setRequestStatus] = useState<{
    status: string;
    to_username?: string;
  } | null>(null);

  // レベルセレクターの制限を計算
  const getLevelConstraints = () => {
    if (!userStatus || userLevel === null) return { min: LEVEL_MIN, max: LEVEL_MAX };

    switch (userStatus) {
      case 'GRADUATED':
        // 卒業済みの場合は自分のlevel + 1以上のみ選択可能
        return { min: userLevel + 1, max: LEVEL_MAX };
      case 'EXPELLED':
        // 破門済みの場合は自分のlevel以下のみ選択可能
        return { min: LEVEL_MIN, max: userLevel };
      default:
        return { min: LEVEL_MIN, max: LEVEL_MAX };
    }
  };

  const levelConstraints = getLevelConstraints();

  const [selectedMentor, setSelectedMentor] = useState<Mentor | null>(null);
  const [mentorData, setMentorData] = useState<{
    required: boolean;
    mentors: Mentor[];
    userStatus?: string;
  } | null>(null);


  // post取得
  const [posts, setPosts] = useState<PostOut[]>([]);
  const [loading, setLoading] = useState(true);

  // ユーザーレベルを取得
  useEffect(() => {
    const fetchUserLevel = async () => {
      try {
        const userLevelResponse = (await getUserLevel(topicId)) as {
          level: number;
          status: string;
        };
        setUserLevel(userLevelResponse.level);
        setUserStatus(userLevelResponse.status);
        setLevel(userLevelResponse.level); // 現在のレベルをセット
      } catch (error) {
        console.error('ユーザーレベル取得エラー:', error);
        // エラーの場合はトピックのレベル情報を取得してデフォルト値を設定
        try {
          const levelInfo = (await getTopicLevelInfo(topicId)) as {
            max_level: number;
            min_level: number;
            user_count: number;
          };
          const defaultLevel = levelInfo.user_count > 0 ? levelInfo.min_level - 1 : 1;
          setUserLevel(defaultLevel);
          setUserStatus('active');
          setLevel(defaultLevel);
        } catch (levelError) {
          // レベル情報も取得できない場合は1をデフォルトに
          setUserLevel(1);
          setUserStatus('active');
          setLevel(1);
        }
      }
    };

    fetchUserLevel();
  }, [topicId]);

  // 師匠選択データを取得する関数
  const fetchMentorData = async () => {
    try {
      const selectionResponse = (await checkMentorSelectionRequired(topicId)) as {
        required: boolean;
        user_status?: string;
      };
      if (selectionResponse.required) {
        const mentors = (await getAvailableMentors(topicId)) as Mentor[];
        setMentorData({
          required: true,
          mentors,
          userStatus: selectionResponse.user_status,
        });
      } else {
        setMentorData({ required: false, mentors: [] });
      }
    } catch (error) {
      console.error('師匠選択データ取得エラー:', error);
      // エラーの場合は師匠選択不要として扱う
      setMentorData({ required: false, mentors: [] });
    }
  };

  // 師匠選択データを取得
  useEffect(() => {
    
    fetchMentorData();

  }, [topicId]);

  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true);
      try {
        // topicIdで絞り、postsリストで取得（userIdは指定しない）
        const posts = await getPosts(topicId);
        setPosts(posts);
      } catch {
        setPosts([]);
      } finally {
        setLoading(false);
      }
    };
    fetchPosts();
  }, [topicId]);

  // 師匠選択リクエストの状態を取得
  useEffect(() => {
    const fetchRequestStatus = async () => {
      if (!user?.id) return;
      
      try {
        const status = await getMentorRequestStatus(user.id, topicId) as {
          status: string;
          to_username?: string;
        };
        setRequestStatus(status);
      } catch (error) {
        console.error('リクエスト状態取得エラー:', error);
        setRequestStatus(null);
      }
    };

    fetchRequestStatus();
  }, [user?.id, topicId]);


  // 師匠選択処理
  const handleMentorSelection = async () => {
    if (!selectedMentor) {
      errorHaptic();
      Alert.alert('エラー', '師匠を選択してください');
      return;
    }

    formSubmitHaptic();
    try {
      // 師匠選択リクエストを作成
      const response = (await createMentorRequest(selectedMentor.id, topicId)) as {
        message?: string;
        id?: number;
        from_user?: any;
        to_user?: any;
        topic?: any;
        status?: string;
      };

      // レスポンスの内容に応じてメッセージを変更
      if (response.status === 'approved') {
        // 定員内の場合：無条件で師弟関係成立
        successHaptic();
        Alert.alert('参加完了', '師匠選択が完了しました。トピックに参加しました。', [
          {
            text: 'OK',
            onPress: () => router.replace('/'),
          },
        ]);
      } else {
        // 定員超過の場合：承認待ち
        successHaptic();
        Alert.alert(
          'リクエスト送信完了',
          '師匠選択リクエストを送信しました。師匠の承認をお待ちください。',
          [
            {
              text: 'OK',
              onPress: () => router.replace('/'),
            },
          ]
        );
      }
    } catch (error) {
      errorHaptic();
      console.error('師匠選択エラー:', error);
      Alert.alert('エラー', '師匠選択に失敗しました');
    }
  };

  // 師匠選択をしない処理
  const handleNoMentorSelection = async () => {
    selectionHaptic();
    Alert.alert('確認', '師匠を選択せずに参加しますか？\n最高レベル+1に設定されます。', [
      { text: 'キャンセル', style: 'cancel' },
      {
        text: '参加する',
        onPress: async () => {
          formSubmitHaptic();
          try {
            const response = (await noMentorSelection(topicId)) as {
              message?: string;
              new_level?: number;
            };

            successHaptic();
            Alert.alert(
              '参加完了',
              `師匠選択をスキップしました。レベル${response.new_level}で参加しました。`,
              [
                {
                  text: 'OK',
                  onPress: () => router.replace('/'),
                },
              ]
            );
          } catch (error) {
            errorHaptic();
            console.error('師匠選択スキップエラー:', error);
            Alert.alert('エラー', '参加に失敗しました');
          }
        },
      },
    ]);
  };

  // 戻るボタン処理（参加を取り消す）
  const handleBack = async () => {
    Alert.alert('確認', '参加を取り消して戻りますか？', [
      { text: 'キャンセル', style: 'cancel' },
      {
        text: '戻る',
        style: 'destructive',
        onPress: async () => {
          try {
            // ユーザーIDを取得してトピックから退出
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

  // 参加ボタン処理
  const handleJoin = async () => {
    // 師匠選択が必要な場合
    if (mentorData?.required) {
      if (!selectedMentor) {
        Alert.alert('エラー', '師匠を選択してください');
        return;
      }
      // 師匠選択を実行
      await handleMentorSelection();
      return;
    }

    // 師匠選択が不要な場合（直接参加）
    try {
      await joinTopic(topicId, level, selectedMentor?.id);
      Alert.alert('参加完了', 'トピックに参加しました', [
        {
          text: 'OK',
          onPress: () => router.replace('/'),
        },
      ]);
    } catch (e: unknown) {
      if (e instanceof Error) {
        Alert.alert('エラー', e.message);
      } else {
        Alert.alert('エラー', '参加に失敗しました');
      }
    }
  };

  return (
    <View style={styles.container}>
      {/* 左上に戻るボタン - 承認済みでない場合のみ表示 */}
      {requestStatus?.status !== 'approved' && (
        <View style={styles.backButtonContainer}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => {
              buttonHaptic();
              handleBack();
            }}
          >
            <MixedFontText style={styles.backButtonText}>← 戻る</MixedFontText>
          </TouchableOpacity>
        </View>
      )}

      {/* 右側レベル選択UI */}
      <View style={styles.rightBarContainer}>
        <VerticalLevelSelector
          min={levelConstraints.min}
          max={levelConstraints.max}
          value={level}
          onChange={setLevel}
        />
      </View>
      {/* 中央にpost表示とタイトル */}
      <View style={styles.centerContent}>
        {/* <MixedFontText style={styles.levelDisplay}>選択中のレベル: {level}</MixedFontText> */}
        {loading ? (
          <ActivityIndicator size="large" style={{ marginTop: 20 }} />
        ) : (
          <>
            {/* 師匠選択リクエストの状態表示 */}
            {requestStatus &&
              requestStatus.status !== 'none' &&
              requestStatus.status !== 'approved' && (
                <View style={styles.requestStatusContainer}>
                  <MixedFontText style={styles.requestStatusTitle}>師匠選択リクエストの状態</MixedFontText>
                  <MixedFontText style={styles.requestStatusMessage}>
                    {requestStatus.status === 'pending'
                      ? `@${requestStatus.to_username} へのリクエストが保留中です`
                      : requestStatus.status === 'rejected'
                      ? `@${requestStatus.to_username} がリクエストを拒否しました`
                      : ''}
                  </MixedFontText>
                </View>
              )}

            {/* 師匠選択が必要な場合 */}
            {mentorData?.required && (
              <View style={styles.mentorSelectionContainer}>
                <MixedFontText style={styles.mentorSelectionTitle}>師匠を選択してください</MixedFontText>
                <MixedFontText style={styles.mentorSelectionSubtitle}>
                  {userStatus === 'GRADUATED' && userLevel !== null
                    ? `卒業済みのため、レベル${userLevel + 1}以上の師匠を選択してください`
                    : userStatus === 'EXPELLED' && userLevel !== null
                    ? `破門済みのため、レベル${userLevel}以下の師匠を選択してください`
                    : userStatus === 'ACTIVE'
                    ? '師匠を選択してください'
                    : ''}
                </MixedFontText>

                <FlatList
                  data={mentorData.mentors}
                  keyExtractor={item => item.id.toString()}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={[
                        styles.mentorItem,
                        selectedMentor?.id === item.id && styles.selectedMentorItem,
                      ]}
                      onPress={() => {
                        selectionHaptic();
                        setSelectedMentor(item);
                      }}
                    >
                      <MixedFontText style={styles.mentorName}>{item.username}</MixedFontText>
                    </TouchableOpacity>
                  )}
                  style={styles.mentorList}
                />

                {/* 選択しないボタン */}
                <TouchableOpacity
                  style={styles.noSelectionButton}
                  onPress={handleNoMentorSelection}
                >
                  <MixedFontText style={styles.noSelectionButtonText}>師匠を選択しない</MixedFontText>
                </TouchableOpacity>
              </View>
            )}

            {posts.length > 0 ? (
              <View style={styles.postBox}>
                <View>
                  {posts[0].media?.map((media: PostMediaOut, idx: number) => {
                    const mediaUrl = media.file.startsWith('http')
                      ? media.file
                      : `${process.env.EXPO_PUBLIC_API_URL}${media.file}`;
                    if (media.media_type === 'image') {
                      return <Image key={idx} source={{ uri: mediaUrl }} style={styles.media} />;
                    }
                    // 動画対応は今後
                    return null;
                  })}
                </View>
                <MixedFontText style={styles.postContent}>{posts[0].content || '内容なし'}</MixedFontText>
              </View>
            ) : (
              <MixedFontText style={{ marginTop: 20 }}>投稿がありません</MixedFontText>
            )}
          </>
        )}
      </View>
      {/* 下中央にOKボタン - 適切な条件でのみ表示 */}
      {((mentorData?.required === false) ||
        (mentorData?.required === true && selectedMentor) ||
        (requestStatus?.status === 'approved')) && (
        <View style={styles.bottomButtonContainer}>
          <View
            style={{
              backgroundColor: '#000',
              borderRadius: 32,
              shadowColor: '#000',
              shadowOpacity: 0.3,
              shadowOffset: { width: 0, height: 4 },
              shadowRadius: 8,
              elevation: 4,
              paddingVertical: 14,
              paddingHorizontal: 48,
              minWidth: 180,
            }}
          >
            <MixedFontText
              style={{
                color: '#fff',
                fontSize: 18,
                fontWeight: 'bold',
                textAlign: 'center',
              }}
              onPress={handleJoin}
            >
              {requestStatus?.status === 'approved' ? '戻る' : '参加'}
            </MixedFontText>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#fff',
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
    justifyContent: 'center',
    alignItems: 'center',
    paddingLeft: 24,
    paddingRight: 80, // 右側に十分な余白を追加
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#1f2937',
  },
  levelDisplay: {
    fontSize: 18,
    color: '#3b82f6',
    fontWeight: 'bold',
    marginBottom: 16,
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
  },
  selectedMentorItem: {
    backgroundColor: '#dbeafe',
    borderColor: '#3b82f6',
  },
  mentorName: {
    fontSize: 16,
    color: '#374151',
    textAlign: 'center',
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
  postContent: {
    fontSize: 16,
    color: '#374151',
    marginBottom: 10,
  },
  media: {
    width: '100%',
    height: 200,
    marginTop: 5,
    marginBottom: 5,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
  },
  bottomButtonContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noSelectionButton: {
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginTop: 16,
    alignItems: 'center',
  },
  noSelectionButtonText: {
    fontSize: 16,
    color: '#6b7280',
    fontWeight: '500',
  },
  requestStatusContainer: {
    backgroundColor: '#fef3c7',
    borderWidth: 1,
    borderColor: '#f59e0b',
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
    width: 300,
  },
  requestStatusTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#92400e',
    marginBottom: 8,
    textAlign: 'center',
  },
  requestStatusMessage: {
    fontSize: 14,
    color: '#92400e',
    textAlign: 'center',
  },
});
