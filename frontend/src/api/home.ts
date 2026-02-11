import api from "@/lib/apiClient";

export type MainMovie = {
	movie_id: number;
	movie_title: string;
	movie_poster: string;
	movie_video: string;
};

export type HomeMainUser = {
	userid: number;
	username: string;
};

export type HomeMainResponse = {
	user: HomeMainUser;
	main: MainMovie[];
};

export type SubMovie = {
	movie_id: number;
	movie_title: string;
	movie_poster: string;
	movie_video: string;
};

export type SubCategory = {
	category_title: string;
	movies: SubMovie[];
};

export type HomeSubResponse = {
	sub: SubCategory[];
};

export async function getHomeMain() {
	const res = await api.get<HomeMainResponse>("/home/main/");
	return res.data;
}

export async function getHomeSub() {
	const res = await api.get<HomeSubResponse>("/home/sub/");
	return res.data;
}
