import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, Modal } from 'react-native';
import { theme } from '@/styles/theme';
import { useAuth } from '@/hooks/useAuth';
import {
  getReceivedMentorRequests,
  approveMentorRequest,
  rejectMentorRequest,
  getMentees,
  expelMentee,
  graduateMentee,
} from '@/services/api/mentorship';

interface MentorRequest {
  id: number;
  from_user: {
    id: number;
    username: string;
    first_name: string;
    last_name: string;
  };
  topic: {
    id: string;
    title: string;
  };
  created_at: string;
  status: string;
}

interface Mentee {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  level: number;
  created_at: string;
}

interface MentorDashboardProps {
  visible: boolean;
  onClose: () => void;
  topicId?: string;
}

export default function MentorDashboard({ visible, onClose, topicId }: MentorDashboardProps) {
  const { accessToken } = useAuth();
  const [requests, setRequests] = useState<MentorRequest[]>([]);
  const [mentees, setMentees] = useState<Mentee[]>([]);
  const [activeTab, setActiveTab] = useState<'requests' | 'mentees'>('requests');

  const fetchRequests = async () => {
    try {
      const data = (await getReceivedMentorRequests()) as MentorRequest[];
      setRequests(data);
    } catch (error) {
      console.error('リクエスト取得エラー:', error);
      Alert.alert('エラー', 'リクエストの取得に失敗しました');
    }
  };

  const fetchMentees = async () => {
    if (!topicId) return;
    try {
      const data = (await getMentees(topicId)) as Mentee[];
      setMentees(data);
    } catch (error) {
      console.error('弟子一覧取得エラー:', error);
      Alert.alert('エラー', '弟子一覧の取得に失敗しました');
    }
  };

  useEffect(() => {
    if (accessToken && visible) {
      fetchRequests();
      if (topicId) {
        fetchMentees();
      }
    }
  }, [accessToken, visible, topicId]);

  const handleApprove = async (requestId: number, fromUserName: string) => {
    Alert.alert('承認確認', `${fromUserName}さんの師匠選択リクエストを承認しますか？`, [
      { text: 'キャンセル', style: 'cancel' },
      {
        text: '承認',
        onPress: async () => {
          try {
            await approveMentorRequest(requestId);
            Alert.alert('承認完了', '師匠選択リクエストを承認しました');
            fetchRequests(); // リストを更新
          } catch (error) {
            console.error('承認エラー:', error);
            Alert.alert('エラー', '承認に失敗しました');
          }
        },
      },
    ]);
  };

  const handleReject = async (requestId: number, fromUserName: string) => {
    Alert.alert('拒否確認', `${fromUserName}さんの師匠選択リクエストを拒否しますか？`, [
      { text: 'キャンセル', style: 'cancel' },
      {
        text: '拒否',
        style: 'destructive',
        onPress: async () => {
          try {
            await rejectMentorRequest(requestId);
            Alert.alert('拒否完了', '師匠選択リクエストを拒否しました');
            fetchRequests(); // リストを更新
          } catch (error) {
            console.error('拒否エラー:', error);
            Alert.alert('エラー', '拒否に失敗しました');
          }
        },
      },
    ]);
  };

  const handleExpelMentee = async (menteeId: number, menteeName: string) => {
    if (!topicId) return;

    Alert.alert(
      '破門確認',
      `${menteeName}さんを破門しますか？\n破門すると師弟関係が解消され、弟子のステータスが「破門済み」になります。`,
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '破門',
          style: 'destructive',
          onPress: async () => {
            try {
              await expelMentee(menteeId, topicId);
              Alert.alert('破門完了', '弟子を破門しました');
              fetchMentees(); // リストを更新
            } catch (error) {
              console.error('破門エラー:', error);
              Alert.alert('エラー', '破門に失敗しました');
            }
          },
        },
      ]
    );
  };

  const handleGraduateMentee = async (menteeId: number, menteeName: string) => {
    if (!topicId) return;

    Alert.alert(
      '卒業確認',
      `${menteeName}さんを卒業させますか？\n卒業すると師弟関係が解消され、弟子のレベルが上がります。`,
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '卒業',
          onPress: async () => {
            try {
              await graduateMentee(menteeId, topicId);
              Alert.alert('卒業完了', '弟子を卒業させました');
              fetchMentees(); // リストを更新
            } catch (error) {
              console.error('卒業エラー:', error);
              Alert.alert('エラー', '卒業に失敗しました');
            }
          },
        },
      ]
    );
  };

  const renderRequest = ({ item }: { item: MentorRequest }) => (
    <View style={styles.requestCard}>
      <View style={styles.requestHeader}>
        <Text style={styles.userName}>
          {item.from_user.first_name} {item.from_user.last_name}
        </Text>
        <Text style={styles.username}>@{item.from_user.username}</Text>
      </View>

      <Text style={styles.topicTitle}>トピック: {item.topic.title}</Text>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, styles.approveButton]}
          onPress={() => handleApprove(item.id, item.from_user.username)}
        >
          <Text style={styles.approveButtonText}>承認</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.rejectButton]}
          onPress={() => handleReject(item.id, item.from_user.username)}
        >
          <Text style={styles.rejectButtonText}>拒否</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderMentee = ({ item }: { item: Mentee }) => (
    <View style={styles.menteeCard}>
      <View style={styles.menteeHeader}>
        <Text style={styles.menteeName}>
          {item.first_name} {item.last_name}
        </Text>
        <Text style={styles.menteeUsername}>@{item.username}</Text>
      </View>

      <Text style={styles.menteeLevel}>レベル: {item.level}</Text>
      <Text style={styles.menteeDate}>
        入門日: {new Date(item.created_at).toLocaleDateString()}
      </Text>

      <View style={styles.menteeButtonContainer}>
        <TouchableOpacity
          style={[styles.menteeButton, styles.graduateButton]}
          onPress={() => handleGraduateMentee(item.id, item.username)}
        >
          <Text style={styles.graduateButtonText}>卒業</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.menteeButton, styles.expelButton]}
          onPress={() => handleExpelMentee(item.id, item.username)}
        >
          <Text style={styles.expelButtonText}>破門</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.title}>師匠ダッシュボード</Text>
        </View>

        <View style={styles.content}>
          {/* タブ切り替え */}
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'requests' && styles.activeTab]}
              onPress={() => setActiveTab('requests')}
            >
              <Text style={[styles.tabText, activeTab === 'requests' && styles.activeTabText]}>
                リクエスト ({requests.length})
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'mentees' && styles.activeTab]}
              onPress={() => setActiveTab('mentees')}
            >
              <Text style={[styles.tabText, activeTab === 'mentees' && styles.activeTabText]}>
                弟子 ({mentees.length})
              </Text>
            </TouchableOpacity>
          </View>

          {/* リクエストタブ */}
          {activeTab === 'requests' && (
            <>
              {requests.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>現在、師匠選択リクエストはありません</Text>
                </View>
              ) : (
                <FlatList
                  data={requests}
                  renderItem={renderRequest}
                  keyExtractor={item => item.id.toString()}
                  showsVerticalScrollIndicator={false}
                />
              )}
            </>
          )}

          {/* 弟子タブ */}
          {activeTab === 'mentees' && (
            <>
              {mentees.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>現在、弟子はいません</Text>
                </View>
              ) : (
                <FlatList
                  data={mentees}
                  renderItem={renderMentee}
                  keyExtractor={item => item.id.toString()}
                  showsVerticalScrollIndicator={false}
                />
              )}
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing['5xl'],
    paddingBottom: theme.spacing.lg,
    backgroundColor: theme.colors.white,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderLight,
  },
  closeButton: {
    marginRight: theme.spacing.lg,
    padding: theme.spacing.sm,
  },
  closeButtonText: {
    fontSize: theme.typography.fontSizes.lg,
    color: theme.colors.primary,
    fontWeight: theme.typography.fontWeights.bold,
  },
  title: {
    fontSize: theme.typography.fontSizes.xl,
    fontWeight: theme.typography.fontWeights.bold,
    color: theme.colors.textPrimary,
  },
  content: {
    flex: 1,
    padding: theme.spacing.lg,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: theme.typography.fontSizes.base,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  requestCard: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.layout.radius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    ...theme.shadows.md,
  },
  requestHeader: {
    marginBottom: theme.spacing.sm,
  },
  userName: {
    fontSize: theme.typography.fontSizes.base,
    fontWeight: theme.typography.fontWeights.semibold,
    color: theme.colors.textPrimary,
  },
  username: {
    fontSize: theme.typography.fontSizes.md,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xxs,
  },
  topicTitle: {
    fontSize: theme.typography.fontSizes.md,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.xs,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  button: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.layout.radius.md,
    marginHorizontal: theme.spacing.xs,
  },
  approveButton: {
    backgroundColor: theme.colors.success,
  },
  rejectButton: {
    backgroundColor: theme.colors.danger,
  },
  approveButtonText: {
    color: theme.colors.white,
    textAlign: 'center',
    fontWeight: theme.typography.fontWeights.semibold,
  },
  rejectButtonText: {
    color: theme.colors.white,
    textAlign: 'center',
    fontWeight: theme.typography.fontWeights.semibold,
  },
  // タブ関連のスタイル
  tabContainer: {
    flexDirection: 'row',
    marginBottom: theme.spacing.lg,
    backgroundColor: theme.colors.backgroundLight,
    borderRadius: theme.layout.radius.md,
    padding: theme.spacing.xs,
  },
  tab: {
    flex: 1,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.layout.radius.sm,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: theme.colors.white,
    ...theme.shadows.sm,
  },
  tabText: {
    fontSize: theme.typography.fontSizes.md,
    fontWeight: theme.typography.fontWeights.medium,
    color: theme.colors.textSecondary,
  },
  activeTabText: {
    color: theme.colors.textPrimary,
    fontWeight: theme.typography.fontWeights.semibold,
  },
  // 弟子関連のスタイル
  menteeCard: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.layout.radius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    ...theme.shadows.md,
  },
  menteeHeader: {
    marginBottom: theme.spacing.sm,
  },
  menteeName: {
    fontSize: theme.typography.fontSizes.base,
    fontWeight: theme.typography.fontWeights.semibold,
    color: theme.colors.textPrimary,
  },
  menteeUsername: {
    fontSize: theme.typography.fontSizes.md,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xxs,
  },
  menteeLevel: {
    fontSize: theme.typography.fontSizes.md,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.xs,
  },
  menteeDate: {
    fontSize: theme.typography.fontSizes.sm,
    color: theme.colors.textTertiary,
    marginBottom: theme.spacing.md,
  },
  menteeButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  menteeButton: {
    flex: 1,
    paddingVertical: theme.spacing.md - 2,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.layout.radius.md,
    marginHorizontal: theme.spacing.xs,
  },
  graduateButton: {
    backgroundColor: theme.colors.success,
  },
  expelButton: {
    backgroundColor: theme.colors.danger,
  },
  graduateButtonText: {
    color: theme.colors.white,
    textAlign: 'center',
    fontWeight: theme.typography.fontWeights.semibold,
    fontSize: theme.typography.fontSizes.md,
  },
  expelButtonText: {
    color: theme.colors.white,
    textAlign: 'center',
    fontWeight: theme.typography.fontWeights.semibold,
    fontSize: theme.typography.fontSizes.md,
  },
});
