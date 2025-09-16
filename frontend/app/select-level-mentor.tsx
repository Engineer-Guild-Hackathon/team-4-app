import { VerticalLevelSelector } from '@/components/VerticalLevelSelector';
import { useAuth } from '@/hooks/useAuth';
import { getPosts } from '@/services/api/post';
import { joinTopic } from '@/services/api/topic';
import { getMe } from '@/services/api/user';
import { PostMediaOut, PostOut } from '@/types/post';
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { theme } from '@/styles/theme';

const remToPx = (rem: string) => parseFloat(rem) * 16;

const LEVEL_MIN = 1;
const LEVEL_MAX = 100;

export default function SelectLevelMentorScreen() {
  const params = useLocalSearchParams();
  const navigation = useNavigation();
  const router = useRouter();
  const topicId = params.topicId as string;
  const { accessToken } = useAuth();

  // ページタイトル変更
  useEffect(() => {
    navigation.setOptions?.({ title: 'レベル・師匠選択' });
  }, [navigation]);

  // プログレスバーの値
  const [level, setLevel] = useState(5);

  // post取得
  const [posts, setPosts] = useState<PostOut[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true);
      try {
        // topicIdで絞り、postsリストで取得
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

  // ユーザーID取得（仮: /api/users/me/）
  const [userId, setUserId] = useState<number | null>(null);
  useEffect(() => {
    const fetchUserId = async () => {
      try {
        const me = await getMe();
        setUserId(me.id);
      } catch {
        setUserId(null);
      }
    };
    fetchUserId();
  }, [accessToken]);

  // 参加ボタン処理
  const handleJoin = async () => {
    if (!userId) return;
    try {
      await joinTopic(topicId, userId, level);
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
      {/* 右側レベル選択UI */}
      <View style={styles.rightBarContainer}>
        <VerticalLevelSelector min={LEVEL_MIN} max={LEVEL_MAX} value={level} onChange={setLevel} />
      </View>
      {/* 中央にpost表示とタイトル */}
      <View style={styles.centerContent}>
        {/* <Text style={styles.levelDisplay}>選択中のレベル: {level}</Text> */}
        {loading ? (
          <ActivityIndicator size="large" style={{ marginTop: 20 }} />
        ) : posts.length > 0 ? (
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
            <Text style={styles.postContent}>{posts[0].content || '内容なし'}</Text>
          </View>
        ) : (
          <Text style={{ marginTop: 20 }}>投稿がありません</Text>
        )}
      </View>
      {/* 下中央にOKボタン */}
      <View style={styles.bottomButtonContainer}>
        <TouchableOpacity style={styles.okButton} onPress={handleJoin} activeOpacity={0.8}>
          <Text style={styles.okButtonText}>
            OK
          </Text>
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
    paddingLeft: remToPx(theme.spacing[20]), // xxl
    paddingRight: remToPx(theme.spacing[32]), // approximating "7xl"
  },
  postBox: {
    backgroundColor: theme.colors.background.secondary,
    borderWidth: 1,
    borderColor: theme.colors.background.tertiary,
    borderRadius: remToPx(theme.borderRadius.lg),
    padding: remToPx(theme.spacing[8]), // xl
    marginTop: remToPx(theme.spacing[8]),
    width: 260,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 5,
  },
  postContent: {
    fontSize: remToPx(theme.typography.fontSize.base),
    color: theme.colors.text.secondary,
    marginBottom: remToPx(theme.spacing[4]), // md
  },
  media: {
    width: '100%',
    height: 200,
    marginTop: remToPx(theme.spacing[2]), // xs
    marginBottom: remToPx(theme.spacing[2]),
    backgroundColor: theme.colors.background.tertiary,
    borderRadius: remToPx(theme.borderRadius.md),
  },
  bottomButtonContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: remToPx(theme.spacing[16]) - 8, // 4xl - 8px
    alignItems: 'center',
    justifyContent: 'center',
  },
  okButton: {
    backgroundColor: theme.colors.black,
    borderRadius: remToPx(theme.borderRadius.full),
    paddingVertical: remToPx(theme.spacing[6]) - 2, // lg - 2px
    paddingHorizontal: remToPx(theme.spacing[24]) - 8, // approximating "5xl"
    minWidth: 180,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 5,
  },
  okButtonText: {
    color: theme.colors.text.inverse,
    fontSize: remToPx(theme.typography.fontSize.lg),
    fontWeight: theme.typography.fontWeight.bold,
    textAlign: 'center',
  },
});
