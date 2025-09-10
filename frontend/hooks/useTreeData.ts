// hooks/useTreeData.ts
import { useState, useEffect } from "react";
import { UserNode } from "../components/TreeViewer/treeUtils";
import { apiClient } from "../utils/apiClient";

export const useTreeData = () => {
  const [data, setData] = useState<UserNode[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient.get("/api/mentorship/tree/")
      .then(res => setData(res.data))
      .finally(() => setLoading(false));
  }, []);

  return { data, loading };
};
