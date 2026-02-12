import { ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import { useEffect, useRef } from "react";

export type MovieItem = {
	id: number;
	imageUrl: string;
	title: string;
};

type MovieCarouselProps = {
	title: string;
	movies: MovieItem[];
	onMovieClick?: (movieId: number | string) => void;
};

export function MovieCarousel({
	title,
	movies,
	onMovieClick,
}: MovieCarouselProps) {
	const scrollContainerRef = useRef<HTMLDivElement>(null);

	const extendedMovies = [...movies, ...movies, ...movies];

	const scrollAmount = 300;

	useEffect(() => {
		if (movies.length === 0) return;
		if (scrollContainerRef.current) {
			const container = scrollContainerRef.current;
			const totalWidth = container.scrollWidth;
			const oneSetWidth = totalWidth / 3;

			container.scrollLeft = oneSetWidth;
		}
	}, [movies]);

	const onScroll = () => {
		if (!scrollContainerRef.current) return;
		const container = scrollContainerRef.current;
		const totalWidth = container.scrollWidth;
		const oneSetWidth = totalWidth / 3;

		if (container.scrollLeft <= 0) {
			container.scrollLeft = oneSetWidth * 2 - container.clientWidth;
			container.scrollLeft = oneSetWidth + container.scrollLeft;
		} else if (container.scrollLeft >= 2 * oneSetWidth) {
			container.scrollLeft = container.scrollLeft - oneSetWidth;
		}
	};

	const moveScroll = (direction: "left" | "right") => {
		if (scrollContainerRef.current) {
			const container = scrollContainerRef.current;
			if (direction === "left") {
				container.scrollBy({ left: -scrollAmount, behavior: "smooth" });
			} else {
				container.scrollBy({ left: scrollAmount, behavior: "smooth" });
			}
		}
	};

	return (
		<section className="mb-10 relative group/section">
			<h2 className="text-xl font-semibold text-white mb-4 px-4 md:px-8">
				{title}
			</h2>

			<div className="relative">
				<button
					type="button"
					onClick={() => moveScroll("left")}
					className="absolute left-0 top-1/2 -translate-y-1/2 z-10 p-2 bg-black/50 hover:bg-black/80 text-white rounded-full opacity-0 group-hover/section:opacity-100 transition-opacity duration-300 ml-2"
					aria-label="Previous movies"
				>
					<ChevronLeft className="w-6 h-6" />
				</button>

				<div
					ref={scrollContainerRef}
					onScroll={onScroll}
					className="flex gap-4 overflow-x-auto px-4 md:px-8 pb-2 [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-track]:bg-black [&::-webkit-scrollbar-thumb]:bg-zinc-700 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-zinc-600"
				>
					{extendedMovies.map((movie, index) => (
						<button
							key={`${movie.id}-${index}`}
							type="button"
							onClick={() => onMovieClick?.(movie.id)}
							className="flex-shrink-0 w-40 group"
						>
							<div className="aspect-[2/3] rounded-lg overflow-hidden bg-white/10">
								<Image
									width={1000}
									height={1000}
									src={movie.imageUrl}
									alt={movie.title}
									className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
								/>
							</div>
							<p className="text-white text-sm mt-2 line-clamp-2 text-left group-hover:text-gray-300 transition-colors">
								{movie.title}
							</p>
						</button>
					))}
				</div>

				<button
					type="button"
					onClick={() => moveScroll("right")}
					className="absolute right-0 top-1/2 -translate-y-1/2 z-10 p-2 bg-black/50 hover:bg-black/80 text-white rounded-full opacity-0 group-hover/section:opacity-100 transition-opacity duration-300 mr-2"
					aria-label="Next movies"
				>
					<ChevronRight className="w-6 h-6" />
				</button>
			</div>
		</section>
	);
}
