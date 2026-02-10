// src/api/admin.ts
import api from "@/lib/apiClient";

export type AdminReviewUser = {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  date_joined: string;
  followers_count: number;
  followings_count: number;
  is_staff: boolean;
  is_superuser: boolean;
};

export type AdminReviewItem = {
  id: number;
  title: string;
  movie_title: string;
  rank: number;
  content: string;
  created_at: string;
  updated_at: string;
  user: AdminReviewUser;
  like_users_count: number;
  comments_count: number;
};

export type AdminStats = {
  total_posts: number;
  total_users: number;
  total_comments: number;
  current_page_size: number;
};

export type AdminReviewListResponse = {
  count: number;
  next: string | null;
  previous: string | null;
  results: AdminReviewItem[];
  admin_stats: AdminStats;
};

export type AdminReviewListParams = {
  page?: number;
  page_size?: number;
  type?: string; 
  order?: "asc" | "desc";
};


export async function getAdminReviewList(params?: AdminReviewListParams) {
  const res = await api.get<AdminReviewListResponse>("/api/admin/review/list", {
    params,
  });
  return res.data;
}



export type AdminMovieItem = {
  id: number;

  title?: string;
  original_title?: string;
  overview?: string;
  poster_path?: string | null;
  backdrop_path?: string | null;

  release_date?: string; 
  year?: number;

  popularity?: number;
  vote_average?: number;
  vote_count?: number;

  genre?: string; 
  genres?: string[] | number[]; 

  [key: string]: unknown;
};

export type AdminMovieListResponse = {
  count: number;
  next: string | null;
  previous: string | null;
  results: AdminMovieItem[];


  admin_stats?: Record<string, unknown>;
};

export type AdminMovieListParams = {
  page?: number;
  search?: string;
  genre?: string;
  year?: number | string;
  min_rating?: number | string;
  type?: "popularity" | "vote_average" | "release_date" | "title";
  order?: "asc" | "desc";
};


export async function getAdminMovieList(params?: AdminMovieListParams) {
  const res = await api.get<AdminMovieListResponse>("/api/admin/movie/list", {
    params,
  });
  return res.data;
}





export type AdminUserItem = {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  date_joined: string; 
  followers_count: number;
  followings_count: number;


  [key: string]: unknown;
};

export type AdminUserListResponse = AdminUserItem[];


export async function getAdminUserList() {
  const res = await api.get<AdminUserListResponse>("/api/admin/user/list/");
  return res.data;
}
