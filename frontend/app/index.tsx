import React, { useState, useEffect } from 'react';
import { StyleSheet, View, TouchableOpacity, Text, ActivityIndicator } from 'react-native';
import { useAuth } from '@/hooks/useAuth';
import { useLocalSearchParams } from 'expo-router';
import { SimpleTopicView } from '../components/SimpleTopicView';
import PostListModal from '../components/posts/PostListModal';

export default function HomeScreen() {
  const { accessToken, user, loading: authLoading } = useAuth();
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedTopicId, setSelectedTopicId] = useState<string | undefined>(undefined);
  const [selectedUserId, setSelectedUserId] = useState<number | undefined>(undefined);

  const params = useLocalSearchParams();

  // 投稿作成画面から戻ってきた時にモーダルを再度開くための処理
  useEffect(() => {
    if (params.openModal === 'true') {
      // 最後に選択したユーザーのモーダルを再度開く
      setModalVisible(true);
    }
  }, [params.openModal]);

  // SimpleTopicViewからtopicIdとuserIdが渡された時の処理
  const handleUserPress = (topicId: string, userId: number) => {
    setSelectedTopicId(topicId);
    setSelectedUserId(userId);
    setModalVisible(true);
  };

  // 認証情報を読み込み中の表示
  if (authLoading || !user) {
    return <ActivityIndicator size="large" style={styles.centered} />;
  }
  // 未ログイン時の表示
  if (!accessToken) {
    return (
      <View style={styles.centered}>
        <Text>ログインが必要です</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* SimpleTopicViewにonUserPress関数を渡して、タップイベントを受け取る */}
      <SimpleTopicView onUserPress={handleUserPress} />

      <PostListModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        topicId={selectedTopicId}
        userId={selectedUserId}
        selfUserId={user.id}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
