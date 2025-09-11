import React, { useState, useEffect } from 'react';
import { StyleSheet, View, TouchableOpacity, Text } from 'react-native';
import { useAuth } from '@/hooks/useAuth';
import { useLocalSearchParams } from 'expo-router';
import { SimpleTopicView } from '../components/SimpleTopicView';
import PostListModal from '../components/posts/PostListModal';

// // TopicインターフェースはSimpleTopicViewに渡すために残しておくと良いでしょう
// interface Topic {
//   id: number;
//   title: string;
//   description: string;
// }

export default function HomeScreen() {
  const { logout, accessToken, loading } = useAuth();
  
  // 1. モーダルと、どの投稿リストを表示するかの状態を管理
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedTopicId, setSelectedTopicId] = useState<string | undefined>(undefined);
  const [selectedUserId, setSelectedUserId] = useState<number | undefined>(undefined);

  const params = useLocalSearchParams();

  // create-post画面から戻ってきた時にモーダルを開くための処理
  useEffect(() => {
    if (params.openModal === 'true') {
      // どのユーザー/トピックか不明なため、ここではモーダルを開かないか、
      // または特定のデフォルト状態で開くかを選択できます。
      // 今回は、ユーザー選択時にのみ開くようにします。
    }
  }, [params.openModal]);

  // 2. SimpleTopicView内のユーザーアイコンがタップされた時に呼ばれる関数
  // この関数をSimpleTopicViewにpropとして渡します
  const handleUserPress = (topicId: string, userId: number) => {
    setSelectedTopicId(topicId);
    setSelectedUserId(userId);
    setModalVisible(true); // ユーザーが選択されたらモーダルを開く
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>読み込み中...</Text>
        </View>
      </View>
    );
  }

  if (!accessToken) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>ログインが必要です</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* 3. SimpleTopicViewにonUserPressというpropを渡す */}
      {/* ★★★ SimpleTopicViewコンポーネント側で、ユーザーアイコンが押されたらこのonUserPressが呼ばれるように実装が必要です ★★★ */}
      <SimpleTopicView onUserPress={handleUserPress} />

      {/* 4. 汎用的な「投稿を見る」ボタンは不要になるためコメントアウトまたは削除 */}
      {/* <TouchableOpacity
        style={styles.postsButton}
        onPress={() => setModalVisible(true)}
        activeOpacity={0.8}
      >
        <Text style={styles.postsButtonText}>投稿を見る</Text>
      </TouchableOpacity>
      */}

      {/* ログアウトボタンは残しておくと便利です */}
      <TouchableOpacity
        style={styles.logoutButton}
        onPress={logout}
        activeOpacity={0.8}
      >
        <Text style={styles.logoutText}>ログアウト</Text>
      </TouchableOpacity>
      
      {/* 5. モーダルに選択されたtopicIdとuserIdを渡す */}
      <PostListModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        topicId={selectedTopicId}
        userId={selectedUserId}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    paddingTop: 50, // Add padding to avoid overlap with status bar
  },
  // ログアウトボタン用のスタイルを追加
  logoutButton: {
    position: 'absolute',
    right: 24,
    bottom: 32,
    backgroundColor: '#e11d48', // ピンク系
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 32,
    shadowColor: '#e11d48',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  logoutText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
    letterSpacing: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
    color: '#6b7280',
  },
  // postsButtonのスタイルは不要になったため削除してもOK
});

