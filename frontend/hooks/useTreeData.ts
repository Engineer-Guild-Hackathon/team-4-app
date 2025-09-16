import { getTopicTree } from '@/services/api/topic';
import { TreeUserNodeOut } from '@/types/topic';
import { useCallback, useEffect, useState } from 'react';

export const useTreeData = (topicId: string | null) => {
  const [data, setData] = useState<TreeUserNodeOut[]>([]);
  const [loading, setLoading] = useState(true);
  const [max_level, setMaxLevel] = useState<number | null>(null); 
  const [min_level, setMinLevel] = useState<number | null>(null);

  useEffect(() => {
    const fetchTreeData = async () => {
      if (!topicId) {
        setLoading(false);
        setData([]);
        return;
      }
      try {
        setLoading(true);
        const response = await getTopicTree(topicId);
        setData(response.tree || []);
        setMaxLevel(response.max_level ?? null);
        setMinLevel(response.min_level ?? null);
      } catch (error: unknown) {
        if (error instanceof Error) {
          console.error('ツリーデータ取得エラー:', error.message);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchTreeData();
  }, [fetchTreeData]);

  return { data, loading, max_level, min_level };
};
