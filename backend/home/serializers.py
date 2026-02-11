from rest_framework import serializers
from movies.models import Movie
from home.models import HomeCategory
from drf_spectacular.utils import extend_schema_serializer, OpenApiExample

# Swagger 문서용 예시 데이터 (객체 형식으로 변경)
MOVIE_EXAMPLE = {
    "movie_id": 1,
    "movie_title": "영화 제목",
    "movie_poster": "https://example.com/poster.jpg",
    "movie_video": "https://youtube.com/embed/example"
}

class HomeMovieSerializer(serializers.Serializer):
    """
    실제 데이터 가공용 시리얼라이저
    영화 정보를 명확한 키값을 가진 객체 형식으로 반환
    """
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
    user = serializers.DictField(help_text="인증된 유저 정보")
    main = serializers.ListField(
        child=serializers.DictField(),
        help_text="고정 메인 영화 10개 (종합 점수순). {movie_id, movie_title, movie_poster, movie_video}"
    )

@extend_schema_serializer(
    examples=[
        OpenApiExample(
            'Sub Response Example',
            value={
                "sub": {
                    "지금 뜨는 콘텐츠": [MOVIE_EXAMPLE for _ in range(15)],
                    "인기 액션": [MOVIE_EXAMPLE for _ in range(15)],
                    "달달한 로맨스": [MOVIE_EXAMPLE for _ in range(15)]
                }
            },
            response_only=True,
        )
    ]
)
class SubResponseSerializer(serializers.Serializer):
    sub = serializers.DictField(
        child=serializers.ListField(child=serializers.DictField()),
        help_text="유저 취향 맞춤 카테고리 30개. { '카테고리명': [{movie_id, movie_title, ...}, ...] }"
    )
