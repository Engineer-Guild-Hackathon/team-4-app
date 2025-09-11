// hooks/useTreeData.ts
import { useState, useEffect } from 'react';
import { UserNode } from '../components/TreeViewer/treeUtils';
import { apiClient } from '../utils/apiClient';

export const useTreeData = () => {
  const [data, setData] = useState<UserNode[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient('/api/mentorship/tree/', { method: 'GET' })
      .then(res => {
        console.log('useTreeData: data received:', res);
        setData(res);
      })
      .finally(() => setLoading(false));
  }, []);

  return { data, loading };
};
