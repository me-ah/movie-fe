from django.core.management.base import BaseCommand
from movies.models import Movie, Genre
from home.models import HomeCategory
from django.db.models import Count, Q, Avg
import itertools

class Command(BaseCommand):
    help = '실제 DB의 장르 조합을 분석하여 정교한 50개 이상의 카테고리를 생성합니다.'

    def handle(self, *args, **options):
        HomeCategory.objects.all().delete()
        self.stdout.write("기존 카테고리를 초기화했습니다.")

        # 1. 스페셜 카테고리 (항상 상위 3개 노출용)
        specials = [
            ("지금 뜨는 인기작", "special_trending", "-view_count", Q()),
            ("현재 상영 중인 영화", "special_theaters", "-view_count", Q(is_in_theaters=True)),
            ("최고 평점의 명작", "special_top_rated", "-vote_average", Q(vote_average__gte=7.5)),
        ]
        for title, key, order, filters in specials:
            cat = self.create_category(title, key, order, filters, 'special')

        # 2. 단일 장르 (19개)
        genres = Genre.objects.all()
        for genre in genres:
            self.create_category(
                f"인기 {genre.name}",
                genre.name, # 단일 장르명
                "-view_count",
                Q(genres=genre)
            )

        # 3. 혼합 장르 (실제 DB 조합 분석)
        # 영화들마다 가진 장르 조합을 추출
        all_movies = Movie.objects.prefetch_related('genres').all()
        genre_combinations = {}

        for movie in all_movies:
            movie_genres = sorted([g.name for g in movie.genres.all()])
            if len(movie_genres) >= 2:
                combo_key = "|".join(movie_genres)
                if combo_key not in genre_combinations:
                    genre_combinations[combo_key] = []
                genre_combinations[combo_key].append(movie.id)

        # 영화가 3개 이상인 조합만 카테고리화
        for combo_key, movie_ids in genre_combinations.items():
            genre_names = combo_key.split('|')
            title = f"{' '.join(genre_names)} 매니아를 위해"
            
            # 너무 긴 제목 방지
            if len(genre_names) > 3:
                title = f"{' '.join(genre_names[:3])} 외.."

            cat = HomeCategory.objects.create(
                title=title,
                genre_key=combo_key,
                category_type='general'
            )
            cat.movies.set(Movie.objects.filter(id__in=movie_ids).order_by('-vote_average')[:15])
            cat.save()

        count = HomeCategory.objects.count()
        self.stdout.write(self.style.SUCCESS(f'총 {count}개의 카테고리 분석 및 생성 완료!'))

    def create_category(self, title, key, order, filters, cat_type='general'):
        movies = Movie.objects.filter(filters).distinct()
        if movies.exists():
            cat = HomeCategory.objects.create(title=title, genre_key=key, category_type=cat_type)
            cat.movies.set(movies.order_by(order)[:15])
            cat.save()
            return cat
        return None