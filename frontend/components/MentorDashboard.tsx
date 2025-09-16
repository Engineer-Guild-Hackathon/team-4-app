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

const remToPx = (rem: string) => parseFloat(rem) * 16;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: remToPx(theme.spacing[6]), // lg
    paddingTop: remToPx(theme.spacing[24]), // 5xl
    paddingBottom: remToPx(theme.spacing[6]),
    backgroundColor: theme.colors.background.primary,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.background.tertiary,
  },
  closeButton: {
    marginRight: remToPx(theme.spacing[6]),
    padding: remToPx(theme.spacing[3]), // sm
  },
  closeButtonText: {
    fontSize: remToPx(theme.typography.fontSize.lg),
    color: theme.colors.primary[300],
    fontWeight: theme.typography.fontWeight.bold,
  },
  title: {
    fontSize: remToPx(theme.typography.fontSize.xl),
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
  },
  content: {
    flex: 1,
    padding: remToPx(theme.spacing[6]),
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: remToPx(theme.typography.fontSize.base),
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
  requestCard: {
    backgroundColor: theme.colors.background.primary,
    borderRadius: remToPx(theme.borderRadius.lg),
    padding: remToPx(theme.spacing[6]),
    marginBottom: remToPx(theme.spacing[4]),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 4,
  },
  requestHeader: {
    marginBottom: remToPx(theme.spacing[3]),
  },
  userName: {
    fontSize: remToPx(theme.typography.fontSize.base),
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
  },
  username: {
    fontSize: remToPx(theme.typography.fontSize.base),
    color: theme.colors.text.secondary,
    marginTop: remToPx(theme.spacing[1]), // xxs
  },
  topicTitle: {
    fontSize: remToPx(theme.typography.fontSize.base),
    color: theme.colors.text.primary,
    marginBottom: remToPx(theme.spacing[2]), // xs
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  button: {
    flex: 1,
    paddingVertical: remToPx(theme.spacing[4]), // md
    paddingHorizontal: remToPx(theme.spacing[6]), // lg
    borderRadius: theme.borderRadius.md,
    marginHorizontal: remToPx(theme.spacing[2]), // xs
  },
  approveButton: {
    backgroundColor: theme.colors.semantic.success.main,
  },
  rejectButton: {
    backgroundColor: theme.colors.semantic.error.main,
  },
  approveButtonText: {
    color: theme.colors.text.inverse,
    textAlign: 'center',
    fontWeight: theme.typography.fontWeight.semibold,
  },
  rejectButtonText: {
    color: theme.colors.text.inverse,
    textAlign: 'center',
    fontWeight: theme.typography.fontWeight.semibold,
  },
  tabContainer: {
    flexDirection: 'row',
    marginBottom: remToPx(theme.spacing[6]),
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.borderRadius.md,
    padding: remToPx(theme.spacing[2]), // xs
  },
  tab: {
    flex: 1,
    paddingVertical: remToPx(theme.spacing[3]), // sm
    paddingHorizontal: remToPx(theme.spacing[6]), // lg
    borderRadius: remToPx(theme.borderRadius.sm),
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: theme.colors.background.primary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  tabText: {
    fontSize: remToPx(theme.typography.fontSize.base),
    fontWeight: theme.typography.fontWeight.regular,
    color: theme.colors.text.secondary,
  },
  activeTabText: {
    color: theme.colors.text.primary,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  menteeCard: {
    backgroundColor: theme.colors.background.primary,
    borderRadius: remToPx(theme.borderRadius.lg),
    padding: remToPx(theme.spacing[6]),
    marginBottom: remToPx(theme.spacing[4]),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 4,
  },
  menteeHeader: {
    marginBottom: remToPx(theme.spacing[3]),
  },
  menteeName: {
    fontSize: remToPx(theme.typography.fontSize.base),
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
  },
  menteeUsername: {
    fontSize: remToPx(theme.typography.fontSize.base),
    color: theme.colors.text.secondary,
    marginTop: remToPx(theme.spacing[1]),
  },
  menteeLevel: {
    fontSize: remToPx(theme.typography.fontSize.base),
    color: theme.colors.text.primary,
    marginBottom: remToPx(theme.spacing[2]),
  },
  menteeDate: {
    fontSize: remToPx(theme.typography.fontSize.sm),
    color: theme.colors.text.tertiary,
    marginBottom: remToPx(theme.spacing[4]),
  },
  menteeButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  menteeButton: {
    flex: 1,
    paddingVertical: remToPx(theme.spacing[4]) - 2,
    paddingHorizontal: remToPx(theme.spacing[6]),
    borderRadius: theme.borderRadius.md,
    marginHorizontal: remToPx(theme.spacing[2]),
  },
  graduateButton: {
    backgroundColor: theme.colors.semantic.success.main,
  },
  expelButton: {
    backgroundColor: theme.colors.semantic.error.main,
  },
  graduateButtonText: {
    color: theme.colors.text.inverse,
    textAlign: 'center',
    fontWeight: theme.typography.fontWeight.semibold,
    fontSize: remToPx(theme.typography.fontSize.base),
  },
  expelButtonText: {
    color: theme.colors.text.inverse,
    textAlign: 'center',
    fontWeight: theme.typography.fontWeight.semibold,
    fontSize: remToPx(theme.typography.fontSize.base),
  },
});
