from rest_framework import serializers
from movies.models import Movie
from .models import HomeCategory, MovieReview
from drf_spectacular.utils import extend_schema_serializer, OpenApiExample

# --- 공통 및 예시 데이터 ---
MOVIE_EXAMPLE = {
    "movie_id": 1,
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
    def to_representation(self, instance):
        return {
            "id": instance.id,
            "poster": instance.poster_path,
            "title": instance.title
        }

class ReviewSerializer(serializers.ModelSerializer):
    author = serializers.ReadOnlyField(source='author.username')
    createdAt = serializers.DateTimeField(source='created_at', format='%Y-%m-%dT%H:%M:%SZ')

    class Meta:
        model = MovieReview
        fields = ['id', 'author', 'rating', 'content', 'createdAt']

class ReviewCreateSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(required=False, help_text="리뷰를 작성할 영화의 PK (POST 요청 시 필수)")

    class Meta:
        model = MovieReview
        fields = ['id', 'rating', 'content']

class MovieDetailResponseSerializer(serializers.Serializer):
    trailer = serializers.URLField()
    title = serializers.CharField()
    rank = serializers.CharField()
    year = serializers.CharField()
    poster = serializers.URLField()
    runtime = serializers.CharField(allow_null=True)
    ott_list = serializers.ListField(child=serializers.CharField())
    MovieDetail = serializers.DictField()
    ReviewItem = serializers.ListField(child=serializers.JSONField(), help_text="리뷰 목록 (별도 API 조회를 위해 비어 있음)")
    recommend_list = MovieMiniSerializer(many=True)

# --- 홈 메인/서브용 ---

class HomeMovieSerializer(serializers.Serializer):
    def to_representation(self, instance):
        return {
            "movie_id": instance.id,
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
