import React, { useState, useEffect } from 'react';
import { Link } from 'expo-router';
import { StyleSheet, View, Text, FlatList, Image, ActivityIndicator, Modal, Pressable } from 'react-native';
import { Video, ResizeMode } from 'expo-av';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL; // あなたのIPアドレスに要変更

interface PostListModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function PostListModal({ visible, onClose }: PostListModalProps) {
    const [posts, setPosts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (visible) {
            setLoading(true);
            fetchPosts();
        }
    }, [visible]);

    const fetchPosts = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/posts/`);
            if (!response.ok) throw new Error('APIからの応答がありません');
            const data = await response.json();
            setPosts(data);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };

    const renderPost = ({ item }: { item: any }) => (
        <View style={styles.post}>
            <Text style={styles.postContent}>{item.content}</Text>
            <View>
                {item.media.map((media: any, index: number) => {
                    const mediaUrl = `${API_BASE_URL}${media.file}`;
                    if (media.media_type === 'image') {
                        return <Image key={index} source={{ uri: mediaUrl }} style={styles.media} />;
                    } else if (media.media_type === 'video') {
                        return (
                            <Video 
                                key={index} 
                                source={{ uri: mediaUrl }} 
                                style={styles.media} 
                                useNativeControls 
                                // 2. 文字列からインポートした型に変更
                                resizeMode={ResizeMode.CONTAIN} 
                            />
                        );
                    }
                    return null;
                })}
            </View>
        </View>
    );

    let content;
    if (loading) {
        content = <ActivityIndicator size="large" style={styles.centered} />;
    } else if (error) {
        content = <Text style={styles.centered}>エラー: {error}</Text>;
    } else {
        content = <FlatList data={posts} renderItem={renderPost} keyExtractor={(item) => item.id.toString()} />;
    }

    return (
<Modal /* ... */ >
            <View style={styles.modalContainer}>
                <View style={styles.modalContent}>
                    {/* 2. ヘッダー部分を追加 */}
                    <View style={styles.header}>
                        <Text style={styles.modalTitle}>投稿一覧</Text>
                        
                        {/* 3. 「投稿する」ボタンを追加 */}
                        <Link href="/create-post" asChild>
                            <Pressable style={styles.createButton}>
                                <Text style={styles.createButtonText}>投稿する</Text>
                            </Pressable>
                        </Link>
                    </View>

                    {/* 投稿一覧の表示部分 */}
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
    // ... (前回のスタイルと同じ) ...
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    modalContainer: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0, 0, 0, 0.5)' },
    modalContent: { height: '80%', backgroundColor: 'white', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20 },
    modalTitle: { fontSize: 24, fontWeight: 'bold', marginBottom: 15 },
    closeButton: { backgroundColor: '#ccc', padding: 15, borderRadius: 8, alignItems: 'center', marginTop: 10 },
    closeButtonText: { fontSize: 16 },
    post: { paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#eee' },
    postContent: { fontSize: 16, marginBottom: 10 },
    media: { width: '100%', height: 200, marginTop: 5, marginBottom: 5, backgroundColor: '#f0f0f0' },
        header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
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
});
