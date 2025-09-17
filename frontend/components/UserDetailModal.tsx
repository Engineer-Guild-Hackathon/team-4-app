import { deletePost, getPosts } from '@/services/api/post';
import { blockUser, getUser, unblockUser } from '@/services/api/user';
import { PostOut } from '@/types/post';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { PagerViewOnPageSelectedEvent } from 'react-native-pager-view';
import PagerView from 'react-native-pager-view';
import PostView from './children/PostView';
import ThreadView from './children/ThreadView';
import { theme } from '@/styles/theme';
import { Button } from './Shared/Button';

interface UserProfile {
  id: number;
  username: string;
  avatar: string | null;
  bio: string | null;
  blocking: boolean;
  blocked: boolean;
}

interface UserDetailModalProps {
  visible: boolean;
  onClose: () => void;
  topicId?: string;
  userId?: number;
  selfUserId?: number;
}

export default function UserDetailModal({
  visible,
  onClose,
  topicId,
  userId,
  selfUserId,
}: UserDetailModalProps) {
  const [posts, setPosts] = useState<PostOut[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState(0); // 0: 投稿, 1: 掲示板
  const pagerRef = React.useRef<PagerView>(null);

  useEffect(() => {
    if (visible && userId) {
      setLoading(true);
      setError(null);

      const fetchAllData = async () => {
        try {
          const profileData = await getUser(userId);
          const postsData = await getPosts(topicId!, profileData.id);
          setProfile(profileData);
          setPosts(postsData);
        } catch (e: unknown) {
          if (e instanceof Error) {
            setError(e.message);
          } else {
            setError('エラーが発生しました');
          }
        } finally {
          setLoading(false);
        }
      };

      fetchAllData();
    }
  }, [visible, topicId, userId]);

  const handleDeletePost = async (postId: number) => {
    Alert.alert('投稿の削除', 'この投稿を本当に削除しますか？', [
      { text: 'キャンセル', style: 'cancel' },
      {
        text: '削除',
        style: 'destructive',
        onPress: async () => {
          try {
            await deletePost(postId);
            await getPosts(topicId!, userId!);
          } catch (e: unknown) {
            if (e instanceof Error) {
              Alert.alert('エラー', e.message || '削除に失敗しました');
            } else {
              Alert.alert('エラー', '削除に失敗しました');
            }
          }
        },
      },
    ]);
  };

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
                  source={{
                    uri: profile.avatar
                      ? profile.avatar
                      : `https://placehold.co/64x64/e0e0e0/555555?text=${profile.username.charAt(0)}`,
                    cacheKey: profile.avatar ? profile.avatar.split('?')[0] : undefined,
                  }}
                  style={styles.avatar}
                />
                <View style={styles.profileTextContainer}>
                  <Text style={styles.profileUsername}>{profile.username}</Text>
                  <Text style={styles.profileBio} numberOfLines={2}>
                    {profile.bio}
                  </Text>
                </View>
                {selfUserId !== userId &&
                  (profile.blocking ? (
                    <Button // Unblock
                      onPress={async () => {
                        Alert.alert('ブロック解除', 'このユーザーのブロックを解除しますか？', [
                          { text: 'キャンセル', style: 'cancel' },
                          {
                            text: 'はい',
                            style: 'destructive',
                            onPress: async () => {
                              try {
                                await unblockUser(userId!); // 解除APIが同じ場合
                                Alert.alert('完了', 'ユーザーのブロックを解除しました');
                                const updatedProfile = await getUser(userId!);
                                setProfile(updatedProfile);
                              } catch {
                                Alert.alert('エラー', 'ブロック解除に失敗しました');
                              }
                            },
                          },
                        ]);
                      }}
                      variant="secondary"
                      size="sm"
                      style={{ marginLeft: 12 }}
                    >
                      ブロック解除
                    </Button> // Unblock
                  ) : (
                    <Button
                      onPress={async () => {
                        Alert.alert('ブロック', 'このユーザーをブロックしますか？', [
                          { text: 'キャンセル', style: 'cancel' },
                          {
                            text: 'はい',
                            style: 'destructive',
                            onPress: async () => {
                              try {
                                await blockUser(userId!);
                                Alert.alert('完了', 'ユーザーをブロックしました');
                                const updatedProfile = await getUser(userId!);
                                setProfile(updatedProfile);
                              } catch {
                                Alert.alert('エラー', 'ブロックに失敗しました');
                              }
                            },
                          },
                        ]);
                      }}
                      variant="secondary"
                      size="sm"
                      style={{ marginLeft: 12 }}
                    >
                      ブロック
                    </Button>
                  ))}
              </View>
            ) : (
              <Text>プロフィールを読み込めませんでした</Text>
            )}
          </View>
          {/* タブエリア */}
          <View style={styles.tabContainer}>
            <Button
              variant={selectedTab === 0 ? 'primary' : 'ghost'}
              textStyle={selectedTab === 0 ? styles.tabTextActive : styles.tabText}
              style={styles.tab}
              onPress={() => {
                setSelectedTab(0);
                pagerRef.current?.setPage(0);
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
            >
              投稿
            </Button>
            <Button
              variant={selectedTab === 1 ? 'primary' : 'ghost'}
              textStyle={selectedTab === 1 ? styles.tabTextActive : styles.tabText}
              style={styles.tab}
              onPress={() => {
                setSelectedTab(1);
                pagerRef.current?.setPage(1);
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
            >
              掲示板
            </Button>
          </View>
          {/* PageViewエリア */}
          <PagerView
            style={styles.pagerView}
            initialPage={0}
            ref={pagerRef}
            onPageSelected={handlePageSelected}
          >
            {/* 投稿一覧ページ */}
            <PostView
              posts={posts}
              loading={loading}
              error={error}
              selfUserId={selfUserId}
              onDelete={handleDeletePost}
            />
            {/* 掲示板ページ */}
            <ThreadView userId={userId!} topicId={topicId!} />
          </PagerView>
          <Button
            variant="icon"
            size="icon"
            textStyle={styles.closeButtonText}
            style={styles.closeCircleButton}
            onPress={onClose}
          >
            ×
          </Button>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background.primary,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
    paddingTop: 40,
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.background.primary,
  },
  tab: {
    flex: 1,
    borderRadius: 0,
    borderWidth: 0,
  },
  tabText: {
    fontSize: parseFloat(theme.typography.fontSize.base) * 16,
    color: theme.colors.text.secondary,
    fontWeight: 'bold',
    fontFamily: 'Klee One',
  },
  tabTextActive: {
    color: theme.colors.text.inverse,
  },
  pagerView: {
    flex: 1,
  },
  closeCircleButton: {
    position: 'absolute',
    top: 0,
    right: 5,
    width: 40,
    height: 40,
    zIndex: 100,
  },
  closeButtonText: {
    fontSize: 28,
  },
  profileHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 15,
    paddingTop: 10,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
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
    backgroundColor: theme.colors.background.secondary,
  },
  profileTextContainer: {
    flex: 1,
  },
  profileUsername: {
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: 'Klee One',
    color: theme.colors.text.primary,
  },
  profileBio: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    marginTop: 2,
    fontFamily: 'Klee One',
  },
});
