import { useAuth } from '@/hooks/useAuth';
import { PostMediaOut, PostOut } from '@/types/post';
import { useEvent } from 'expo';
import * as Haptics from 'expo-haptics';
import { Link } from 'expo-router';
import { useVideoPlayer, VideoView } from 'expo-video';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import type { PagerViewOnPageSelectedEvent } from 'react-native-pager-view';
import PagerView from 'react-native-pager-view';
import ThreadView from './children/ThreadView';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL;

interface UserProfile {
  id: number;
  username: string;
  avatar?: string;
  bio?: string;
}

const VideoItem = ({ uri, style }: { uri: string; style: any }) => {
  const player = useVideoPlayer(uri, player => {
    player.loop = true;
    player.play();
  });

  const { isPlaying } = useEvent(player, 'playingChange', { isPlaying: player.playing });

  return (
    <VideoView
      player={player}
      style={style}
      // allowsFullscreen
      // allowsPictureInPicture
    />
  );
};

interface UserDetailModalProps {
  visible: boolean;
  onClose: () => void;
  topicId?: string;
  userId?: number;
  isSelf?: boolean;
  selfUserId?: number;
}

export default function UserDetailModal({
  visible,
  onClose,
  topicId,
  userId,
  isSelf,
  selfUserId,
}: UserDetailModalProps) {
  const [posts, setPosts] = useState<PostOut[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { accessToken } = useAuth();
  const [selectedTab, setSelectedTab] = useState(0); // 0: 投稿, 1: 掲示板
  const pagerRef = React.useRef<PagerView>(null);

  useEffect(() => {
    if (visible && userId) {
      setLoading(true);
      setError(null);
      
      const fetchAllData = async () => {
        try {
          const [profileData, postsData] = await Promise.all([
            fetchProfile(userId),
            fetchPosts(topicId, userId)
          ]);
          setProfile(profileData);
          setPosts(postsData);
        } catch (e: any) {
          setError(e.message);
        } finally {
          setLoading(false);
        }
      };
      
      fetchAllData();
    }
  }, [visible, topicId, userId]);

  const fetchProfile = async (id: number) => {
    const url = `${API_BASE_URL}/api/users/${id}/`;
    const response = await fetch(url, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    if (!response.ok) {
      throw new Error(`プロフィール取得エラー: ${response.status}`);
    }
    return await response.json();
  };

  const fetchPosts = async (tId?: string, uId?: number) => {
    const params = new URLSearchParams();
    if (tId) params.append('topic_id', tId);
    if (uId) params.append('author_id', String(uId));
    const url = `${API_BASE_URL}/api/posts/?${params.toString()}`;

    try {
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (!response.ok) {
        throw new Error(`APIサーバーからの応答エラー: ${response.status}`);
      }
      return await response.json();
    } catch (e: unknown) {
      if (e instanceof Error) {
        setError(e.message);
      } else {
        setError('不明なエラーが発生しました');
      }
      return []; // エラー時は空の配列を返す
    }
  };

  const handleDeletePost = async (postId: number) => {
    Alert.alert('投稿の削除', 'この投稿を本当に削除しますか？', [
      { text: 'キャンセル', style: 'cancel' },
      {
        text: '削除',
        style: 'destructive',
        onPress: async () => {
          try {
            const response = await fetch(`${API_BASE_URL}/api/posts/${postId}`, {
              method: 'DELETE',
              headers: { Authorization: `Bearer ${accessToken}` },
            });
            if (!response.ok) {
              const errorData = await response.json().catch(() => ({}));
              throw new Error(errorData.detail || '削除に失敗しました。');
            }
            fetchPosts();
          } catch (e: unknown) {
            if (e instanceof Error) {
              Alert.alert('エラー', e.message || '削除中にエラーが発生しました。');
            } else {
              Alert.alert('エラー', '削除中に不明なエラーが発生しました。');
            }
          }
        },
      },
    ]);
  };

  const renderPost = ({ item }: { item: PostOut }) => (
    <View style={styles.post}>
      {Number(selfUserId) === Number(item.author?.id) && (
        <TouchableOpacity style={styles.deleteButton} onPress={() => handleDeletePost(item.id)}>
          <Text style={styles.deleteButtonText}>削除</Text>
        </TouchableOpacity>
      )}
      <View>
        {item.media.map((media: PostMediaOut, index: number) => {
          const mediaUrl = media.file;
          if (media.media_type === 'image') {
            return <Image key={index} source={{ uri: mediaUrl }} style={styles.media} />;
          } else if (media.media_type === 'video') {
            return <VideoItem key={index} uri={mediaUrl} style={styles.media} />;
          }
          return null;
        })}
      </View>
      <Text style={styles.postContent}>{item.content}</Text>
    </View>
  );

  let content;
  if (loading) {
    content = <ActivityIndicator size="large" style={styles.centered} />;
  } else if (error) {
    content = <Text style={styles.centered}>エラー: {error}</Text>;
  } else if (posts.length === 0) {
    content = <Text style={styles.centered}>まだ投稿がありません。</Text>;
  } else {
    content = (
      <FlatList data={posts} renderItem={renderPost} keyExtractor={item => item.id.toString()} />
    );
  }

  const handlePageSelected = (e: PagerViewOnPageSelectedEvent) => {
    setSelectedTab(e.nativeEvent.position);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  return (
    <Modal
      animationType="slide"
      presentationStyle="pageSheet"
      visible={visible}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        shouldRasterizeIOS={true}
        keyboardVerticalOffset={60}
      >
      <View style={styles.modalContainer}>
        {/* ユーザー情報エリア */}
        <View style={styles.profileHeader}>
          {loading ? (
            <ActivityIndicator />
          ) : profile ? (
            <View style={styles.profileContainer}>
              <Image 
                source={
                  profile.avatar 
                    ? { uri: profile.avatar }
                    : { uri: `https://placehold.co/64x64/e0e0e0/555555?text=${profile.username.charAt(0)}` }
                }
                style={styles.avatar}
              />
              <View style={styles.profileTextContainer}>
                <Text style={styles.profileUsername}>{profile.username}</Text>
                <Text style={styles.profileBio} numberOfLines={2}>{profile.bio}</Text>
              </View>
            </View>
          ) : (
            <Text>プロフィールを読み込めませんでした</Text>
          )}
        </View>
        {/* タブエリア */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, selectedTab === 0 && styles.tabActive]}
            onPress={() => {
              setSelectedTab(0);
              pagerRef.current?.setPage(0);
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
          >
            <Text style={[styles.tabText, selectedTab === 0 && styles.tabTextActive]}>投稿</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, selectedTab === 1 && styles.tabActive]}
            onPress={() => {
              setSelectedTab(1);
              pagerRef.current?.setPage(1);
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
          >
            <Text style={[styles.tabText, selectedTab === 1 && styles.tabTextActive]}>掲示板</Text>
          </TouchableOpacity>
        </View>
        {/* PageViewエリア */}
        <PagerView
          style={styles.pagerView}
          initialPage={0}
          ref={pagerRef}
          onPageSelected={handlePageSelected}
        >
          {/* 投稿一覧ページ */}
          <View key="1" style={styles.pageContainer}>
            <View style={styles.header}>
              <Text style={styles.modalTitle}>投稿一覧</Text>
              {Number(selfUserId) === Number(userId) && (
                <Link
                  href={{
                    pathname: '/create-post',
                    params: { topicId: topicId },
                  }}
                  asChild
                >
                  <Pressable style={styles.createButton} onPress={onClose}>
                    <Text style={styles.createButtonText}>投稿する</Text>
                  </Pressable>
                </Link>
              )}
            </View>
            {content}
          </View>
          {/* 掲示板ページ */}
          <ThreadView userId={userId!} topicId={topicId!} />
        </PagerView>
        <TouchableOpacity style={styles.closeCircleButton} onPress={onClose}>
          <Text style={styles.closeCircleText}>×</Text>
        </TouchableOpacity>
      </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  modalContainer: {
    flex: 1,
    backgroundColor: 'white',
    paddingTop: 40,
  },
  userInfoContainer: {
    paddingHorizontal: 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  userInfoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#374151',
  },
  userInfoText: {
    fontSize: 14,
    color: '#6b7280',
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    backgroundColor: '#f3f4f6',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: '#3b82f6',
    backgroundColor: '#fff',
  },
  tabText: {
    fontSize: 16,
    color: '#6b7280',
    fontWeight: 'bold',
  },
  tabTextActive: {
    color: '#3b82f6',
  },
  pagerView: {
    flex: 1,
  },
  pageContainer: {
    flex: 1,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  createButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  createButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  closeCircleButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#111',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  closeCircleText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    lineHeight: 28,
  },
  post: {
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  postContent: {
    fontSize: 16,
    marginBottom: 10,
  },
  media: {
    width: '100%',
    height: 200,
    marginTop: 5,
    marginBottom: 5,
    backgroundColor: '#f0f0f0',
  },
  deleteButton: {
    position: 'absolute',
    top: 15,
    right: 0,
    backgroundColor: '#ff4d4d',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 5,
    zIndex: 1,
  },
  deleteButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  profileHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 15,
    paddingTop: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  profileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
    backgroundColor: '#f0f0f0',
  },
  profileTextContainer: {
    flex: 1,
  },
  profileUsername: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  profileBio: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },

});
