import { MixedFontText } from '@/components/Shared/MixedFontText';
import { theme } from '@/styles/theme';
import { PostMediaOut, PostOut } from '@/types/post';
import Fontisto from '@expo/vector-icons/Fontisto';
import { useEvent } from 'expo';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useVideoPlayer, VideoView } from 'expo-video';
import React from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  ImageStyle,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Button } from '../Shared/Button';
import ReportModal from './ReportModal';

interface PostViewProps {
  posts: PostOut[];
  loading: boolean;
  error: string | null;
  selfUserId?: number;
  topicId: string;
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

export default function PostView({
  posts,
  loading,
  error,
  selfUserId,
  onDelete,
  topicId,
}: PostViewProps) {
  const [showReportModal, setShowReportModal] = React.useState(false);
  const [reportTargetPost, setReportTargetPost] = React.useState<PostOut | null>(null);

  const router = useRouter();

  const handleOpenMenu = (post: PostOut) => {
    Alert.alert('気づきメニュー', '', [
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
      <View style={styles.postHeader}>
        <View style={styles.authorInfo}>
          <Image
            source={{
              uri:
                item.author?.avatar ||
                `https://placehold.co/80x80/e0e0e0/555555?text=${item.author?.username.charAt(0)}`,
              cacheKey: item.author?.avatar ? item.author.avatar.split('?')[0] : undefined,
            }}
            style={styles.authorAvatar}
          />
          <Text style={styles.authorUsername}>{item.author?.username}</Text>
        </View>
        {Number(selfUserId) === Number(item.author?.id) ? (
          <Button variant="secondary" size="sm" onPress={() => onDelete(item.id)}>
            削除
          </Button>
        ) : (
          <Button variant="secondary" size="sm" onPress={() => handleOpenMenu(item)}>
            ⋮
          </Button>
        )}
      </View>

      {item.media && item.media.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.mediaScrollView}
        >
          {item.media.map((media: PostMediaOut, index: number) => {
            const mediaUrl = media.file;
            const cacheKey = mediaUrl.split('?')[0];
            const mediaStyle =
              item.media.length > 1 ? styles.mediaItemMulti : styles.mediaItemSingle;

            if (media.media_type === 'image') {
              return (
                <Image
                  key={index}
                  source={{ uri: mediaUrl, cacheKey }}
                  style={mediaStyle}
                  contentFit="cover"
                />
              );
            } else if (media.media_type === 'video') {
              return <VideoItem key={index} uri={mediaUrl} style={mediaStyle} />;
            }
            return null;
          })}
        </ScrollView>
      )}
      <Text style={styles.postContent}>{item.content}</Text>
    </View>
  );

  if (loading) {
    return <ActivityIndicator size="large" style={styles.centered} />;
  }
  if (error) {
    return <MixedFontText style={styles.centered}>{`エラー: ${error}`}</MixedFontText>;
  }

  return (
    <View style={{ flex: 1 }}>
      <FlatList
        data={posts}
        renderItem={renderPost}
        keyExtractor={item => item.id.toString()}
        contentContainerStyle={{ flexGrow: 1 }}
        ListEmptyComponent={
          <View style={styles.centered}>
            <Text style={styles.emptyText}>まだ気づきがありません。</Text>
          </View>
        }
      />
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
      <Button
        variant="icon"
        style={styles.fab}
        textStyle={styles.fabText}
        onPress={() => router.push(`/create-post?topicId=${topicId}`)}
      >
        <Fontisto name="plus-a" size={24} color="#fff" />
      </Button>
    </View>
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
  fab: {
    backgroundColor: theme.colors.primary[500],
    position: 'absolute',
    right: remToPx(theme.spacing[8]),
    bottom: remToPx(theme.spacing[8]),
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    width: 56,
    height: 56,
  },
  fabText: {
    color: '#fff',
    fontSize: remToPx(theme.typography.fontSize['3xl']),
    lineHeight: remToPx(theme.typography.fontSize['3xl']),
  },
  mediaScrollView: {},
  mediaItemSingle: {
    width: remToPx('24rem'),
    height: 250,
    backgroundColor: theme.colors.background.secondary,
  },
  mediaItemMulti: {
    width: 250,
    height: 250,
    borderRadius: remToPx(theme.borderRadius.md),
    marginRight: remToPx(theme.spacing[2]),
    backgroundColor: theme.colors.background.secondary,
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: remToPx(theme.spacing[4]),
    paddingVertical: remToPx(theme.spacing[3]),
  },
  authorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  authorAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: remToPx(theme.spacing[3]),
    backgroundColor: theme.colors.background.secondary,
  },
  authorUsername: {
    fontSize: remToPx(theme.typography.fontSize.base),
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
    fontFamily: 'Klee One',
  },
});
