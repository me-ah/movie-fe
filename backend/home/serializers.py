from rest_framework import serializers
from movies.models import Movie
from .models import HomeCategory, MovieReview
from drf_spectacular.utils import extend_schema_serializer, OpenApiExample

# 영화 한 개의 기본 정보 (추천 리스트용)
class MovieMiniSerializer(serializers.Serializer):
    def to_representation(self, instance):
        return {
            "id": instance.id,
            "poster": instance.poster_path,
            "title": instance.title
        }

# 리뷰 시리얼라이저
class ReviewSerializer(serializers.ModelSerializer):
    author = serializers.ReadOnlyField(source='author.username')
    createdAt = serializers.DateTimeField(source='created_at')

    class Meta:
        model = MovieReview
        fields = ['id', 'author', 'rating', 'content', 'createdAt']

# 상세 페이지 전체 응답 시리얼라이저
class MovieDetailResponseSerializer(serializers.Serializer):
    trailer = serializers.URLField()
    title = serializers.CharField()
    rank = serializers.CharField()
    year = serializers.CharField()
    poster = serializers.URLField()
    runtime = serializers.CharField(allow_null=True)
    ott_list = serializers.ListField(child=serializers.CharField())
    MovieDetail = serializers.DictField()
    ReviewItem = ReviewSerializer(many=True)
    recommend_list = MovieMiniSerializer(many=True)

# --- 기존 시리얼라이저들 (HomeMovieSerializer, MainResponseSerializer 등) ---
class HomeMovieSerializer(serializers.Serializer):
    def to_representation(self, instance):
        return {
            "movie_id": instance.id,
            "movie_title": instance.title,
            "movie_poster": instance.poster_path,
            "movie_video": instance.embed_url if instance.embed_url else instance.youtube_key
        }

class MainResponseSerializer(serializers.Serializer):
    user = serializers.DictField()
    main = serializers.ListField(child=serializers.DictField())

class CategoryResponseSerializer(serializers.Serializer):
    category_title = serializers.CharField()
    movies = serializers.ListField(child=serializers.DictField())

class SubResponseSerializer(serializers.Serializer):
    sub = serializers.ListField(child=CategoryResponseSerializer())
