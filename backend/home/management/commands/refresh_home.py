from django.core.management.base import BaseCommand
from movies.models import Movie, Genre
from home.models import HomeCategory
from django.db.models import Count, F, Q

class Command(BaseCommand):
    help = '홈 화면의 50개 카테고리 데이터를 갱신합니다.'

    def handle(self, *args, **options):
        # 1. 기존 카테고리 데이터 초기화 (M2M 관계만 끊고 다시 설정)
        # HomeCategory.objects.all().delete() # 필요시 삭제 후 재생성

        # 장르 맵핑 (19개 장르)
        genres = Genre.objects.all()
        for genre in genres:
            category, _ = HomeCategory.objects.get_or_create(
                title=f"인기 {genre.name}",
                genre_key=genre.name.lower().replace(" ", "_")
            )
            # 해당 장르 영화 중 점수순 상위 15개
            top_movies = Movie.objects.filter(genres=genre).order_by('-vote_average', '-view_count')[:15]
            category.movies.set(top_movies)
            category.base_score = genre.id # 임시 점수
            category.save()

        # 2. 통계 기반 섹션 (6개)
        stats = [
            ("지금 뜨는 콘텐츠", "-view_count", None),
            ("최고 평점 명작", "-vote_average", None),
            ("새로 올라온 영화", "-release_date", None),
            ("좋아요 많은 영화", "-like_count", None),
            ("현재 상영작", "-view_count", "is_in_theaters"),
            ("다시 보기 좋은 영화", "?", None), # 랜덤
        ]
        for title, order, filter_key in stats:
            category, _ = HomeCategory.objects.get_or_create(title=title)
            queryset = Movie.objects.all()
            if filter_key:
                queryset = queryset.filter(**{filter_key: True})
            
            top_movies = queryset.order_by(order)[:15]
            category.movies.set(top_movies)
            category.save()

        # 3. 장르 조합 (남은 개수만큼 생성)
        # 예시: 액션+코미디, 드라마+로맨스 등 (필요에 따라 추가)
        combinations = [
            ("액션 코미디", ["Action", "Comedy"]),
            ("범죄 스릴러", ["Crime", "Thriller"]),
            ("로맨틱 판타지", ["Romance", "Fantasy"]),
            ("SF 액션", ["Science Fiction", "Action"]),
            ("음악 드라마", ["Music", "Drama"]),
        ]
        for title, genre_names in combinations:
            category, _ = HomeCategory.objects.get_or_create(title=title)
            queryset = Movie.objects.all()
            for g_name in genre_names:
                queryset = queryset.filter(genres__name=g_name)
            
            top_movies = queryset.order_by('-vote_average')[:15]
            category.movies.set(top_movies)
            category.save()

        self.stdout.write(self.style.SUCCESS('Successfully refreshed home categories'))
