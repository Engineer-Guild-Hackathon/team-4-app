import { PostMediaOut, PostOut } from '@/types/post';
import { useEvent } from 'expo';
import { useVideoPlayer, VideoView } from 'expo-video';
import React from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  ImageStyle,
  Image,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { theme } from '@/styles/theme';
import ReportModal from './ReportModal';
import { Button } from '../Shared/Button';

interface PostViewProps {
  posts: PostOut[];
  loading: boolean;
  error: string | null;
  selfUserId?: number;
  onDelete: (postId: number) => void;
}

const remToPx = (rem: string) => parseFloat(rem) * 16;

const VideoItem = ({ uri, style }: { uri: string; style: ImageStyle }) => {
  const player = useVideoPlayer(uri, player => {
    player.loop = true;
    player.play();
  });

  useEvent(player, 'playingChange', { isPlaying: player.playing });

  return (
    <VideoView
      player={player}
      style={style}
      // allowsFullscreen
      // allowsPictureInPicture
    />
  );
};

export default function PostView({ posts, loading, error, selfUserId, onDelete }: PostViewProps) {
  const [showReportModal, setShowReportModal] = React.useState(false);
  const [reportTargetPost, setReportTargetPost] = React.useState<PostOut | null>(null);

  const handleOpenMenu = (post: PostOut) => {
    Alert.alert('投稿メニュー', '', [
      {
        text: 'ユーザーブロック（ダミー）',
        onPress: () => Alert.alert('ダミー', 'ユーザーブロック機能は未実装です'),
      },
      {
        text: 'ポスト報告',
        onPress: () => {
          setReportTargetPost(post);
          setShowReportModal(true);
        },
      },
      { text: 'キャンセル', style: 'cancel' },
    ]);
  };

  const renderPost = ({ item }: { item: PostOut }) => (
    <View style={styles.post}>
      <View style={{ position: 'absolute', top: 15, right: 0, flexDirection: 'row', zIndex: 2 }}>
        {Number(selfUserId) === Number(item.author?.id) ? (
          <Button
            variant="secondary"
            size="sm"
            onPress={() => onDelete(item.id)}
            style={styles.actionButton}
          >
            削除
          </Button>
        ) : (
          <Button
            variant="secondary"
            size="sm"
            onPress={() => handleOpenMenu(item)}
            style={styles.actionButton}
          >
            ⋮
          </Button>
        )}
      </View>
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

  if (loading) {
    return <ActivityIndicator size="large" style={styles.centered} />;
  }
  if (error) {
    return <Text style={styles.centered}>エラー: {error}</Text>;
  }
  if (posts.length === 0) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyText}>まだ投稿がありません。</Text>
      </View>
    );
  }
  return (
    <>
      <FlatList data={posts} renderItem={renderPost} keyExtractor={item => item.id.toString()} />
      {/* 報告モーダル（必要ならpropsでonSubmitを渡す） */}
      <ReportModal
        visible={showReportModal}
        onClose={() => {
          setShowReportModal(false);
          setReportTargetPost(null);
        }}
        onSubmit={async (reason: string) => {
          if (!reportTargetPost) return;
          const { reportPost } = await import('@/services/api/report');
          await reportPost(reportTargetPost.id, reason);
          setShowReportModal(false);
          setReportTargetPost(null);
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    color: theme.colors.text.tertiary,
    textAlign: 'center',
    marginTop: remToPx(theme.spacing[16]),
    fontFamily: 'Klee One',
    fontSize: remToPx(theme.typography.fontSize.base),
  },
  post: {
    paddingVertical: remToPx(theme.spacing[6]) - 1, // lg - 1px
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    backgroundColor: theme.colors.background.primary,
  },
  postContent: {
    fontSize: remToPx(theme.typography.fontSize.base),
    marginBottom: remToPx(theme.spacing[4]) - 2, // md - 2px
    color: theme.colors.text.primary,
    fontFamily: 'Klee One',
  },
  media: {
    width: '100%',
    height: 200,
    marginTop: remToPx(theme.spacing[2]) + 1, // xs + 1px
    marginBottom: remToPx(theme.spacing[2]) + 1,
    backgroundColor: theme.colors.background.secondary,
    borderRadius: remToPx(theme.borderRadius.md),
  },
  actionButton: {
    position: 'absolute',
    top: remToPx(theme.spacing[6]) - 1, // lg - 1px
    right: remToPx(theme.spacing[4]),
    zIndex: 1,
  },
});
