import api from "@/lib/apiClient";

export type UpdateMePayload = {
	firstname: string;
	lastname: string;
	useremail: string;
};

export type BackendMyPageResponse = {
	userdata: {
		userid: string | number;
		username: string;
		useremail: string;
		firstname: string;
		lastname: string;
	};
	watchtime: string | number;
	usermylist: string | number;

	recordmovie?: Record<
		string,
		{ recordmovie_name?: string; recordmovie_poster?: string }
	>;

	mylistmovie?: Record<
		string,
		{ mylistmovie_name?: string; mylistmovie_poster?: string }
	>;
};

export async function getMyPage() {
<<<<<<< HEAD
 const res = await api.post<BackendMyPageResponse>("/accounts/mypage/", {
    userid: "userId",
  });  console.log(res.data)
  console.log("Gdgdgd")
  return res.data;
=======
	const res = await api.get<BackendMyPageResponse>("/api/accounts/mypage/");
	return res.data;
>>>>>>> 926bc2d (fix/build 및 lint)
}

export async function patchMe(payload: UpdateMePayload) {
<<<<<<< HEAD
  const res = await api.patch("/accounts/mypage/", payload);
  return res.data;
=======
	const res = await api.patch("/api/accounts/mypage/", payload);
	return res.data;
>>>>>>> 926bc2d (fix/build 및 lint)
}
