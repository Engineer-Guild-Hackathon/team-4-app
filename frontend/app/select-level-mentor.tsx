import { VerticalLevelSelector } from '@/components/VerticalLevelSelector';
import { useAuth } from '@/hooks/useAuth';
import { UserOut } from '@/types/user';
import { apiClient } from '@/utils/apiClient';
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, StyleSheet, Text, View } from 'react-native';

const LEVEL_MIN = 1;
const LEVEL_MAX = 100;

export default function SelectLevelMentorScreen() {
  const params = useLocalSearchParams();
  const navigation = useNavigation();
  const router = useRouter();
  const topicId = params.topicId as string;
  const { accessToken, authedApi } = useAuth();

  // ページタイトル変更
  useEffect(() => {
    navigation.setOptions?.({ title: 'レベル・師匠選択' });
  }, [navigation]);

  // プログレスバーの値
  const [level, setLevel] = useState(5);

  // post取得
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true);
      try {
        // topicIdで絞り、postsリストで取得
        const res = await apiClient(`/api/posts/?topic_id=${topicId}`);
        setPosts(Array.isArray(res) ? res : []);
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
        const res = await authedApi<UserOut>('/api/users/me/');
        setUserId(res.id);
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
      await authedApi(`/api/topics/${topicId}/users/`, {
        method: 'POST',
        body: { user_id: userId, level },
      });
      Alert.alert('参加完了', 'トピックに参加しました', [
        {
          text: 'OK',
          onPress: () => router.replace('/'),
        },
      ]);
    } catch (e: any) {
      Alert.alert('エラー', e?.message || '参加に失敗しました');
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
              {posts[0].media?.map((media: any, idx: number) => {
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
          <Text
            style={{
              color: '#fff',
              fontSize: 18,
              fontWeight: 'bold',
              textAlign: 'center',
            }}
            onPress={handleJoin}
          >
            OK
          </Text>
        </View>
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
});
