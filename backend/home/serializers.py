from rest_framework import serializers
from movies.models import Movie
from .models import HomeCategory, MovieReview
from drf_spectacular.utils import extend_schema_serializer, OpenApiExample

# --- 공통 및 예시 데이터 (스웨거 문서용) ---
MOVIE_EXAMPLE = {
    "movie_id": "tt123456",
    "movie_title": "인터스텔라",
    "movie_poster": "https://example.com/poster.jpg",
    "movie_video": "https://youtube.com/embed/example"
}

CATEGORY_EXAMPLE = {
    "category_title": "지금 뜨는 콘텐츠",
    "movies": [MOVIE_EXAMPLE for _ in range(15)]
}

# --- 상세 페이지용 ---

class MovieMiniSerializer(serializers.Serializer):
    """추천 리스트용 요약 영화 정보"""
    def to_representation(self, instance):
        return {
            "id": instance.movie_id, # PK 대신 TMDB ID 사용
            "poster": instance.poster_path,
            "title": instance.title
        }

class ReviewSerializer(serializers.ModelSerializer):
    """리뷰 조회용"""
    author = serializers.ReadOnlyField(source='author.username')
    createdAt = serializers.DateTimeField(source='created_at', format='%Y-%m-%dT%H:%M:%SZ')

    class Meta:
        model = MovieReview
        fields = ['id', 'author', 'rating', 'content', 'createdAt']

class ReviewCreateSerializer(serializers.ModelSerializer):
    """리뷰 작성/수정용"""
    class Meta:
        model = MovieReview
        fields = ['rating', 'content']

class MovieDetailResponseSerializer(serializers.Serializer):
    """영화 상세 페이지 전체 응답 구조"""
    trailer = serializers.URLField(help_text="유튜브 트레일러 URL")
    title = serializers.CharField(help_text="영화 제목")
    rank = serializers.CharField(help_text="사용자 리뷰 평균 평점")
    year = serializers.CharField(help_text="개봉 연도")
    poster = serializers.URLField(help_text="포스터 이미지 URL")
    runtime = serializers.CharField(allow_null=True, help_text="러닝타임 (현재 null)")
    ott_list = serializers.ListField(child=serializers.CharField(), help_text="제공 OTT 플랫폼 리스트")
    MovieDetail = serializers.DictField(help_text="상세 정보 객체 (줄거리, 감독, 장르 등)")
    ReviewItem = ReviewSerializer(many=True, help_text="사용자 리뷰 리스트 (최대 10개)")
    recommend_list = MovieMiniSerializer(many=True, help_text="장르 일치 기반 추천 영화 (최대 10개)")

# --- 홈 메인/서브용 ---

class HomeMovieSerializer(serializers.Serializer):
    """홈 화면 영화 카드 정보"""
    def to_representation(self, instance):
        return {
            "movie_id": instance.movie_id, # PK 대신 TMDB ID 사용
            "movie_title": instance.title,
            "movie_poster": instance.poster_path,
            "movie_video": instance.embed_url if instance.embed_url else instance.youtube_key
        }

@extend_schema_serializer(
    examples=[
        OpenApiExample(
            'Main Response Example',
            value={
                "user": {"userid": 1, "username": "kimssafy"},
                "main": [MOVIE_EXAMPLE for _ in range(10)]
            },
            response_only=True,
        )
    ]
)
class MainResponseSerializer(serializers.Serializer):
    """홈 메인 10개 영화 응답"""
    user = serializers.DictField(help_text="인증된 유저 정보")
    main = serializers.ListField(child=serializers.DictField(), help_text="메인 10개 영화 리스트")

class CategoryResponseSerializer(serializers.Serializer):
    """홈 서브 각 카테고리 레일 구조"""
    category_title = serializers.CharField()
    movies = serializers.ListField(child=serializers.DictField())

@extend_schema_serializer(
    examples=[
        OpenApiExample(
            'Sub Response Example',
            value={
                "sub": [CATEGORY_EXAMPLE for _ in range(30)]
            },
            response_only=True,
        )
    ]
)
class SubResponseSerializer(serializers.Serializer):
    """홈 서브 맞춤 30개 카테고리 응답"""
    sub = serializers.ListField(
        child=CategoryResponseSerializer(),
        help_text="유저 취향 맞춤 카테고리 30개 리스트"
    )
