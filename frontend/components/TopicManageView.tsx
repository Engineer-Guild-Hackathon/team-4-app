import { useAuth } from '@/hooks/useAuth';
import { checkMentorSelectionRequired } from '@/services/api/mentorship';
import {
  createTopic,
  getAllTopics,
  getMyTopics,
  getTopicLevelInfo,
  joinTopic,
  leaveTopic,
  updateMenteeCapacity,
} from '@/services/api/topic';
import { getMe } from '@/services/api/user';
import { theme } from '@/styles/theme';
import { MyTopicOut, TopicOut } from '@/types/topic';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Modal, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Button } from './Shared/Button';
import { MixedFontText } from './Shared/MixedFontText';


interface TopicManageViewProps {
  onBack: () => void;
}

export function TopicManageView({ onBack }: TopicManageViewProps) {
  const [newTopicTitle, setNewTopicTitle] = useState('');
  const [newTopicDescription, setNewTopicDescription] = useState('');
  const [myTopics, setMyTopics] = useState<MyTopicOut[]>([]);
  const [availableTopics, setAvailableTopics] = useState<TopicOut[]>([]);
  const [allTopics, setAllTopics] = useState<TopicOut[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [capacityInputs, setCapacityInputs] = useState<{ [topicId: string]: string }>({});
  const { accessToken } = useAuth();
  const router = useRouter();

  // 参加トピック一覧を取得
  const fetchMyTopics = useCallback(async () => {
    try {
      const response = await getMyTopics();
      setMyTopics(response.topics || []);
      // 弟子定員の入力値を初期化
      const initialCapacityInputs: { [topicId: string]: string } = {};
      (response.topics || []).forEach(topic => {
        initialCapacityInputs[topic.id] = topic.mentee_capacity.toString();
      });
      setCapacityInputs(initialCapacityInputs);
    } catch {
      setMyTopics([]);
    }
  }, []);

  // 全トピック一覧を取得
  const fetchAllTopics = useCallback(async () => {
    try {
      const response = await getAllTopics();
      setAllTopics(response.topics || []);
    } catch {
      setAllTopics([]);
    }
  }, []);

  // 初期データ取得
  useEffect(() => {
    if (accessToken) {
      fetchMyTopics();
      fetchAllTopics();
    }
  }, [accessToken, fetchMyTopics, fetchAllTopics]);

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
    if (newTopicTitle.length > 200) {
      Alert.alert('エラー', 'タイトルは200文字以内で入力してください');
      return;
    }
    if (newTopicDescription.length > 100) {
      Alert.alert('エラー', '説明は100文字以内で入力してください');
      return;
    }
    try {
      await createTopic(newTopicTitle.trim(), newTopicDescription.trim());
      setNewTopicTitle('');
      setNewTopicDescription('');
      await fetchMyTopics();
      await fetchAllTopics();
      Alert.alert('成功', 'トピックを作成しました');
    } catch (error: unknown) {
      const errorMessage =
        (error as { message?: string })?.message || 'トピックの作成に失敗しました';
      Alert.alert('エラー', errorMessage);
    }
  };

  // トピックに参加する
  const handleJoinTopic = async (topicId: string) => {
    try {
      // トピックのレベル情報を取得
      const levelInfo = (await getTopicLevelInfo(topicId)) as {
        max_level: number;
        min_level: number;
        user_count: number;
      };

      // デフォルトレベルを設定（最低レベル-1、誰もいない場合は1）
      const defaultLevel = levelInfo.user_count > 0 ? levelInfo.min_level - 1 : 1;

      // トピックに参加
      await joinTopic(topicId, defaultLevel);
      await fetchMyTopics();
      await fetchAllTopics();

      // 師匠選択が必要かチェック
      const selectionResponse = (await checkMentorSelectionRequired(topicId)) as {
        required: boolean;
      };

      if (selectionResponse.required) {
        // 師匠選択が必要な場合
        Alert.alert('参加完了', '師匠選択が必要です', [
          {
            text: 'OK',
            onPress: () => {
              router.push({ pathname: '/select-level-mentor', params: { topicId } });
            },
          },
        ]);
      } else {
        // 師匠選択が不要な場合（最初のユーザーなど）
        Alert.alert('参加完了', 'トピックに参加しました', [
          {
            text: 'OK',
            onPress: () => {
              router.replace('/');
            },
          },
        ]);
      }
    } catch (error: any) {
      const errorMessage = error.message || '参加に失敗しました';
      Alert.alert('エラー', errorMessage);
    }
  };

  // トピック作成モーダルを開く
  const openCreateModal = () => {
    setShowCreateModal(true);
  };

  // 弟子定員を更新
  const handleUpdateCapacity = async (topicId: string, newCapacity: number) => {
    try {
      await updateMenteeCapacity(topicId, newCapacity);
      Alert.alert('更新完了', `弟子定員を${newCapacity}人に設定しました`);
      fetchMyTopics(); // トピック一覧を再取得
    } catch (error: any) {
      // エラーメッセージを分かりやすく表示
      let errorMessage = '弟子定員の更新に失敗しました';
      if (error.message) {
        // バックエンドからのエラーメッセージをそのまま表示
        errorMessage = error.message;
      }
      Alert.alert('エラー', errorMessage);

      // エラー時は元の値に戻す
      const topic = myTopics.find(t => t.id === topicId);
      if (topic) {
        setCapacityInputs(prev => ({
          ...prev,
          [topicId]: topic.mentee_capacity.toString(),
        }));
      }
    }
  };

  // 弟子定員入力値の変更を処理
  const handleCapacityInputChange = (topicId: string, value: string) => {
    setCapacityInputs(prev => ({
      ...prev,
      [topicId]: value,
    }));
  };

  // 弟子定員入力完了時の処理
  const handleCapacityInputSubmit = (topicId: string) => {
    const value = capacityInputs[topicId];
    const numValue = parseInt(value);

    if (isNaN(numValue) || numValue < 1 || numValue > 100) {
      // 無効な値の場合は元の値に戻す
      const topic = myTopics.find(t => t.id === topicId);
      if (topic) {
        setCapacityInputs(prev => ({
          ...prev,
          [topicId]: topic.mentee_capacity.toString(),
        }));
      }
      Alert.alert('エラー', '弟子定員は1〜100の範囲で入力してください');
      return;
    }

    handleUpdateCapacity(topicId, numValue);
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
          <MixedFontText style={styles.manageTitle}>トピック管理</MixedFontText>
          <Button variant="secondary" size="sm" onPress={onBack}>
            戻る
          </Button>
        </View>

        {/* 新規トピック作成 */}

        <View style={styles.createSection}>
          <MixedFontText style={styles.sectionTitle}>新規トピック作成</MixedFontText>
          <Button variant="primary" onPress={openCreateModal}>
            新規トピック作成
          </Button>
        </View>

        {/* トピック参加 */}
        <MixedFontText style={styles.sectionTitle}>参加可能なトピック</MixedFontText>
        <ScrollView style={styles.joinSection}>
          {availableTopics.length === 0 ? (
            <View style={styles.emptyTopicsContainer}>
              <MixedFontText style={styles.emptyTopicsText}>参加可能なトピックがありません</MixedFontText>
              <MixedFontText style={styles.emptyTopicsSubText}>
                新しいトピックを作成するか、他のユーザーがトピックを作成するまでお待ちください
              </MixedFontText>
            </View>
          ) : (
            availableTopics.map(topic => (
              <View key={topic.id} style={styles.availableTopicItem}>
                <View style={styles.availableTopicInfo}>
                  <MixedFontText style={styles.availableTopicTitle}>{topic.title}</MixedFontText>
                  <MixedFontText style={styles.availableTopicDescription}>{topic.description}</MixedFontText>
                </View>
                <Button variant="primary" size="sm" onPress={() => handleJoinTopic(topic.id)}>
                  参加
                </Button>
              </View>
            ))
          )}
        </ScrollView>

        {/* 参加中トピック一覧 */}
        <View style={styles.listSection}>
          <MixedFontText style={styles.sectionTitle}>参加中のトピック</MixedFontText>
          {myTopics.length === 0 ? (
            <View style={styles.emptyTopicsContainer}>
              <MixedFontText style={styles.emptyTopicsText}>参加しているトピックがありません</MixedFontText>
              <MixedFontText style={styles.emptyTopicsSubText}>トピックを作成してください</MixedFontText>
            </View>
          ) : (
            myTopics.map(topic => (
              <View key={topic.id} style={styles.topicItem}>
                <View style={styles.topicInfo}>
                  <MixedFontText style={styles.topicItemTitle}>{topic.title}</MixedFontText>
                  <MixedFontText style={styles.topicItemDescription}>{topic.description}</MixedFontText>
                  <View style={styles.capacitySection}>
                    <MixedFontText style={styles.capacityLabel}>弟子定員:</MixedFontText>
                    <View style={styles.capacityInputContainer}>
                      <TextInput
                        style={styles.capacityInput}
                        value={capacityInputs[topic.id] || topic.mentee_capacity.toString()}
                        keyboardType="numeric"
                        maxLength={3}
                        onChangeText={text => handleCapacityInputChange(topic.id, text)}
                        onBlur={() => handleCapacityInputSubmit(topic.id)}
                        onSubmitEditing={() => handleCapacityInputSubmit(topic.id)}
                      />
                      <MixedFontText style={styles.capacityUnit}>人</MixedFontText>
                    </View>
                  </View>
                </View>
                <Button variant="secondary" size="sm" onPress={() => handleLeaveTopic(topic.id)}>
                  抜ける
                </Button>
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
            <MixedFontText style={styles.modalTitle}>新規トピック作成</MixedFontText>
            <Button variant="secondary" size="sm" onPress={() => setShowCreateModal(false)}>
              閉じる
            </Button>
          </View>

          <View style={styles.modalContent}>
            <TextInput
              style={styles.input}
              placeholder="タイトル"
              value={newTopicTitle}
              onChangeText={setNewTopicTitle}
              maxLength={200}
            />
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="説明（任意）"
              value={newTopicDescription}
              onChangeText={setNewTopicDescription}
              multiline
              numberOfLines={3}
              maxLength={100}
            />
            <Button variant="primary" onPress={handleCreateTopic}>
              作成
            </Button>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: theme.remToPx(theme.typography.fontSize.lg),
    color: theme.colors.text.tertiary,
    
  },
  manageContainer: {
    flex: 1,
    paddingHorizontal: theme.remToPx(theme.spacing[8]), // xl
    paddingTop: theme.remToPx(theme.spacing[32]), // 6xl
    paddingBottom: theme.remToPx(theme.spacing[8]),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.remToPx(theme.spacing[12]), // 3xl
  },
  manageTitle: {
    fontSize: theme.remToPx(theme.typography.fontSize['2xl']),
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    
  },
  createSection: {
    marginBottom: theme.remToPx(theme.spacing[12]),
  },
  listSection: {
    marginBottom: theme.remToPx(theme.spacing[12]),
  },
  sectionTitle: {
    fontSize: theme.remToPx(theme.typography.fontSize.lg),
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.secondary,
    marginBottom: theme.remToPx(theme.spacing[6]) - 1,
    
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.remToPx(theme.spacing[4]), // md
    paddingVertical: theme.remToPx(theme.spacing[4]) - 2,
    fontSize: theme.remToPx(theme.typography.fontSize.base),
    marginBottom: theme.remToPx(theme.spacing[4]) - 2,
    backgroundColor: theme.colors.background.primary,
    color: theme.colors.text.primary,
    
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  topicItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.borderRadius.md,
    padding: theme.remToPx(theme.spacing[6]) - 1,
    marginBottom: theme.remToPx(theme.spacing[4]) - 2,
  },
  topicInfo: {
    flex: 1,
  },
  topicItemTitle: {
    fontSize: theme.remToPx(theme.typography.fontSize.base),
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.remToPx(theme.spacing[2]), // xs
    
  },
  topicItemDescription: {
    fontSize: theme.remToPx(theme.typography.fontSize.base),
    color: theme.colors.text.tertiary,
    
  },
  emptyTopicsContainer: {
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.borderRadius.md,
    padding: theme.remToPx(theme.spacing[8]),
    alignItems: 'center',
  },
  emptyTopicsText: {
    fontSize: theme.remToPx(theme.typography.fontSize.base),
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.tertiary,
    marginBottom: theme.remToPx(theme.spacing[3]),
    textAlign: 'center',
    
  },
  emptyTopicsSubText: {
    fontSize: theme.remToPx(theme.typography.fontSize.base),
    color: theme.colors.text.placeholder,
    textAlign: 'center',
    lineHeight: theme.remToPx(theme.typography.lineHeight.tight),
    
  },
  joinSection: {
    marginBottom: theme.remToPx(theme.spacing[12]),
  },
  modalContainer: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.remToPx(theme.spacing[6]),
    paddingTop: theme.remToPx(theme.spacing[6]),
    paddingBottom: theme.remToPx(theme.spacing[8]),
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.background.tertiary,
  },
  modalTitle: {
    fontSize: theme.remToPx(theme.typography.fontSize.xl),
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: theme.remToPx(theme.spacing[8]),
    paddingTop: theme.remToPx(theme.spacing[8]),
  },
  availableTopicItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.borderRadius.md,
    padding: theme.remToPx(theme.spacing[6]) - 1,
    marginBottom: theme.remToPx(theme.spacing[4]) - 2,
  },
  availableTopicInfo: {
    flex: 1,
  },
  availableTopicTitle: {
    fontSize: theme.remToPx(theme.typography.fontSize.base),
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.remToPx(theme.spacing[2]),
    
  },
  availableTopicDescription: {
    fontSize: theme.remToPx(theme.typography.fontSize.base),
    color: theme.colors.text.tertiary,
    
  },
  capacitySection: {
    marginTop: theme.remToPx(theme.spacing[2]),
    flexDirection: 'row',
    alignItems: 'center',
  },
  capacityLabel: {
    fontSize: theme.remToPx(theme.typography.fontSize.xs),
    color: theme.colors.text.tertiary,
    marginRight: theme.remToPx(theme.spacing[2]),
  },
  capacityInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  capacityInput: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.remToPx(theme.borderRadius.sm),
    paddingHorizontal: theme.remToPx(theme.spacing[2]),
    paddingVertical: theme.remToPx(theme.spacing[1]),
    fontSize: theme.remToPx(theme.typography.fontSize.xs),
    color: theme.colors.text.primary,
    backgroundColor: theme.colors.background.primary,
    minWidth: 40,
    textAlign: 'center',
  },
  capacityUnit: {
    fontSize: theme.remToPx(theme.typography.fontSize.xs),
    color: theme.colors.text.tertiary,
    marginLeft: theme.remToPx(theme.spacing[1]),
  },
});
