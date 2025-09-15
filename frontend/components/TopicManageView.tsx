import { useAuth } from '@/hooks/useAuth';
import { createTopic, getAllTopics, getMyTopics, leaveTopic } from '@/services/api/topic';
import { getMe } from '@/services/api/user';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

interface Topic {
  id: string;
  title: string;
  description: string;
  created_at: string;
  updated_at: string;
}

interface TopicManageViewProps {
  onBack: () => void;
}

export function TopicManageView({ onBack }: TopicManageViewProps) {
  const [newTopicTitle, setNewTopicTitle] = useState('');
  const [newTopicDescription, setNewTopicDescription] = useState('');
  const [myTopics, setMyTopics] = useState<Topic[]>([]);
  const [availableTopics, setAvailableTopics] = useState<Topic[]>([]);
  const [allTopics, setAllTopics] = useState<Topic[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const { accessToken } = useAuth();
  const router = useRouter();

  // 参加トピック一覧を取得
  const fetchMyTopics = useCallback(async () => {
    try {
      const response = await getMyTopics();
      setMyTopics(response.topics || []);
    } catch {
      setMyTopics([]);
    }
  }, []);

  // 全トピック一覧を取得
  const fetchAllTopics = async () => {
    try {
      const response = await getAllTopics();
      setAllTopics(response.topics || []);
    } catch {
      setAllTopics([]);
    }
  };

  // 初期データ取得
  useEffect(() => {
    if (accessToken) {
      fetchMyTopics();
      fetchAllTopics();
    }
  }, [accessToken]);

  // 参加可能なトピックを更新するuseEffect
  useEffect(() => { 
      const myTopicIds = myTopics.map(topic => topic.id);
      setAvailableTopics(allTopics.filter(topic => !myTopicIds.includes(topic.id)));
  }, [allTopics, myTopics]);


  // トピック作成
  const handleCreateTopic = async () => {
    if (!newTopicTitle.trim()) {
      Alert.alert('エラー', 'タイトルを入力してください');
      return;
    }
    try {
      await createTopic(newTopicTitle.trim(), newTopicDescription.trim());
      setNewTopicTitle('');
      setNewTopicDescription('');
      await fetchMyTopics();
      await fetchAllTopics();
      Alert.alert('成功', 'トピックを作成しました');
    } catch (error: any) {
      const errorMessage = error?.message || 'トピックの作成に失敗しました';
      Alert.alert('エラー', errorMessage);
    }
  };

  // トピックに参加する（画面遷移）
  const handleJoinTopic = (topicId: string) => {
    router.push({ pathname: '/select-level-mentor', params: { topicId } });
  };

  // トピック作成モーダルを開く
  const openCreateModal = () => {
    setShowCreateModal(true);
  };

  // トピックから抜ける
  const handleLeaveTopic = async (topicId: string) => {
    Alert.alert('確認', 'このトピックから抜けますか？', [
      { text: 'キャンセル', style: 'cancel' },
      {
        text: '抜ける',
        style: 'destructive',
        onPress: async () => {
          try {
            // ユーザーIDを取得（現在のユーザー情報から）
            const userResponse = await getMe();
            await leaveTopic(topicId, userResponse.id);
            await fetchMyTopics();
            await fetchAllTopics();
            Alert.alert('成功', 'トピックから抜けました');
          } catch {
            Alert.alert('エラー', 'トピックからの退出に失敗しました');
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.manageContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.manageTitle}>トピック管理</Text>
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <Text style={styles.backButtonText}>戻る</Text>
          </TouchableOpacity>
        </View>

        {/* 新規トピック作成 */}

        <View style={styles.createSection}>
          <Text style={styles.sectionTitle}>新規トピック作成</Text>
          <TouchableOpacity style={styles.createButton} onPress={openCreateModal}>
            <Text style={styles.createButtonText}>新規トピック作成</Text>
          </TouchableOpacity>
        </View>

        {/* トピック参加 */}
        <Text style={styles.sectionTitle}>参加可能なトピック</Text>
        <ScrollView style={styles.joinSection}>
          {availableTopics.length === 0 ? (
            <View style={styles.emptyTopicsContainer}>
              <Text style={styles.emptyTopicsText}>参加可能なトピックがありません</Text>
              <Text style={styles.emptyTopicsSubText}>
                新しいトピックを作成するか、他のユーザーがトピックを作成するまでお待ちください
              </Text>
            </View>
          ) : (
            availableTopics.map(topic => (
              <View key={topic.id} style={styles.availableTopicItem}>
                <View style={styles.availableTopicInfo}>
                  <Text style={styles.availableTopicTitle}>{topic.title}</Text>
                  <Text style={styles.availableTopicDescription}>{topic.description}</Text>
                </View>
                <TouchableOpacity
                  style={styles.joinTopicButton}
                  onPress={() => handleJoinTopic(topic.id)}
                >
                  <Text style={styles.joinTopicButtonText}>参加</Text>
                </TouchableOpacity>
              </View>
            ))
          )}
        </ScrollView>

        {/* 参加中トピック一覧 */}
        <View style={styles.listSection}>
          <Text style={styles.sectionTitle}>参加中のトピック</Text>
          {myTopics.length === 0 ? (
            <View style={styles.emptyTopicsContainer}>
              <Text style={styles.emptyTopicsText}>参加しているトピックがありません</Text>
              <Text style={styles.emptyTopicsSubText}>トピックを作成してください</Text>
            </View>
          ) : (
            myTopics.map(topic => (
              <View key={topic.id} style={styles.topicItem}>
                <View style={styles.topicInfo}>
                  <Text style={styles.topicItemTitle}>{topic.title}</Text>
                  <Text style={styles.topicItemDescription}>{topic.description}</Text>
                </View>
                <TouchableOpacity
                  style={styles.leaveButton}
                  onPress={() => handleLeaveTopic(topic.id)}
                >
                  <Text style={styles.leaveButtonText}>抜ける</Text>
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>
        <View style={{ height: 80 }} />
      </ScrollView>

      {/* トピック作成モーダル */}
      <Modal
        visible={showCreateModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowCreateModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>新規トピック作成</Text>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowCreateModal(false)}
            >
              <Text style={styles.modalCloseButtonText}>閉じる</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.modalContent}>
            <TextInput
              style={styles.input}
              placeholder="タイトル"
              value={newTopicTitle}
              onChangeText={setNewTopicTitle}
            />
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="説明（任意）"
              value={newTopicDescription}
              onChangeText={setNewTopicDescription}
              multiline
              numberOfLines={3}
            />
            <TouchableOpacity style={styles.createButton} onPress={handleCreateTopic}>
              <Text style={styles.createButtonText}>作成</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
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
  manageContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
  },
  manageTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  backButton: {
    backgroundColor: '#6b7280',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  backButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  createSection: {
    marginBottom: 30,
  },
  listSection: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 15,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    marginBottom: 10,
    backgroundColor: '#ffffff',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  createButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  createButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  topicItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
  },
  topicInfo: {
    flex: 1,
  },
  topicItemTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  topicItemDescription: {
    fontSize: 14,
    color: '#6b7280',
  },
  leaveButton: {
    backgroundColor: '#f59e0b',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  leaveButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  emptyTopicsContainer: {
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 20,
    alignItems: 'center',
  },
  emptyTopicsText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#6b7280',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyTopicsSubText: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    lineHeight: 20,
  },
  joinSection: {
    marginBottom: 30,
  },
  joinButton: {
    backgroundColor: '#10b981',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  joinButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  modalCloseButton: {
    backgroundColor: '#6b7280',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  modalCloseButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  availableTopicItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
  },
  availableTopicInfo: {
    flex: 1,
  },
  availableTopicTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  availableTopicDescription: {
    fontSize: 14,
    color: '#6b7280',
  },
  joinTopicButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  joinTopicButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
