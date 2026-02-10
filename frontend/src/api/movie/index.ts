// src/api/movielist/index.ts

import { getMovieDetail } from "./getMovieDetail";
import { getMovieActors } from "./getMovieActors";
import { getMovieReviews } from "./getMovieReviews";

export const movieApi = {
  getMovieDetail,
  getMovieActors,
  getMovieReviews,
};
