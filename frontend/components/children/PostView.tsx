import { PostMediaOut, PostOut } from '@/types/post';
import { useEvent } from 'expo';
import { useVideoPlayer, VideoView } from 'expo-video';
import React from 'react';
import { theme } from '@/styles/theme';
import { ActivityIndicator, Alert, FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import ReportModal from './ReportModal';

interface PostViewProps {
  posts: PostOut[];
  loading: boolean;
  error: string | null;
  selfUserId?: number;
  onDelete: (postId: number) => void;
}

const remToPx = (rem: string) => parseFloat(rem) * 16;

const VideoItem = ({ uri, style }: { uri: string; style: any }) => {
  const player = useVideoPlayer(uri, player => {
    player.loop = true;
    player.play();
  });

  const { isPlaying } = useEvent(player, 'playingChange', { isPlaying: player.playing });

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
          <TouchableOpacity style={styles.deleteButton} onPress={() => onDelete(item.id)}>
            <Text style={styles.deleteButtonText}>削除</Text>
          </TouchableOpacity>
        ) : (
            <TouchableOpacity onPress={() => handleOpenMenu(item)} style={styles.menuButton}>
                <Text style={styles.menuButtonText}>⋮</Text>
            </TouchableOpacity>
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
    return <Text style={styles.centered}>まだ投稿がありません。</Text>;
  }
  return (
    <>
      <FlatList data={posts} renderItem={renderPost} keyExtractor={item => item.id.toString()} />
      {/* 報告モーダル（必要ならpropsでonSubmitを渡す） */}
      <ReportModal
        visible={showReportModal}
        onClose={() => { setShowReportModal(false); setReportTargetPost(null); }}
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
  post: {
    paddingVertical: remToPx(theme.spacing[6]) - 1, // lg - 1px
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderFaint,
  },
  postContent: {
    fontSize: remToPx(theme.typography.fontSize.base),
    marginBottom: remToPx(theme.spacing[4]) - 2, // md - 2px
    color: theme.colors.text.primary,
  },
  media: {
    width: '100%',
    height: 200,
    marginTop: remToPx(theme.spacing[2]) + 1, // xs + 1px
    marginBottom: remToPx(theme.spacing[2]) + 1,
    backgroundColor: theme.colors.background.secondary,
    borderRadius: remToPx(theme.borderRadius.md),
  },
  deleteButton: {
    position: 'absolute',
    top: remToPx(theme.spacing[6]) - 1, // lg - 1px
    right: 0,
    backgroundColor: theme.colors.semantic.error.main,
    paddingVertical: remToPx(theme.spacing[2]), // xs
    paddingHorizontal: remToPx(theme.spacing[4]) - 2, // md - 2px
    borderRadius: remToPx(theme.borderRadius.sm),
    zIndex: 1,
  },
  deleteButtonText: {
    color: theme.colors.text.inverse,
    fontSize: remToPx(theme.typography.fontSize.sm),
    fontWeight: theme.typography.fontWeight.bold,
  },
  menuButton: {
    backgroundColor: theme.colors.background.tertiary,
    borderRadius: remToPx(theme.borderRadius.xl),
    paddingVertical: remToPx(theme.spacing[1]), // xxs
    paddingHorizontal: remToPx(theme.spacing[3]), // sm
    marginRight: remToPx(theme.spacing[2]), // xs
  },
  menuButtonText: {
    color: theme.colors.text.secondary,
    fontSize: remToPx(theme.typography.fontSize.xl) + 2,
    fontWeight: theme.typography.fontWeight.bold,
  },
});
