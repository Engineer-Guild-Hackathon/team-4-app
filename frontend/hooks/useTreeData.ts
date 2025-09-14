import { TreeOut, TreeUserNodeOut } from '@/types/topic';
import { authedApiClient } from '@/utils/apiClient';
import { useEffect, useState } from 'react';

// topicIdを引数として受け取れるように変更
export const useTreeData = (topicId: string | null) => {
  const [data, setData] = useState<TreeUserNodeOut[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTreeData = async () => {
      if (!topicId) {
        setLoading(false);
        setData([]);
        return;
      }

      try {
        setLoading(true);
        const response = await authedApiClient<TreeOut>(`/api/topics/${topicId}/tree/`);
        setData(response.tree || []);
      } catch (error: unknown) {
        if (error instanceof Error) {
          console.error('ツリーデータ取得エラー:', error.message);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchTreeData();
  }, [topicId]);

  return { data, loading };
};
