import type { SubCategory } from "@/api/home";
import { MovieCarousel } from "./MovieCarousel";

type HomeCarouselSectionProps = {
	category: SubCategory;
	onMovieClick: (movieId: number | string) => void;
};

export function HomeCarouselSection({
	category,
	onMovieClick,
}: HomeCarouselSectionProps) {
	const movies = category.movies.map((movie) => ({
		id: movie.movie_id,
		imageUrl: movie.movie_poster,
		title: movie.movie_title,
	}));

	return (
		<MovieCarousel
			title={category.category_title}
			movies={movies}
			onMovieClick={onMovieClick}
		/>
	);
}
