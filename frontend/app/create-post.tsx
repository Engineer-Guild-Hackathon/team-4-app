import React from 'react';
import { View, Text, StyleSheet, TextInput, Button } from 'react-native';
import { useRouter } from 'expo-router';

export default function CreatePostScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>新規投稿</Text>

      {/* ここに本格的な投稿フォームが入る予定 */}
      <TextInput
        style={styles.input}
        placeholder="投稿内容..."
        multiline
      />
      
      <Button title="画像/動画を選択" onPress={() => { /* あとで実装 */ }} />
      
      <View style={{ marginVertical: 20 }} />
      
      <Button title="投稿する" onPress={() => {
        alert('投稿しました！（仮）');
        router.back(); // 投稿後に前の画面に戻る
      }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    borderRadius: 8,
    height: 150,
    textAlignVertical: 'top',
    marginBottom: 20,
  },
});