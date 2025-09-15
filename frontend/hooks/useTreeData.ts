import { getTopicTree } from '@/services/api/topic';
import { TreeUserNodeOut } from '@/types/topic';
import { useCallback, useEffect, useState } from 'react';

// topicIdを引数として受け取れるように変更
export const useTreeData = (topicId: string | null) => {
  const [data, setData] = useState<TreeUserNodeOut[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTreeData = useCallback(async () => {
    if (!topicId) {
      setLoading(false);
      setData([]);
      return;
    }

    try {
      setLoading(true);
      const response = await getTopicTree(topicId);
      setData(response.tree || []);
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('ツリーデータ取得エラー:', error.message);
      }
    } finally {
      setLoading(false);
    }
  }, [topicId]);

  useEffect(() => {
    fetchTreeData();
  }, [fetchTreeData]);

  return { data, loading, refresh: fetchTreeData };
};
