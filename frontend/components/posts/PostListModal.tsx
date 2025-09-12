import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  Image,
  ActivityIndicator,
  Modal,
  Pressable,
  TouchableOpacity,
  Alert,
} from 'react-native';
// import { Video } from 'expo-video';
import { Link } from 'expo-router';
import { useAuth } from '@/hooks/useAuth'; // useAuthをインポート

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL;

interface PostListModalProps {
  visible: boolean;
  onClose: () => void;
  topicId?: string;
  userId?: number;
  isSelf?: boolean;
  selfUserId?: number; // ログインしているユーザー自身のID
}

export default function PostListModal({
  visible,
  onClose,
  topicId,
  userId,
  isSelf,
  selfUserId,
}: PostListModalProps) {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { accessToken } = useAuth();

  useEffect(() => {
    if (visible && (topicId || userId)) {
      setLoading(true);
      setError(null);
      fetchPosts();
    }
  }, [visible, topicId, userId]);

  const fetchPosts = async () => {
    const params = new URLSearchParams();
    if (topicId) params.append('topic_id', topicId);
    if (userId) params.append('author_id', String(userId));
    const url = `${API_BASE_URL}/api/posts/?${params.toString()}`;

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`APIサーバーからの応答エラー: ${response.status}`);
      }
      const data = await response.json();
      setPosts(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
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
          } catch (e: any) {
            Alert.alert('エラー', e.message || '削除中にエラーが発生しました。');
          }
        },
      },
    ]);
  };

  const renderPost = ({ item }: { item: any }) => (
    <View style={styles.post}>
      {Number(selfUserId) === Number(item.author?.id) && (
        <TouchableOpacity style={styles.deleteButton} onPress={() => handleDeletePost(item.id)}>
          <Text style={styles.deleteButtonText}>削除</Text>
        </TouchableOpacity>
      )}
      <View>
        {item.media.map((media: any, index: number) => {
          const mediaUrl = `${API_BASE_URL}${media.file}`;
          if (media.media_type === 'image') {
            return <Image key={index} source={{ uri: mediaUrl }} style={styles.media} />;
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

  return (
    <Modal animationType="slide" transparent={true} visible={visible} onRequestClose={onClose}>
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
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

          <Pressable style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>閉じる</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    height: '80%',
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
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
  closeButton: {
    backgroundColor: '#ccc',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  closeButtonText: {
    fontSize: 16,
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
});
