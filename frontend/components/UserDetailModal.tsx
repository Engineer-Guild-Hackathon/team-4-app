import { blockUser, getUser, unblockUser } from '@/services/api/user';
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
  TouchableOpacity,
  View,
} from 'react-native';
import type { PagerViewOnPageSelectedEvent } from 'react-native-pager-view';
import PagerView from 'react-native-pager-view';
import PostView from './children/PostView';
import ThreadView from './children/ThreadView';

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
  isSelf?: boolean;
  selfUserId?: number;
}

export default function UserDetailModal({
  visible,
  onClose,
  topicId,
  userId,
  selfUserId,
}: UserDetailModalProps) {
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
          setProfile(profileData);
        } catch (e: unknown) {
          if (e instanceof Error) {
            setError(e.message);
          } else {
            setError('不明なエラーが発生しました');
          }
        } finally {
          setLoading(false);
        }
      };

      fetchAllData();
    }
  }, [visible, topicId, userId]);

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
                {profile.blocking ? (
                  <TouchableOpacity
                    style={[styles.createButton, { marginLeft: 12 }]}
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
                  >
                    <Text style={styles.createButtonText}>ブロック解除</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={[styles.createButton, { marginLeft: 12 }]}
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
                  >
                    <Text style={styles.createButtonText}>ブロック</Text>
                  </TouchableOpacity>
                )}
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
              <Text style={[styles.tabText, selectedTab === 1 && styles.tabTextActive]}>
                掲示板
              </Text>
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
            <PostView
              loading={loading}
              error={error}
              selfUserId={selfUserId}
              onClose={onClose}
              userId={userId!}
              topicId={topicId!}
            />
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
  menuButton: {
    padding: 6,
  },
  menuButtonText: {
    fontSize: 18,
    color: '#555',
  },
});
