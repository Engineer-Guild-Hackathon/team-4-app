import { ThreadOut } from "@/types/thread";
import { authedApiClient } from "@/utils/authedApiClient";

export const getThreads = async (topicId?: string, userId?: number): Promise<ThreadOut[]> => {
    const res = await authedApiClient<ThreadOut[]>(`/api/threads?user_id=${userId}&topic_id=${topicId}`);
    return Array.isArray(res) ? res : [];
}