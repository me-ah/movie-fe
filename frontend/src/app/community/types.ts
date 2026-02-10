export type CommunityPost = {
  id: string;
  author: {
    name: string;
    handle: string;
    avatarUrl?: string | null;
  };
  movie?: {
    title: string;
    posterUrl?: string | null;
  };
  rating?: number; // 0~5
  content: string;
  createdAt: string; // ISO
  likeCount: number;
  commentCount: number;
};
