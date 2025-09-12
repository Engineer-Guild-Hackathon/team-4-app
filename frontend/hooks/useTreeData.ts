import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { UserNode } from '../components/TreeViewer/treeUtils';

// topicIdを引数として受け取れるように変更
export const useTreeData = (topicId: string | null) => {
  const [data, setData] = useState<UserNode[]>([]);
  const [loading, setLoading] = useState(true);
  // authedApiの代わりに、accessTokenを直接取得する
  const { accessToken } = useAuth();

  useEffect(() => {
    const fetchTreeData = async () => {
      if (!topicId) {
        setLoading(false);
        setData([]);
        return;
      }

      try {
        setLoading(true);

        // --- ▼▼▼ authedApiを、手動でヘッダーを設定した`fetch`に置き換え ▼▼▼ ---
        const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL;
        const url = `${API_BASE_URL}/api/topics/${topicId}/tree/`;

        console.log(`デバッグ: ${url} にリクエストを送信します...`);

        const response = await fetch(url, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          // サーバーからエラーが返ってきた場合、その内容を読み取ってエラーとして投げる
          const errorText = await response.text();
          throw new Error(`APIサーバーからの応答エラー: ${response.status} - ${errorText}`);
        }

        const responseData = await response.json();
        setData(responseData.tree || []);
      } catch (error: any) {
        // --- ▼▼▼ エラーハンドリングを強化 ▼▼▼ ---
        console.error('ツリーデータの取得で予期せぬエラーが発生しました。');
        // 今度こそ、[TypeError: Network request failed] のような具体的なメッセージが表示されるはず
        console.error('--- エラーメッセージ ---');
        console.error(error.message);
        console.error('--- エラーオブジェクト全体 ---');
        console.error(error);
        setData([]);
      } finally {
        setLoading(false);
      }
    };

    if (accessToken) {
      fetchTreeData();
    } else {
      setLoading(false);
    }
  }, [topicId, accessToken]);

  return { data, loading };
};
