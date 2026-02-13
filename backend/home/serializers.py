from rest_framework import serializers
from movies.models import Movie
from .models import HomeCategory, MovieReview
from drf_spectacular.utils import extend_schema_serializer, OpenApiExample

# --- 공통 및 예시 데이터 ---
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

# --- 상세 페이지 및 리뷰용 ---

class MovieMiniSerializer(serializers.Serializer):
    """추천 리스트용 요약 영화 정보"""
    def to_representation(self, instance):
        return {
            "id": instance.movie_id,
            "poster": instance.poster_path,
            "title": instance.title
        }

class ReviewSerializer(serializers.ModelSerializer):
    """리뷰 조회용 (아이디 + 이름 통합)"""
    author = serializers.ReadOnlyField(source='author.username')
    name = serializers.SerializerMethodField()
    createdAt = serializers.DateTimeField(source='created_at', format='%Y-%m-%dT%H:%M:%SZ')

    class Meta:
        model = MovieReview
        fields = ['id', 'author', 'name', 'rating', 'content', 'createdAt']

    def get_name(self, obj):
        full_name = f"{obj.author.first_name}{obj.author.last_name}".strip()
        return full_name if full_name else obj.author.username

class ReviewCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = MovieReview
        fields = ['rating', 'content']

class ReviewCreateRequestSerializer(serializers.Serializer):
    movie_id = serializers.CharField(help_text="영화의 고유 TMDB ID")
    rating = serializers.IntegerField(min_value=1, max_value=10)
    content = serializers.CharField()

class MovieDetailResponseSerializer(serializers.Serializer):
    trailer = serializers.URLField()
    title = serializers.CharField()
    rank = serializers.CharField()
    year = serializers.CharField()
    poster = serializers.URLField()
    runtime = serializers.CharField(allow_null=True)
    ott_list = serializers.ListField(child=serializers.CharField())
    is_liked = serializers.BooleanField(help_text="현재 유저의 좋아요 여부")
    MovieDetail = serializers.DictField()
    ReviewItem = ReviewSerializer(many=True)
    recommend_list = MovieMiniSerializer(many=True)

# --- 홈 메인/서브용 ---

class HomeMovieSerializer(serializers.Serializer):
    def to_representation(self, instance):
        return {
            "movie_id": instance.movie_id,
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
    user = serializers.DictField()
    main = serializers.ListField(child=serializers.DictField())

class CategoryResponseSerializer(serializers.Serializer):
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
    sub = serializers.ListField(child=CategoryResponseSerializer())
