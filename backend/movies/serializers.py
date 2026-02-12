from rest_framework import serializers
from .models import Genre, Movie, Comment


# ========== Genre Serializer ==========
class GenreSerializer(serializers.ModelSerializer):
    class Meta:
        model = Genre
        fields = ['id', 'name']


# ========== Movie Shorts Serializer ==========
class MovieShortsSerializer(serializers.ModelSerializer):
    """Shorts API 응답용 Serializer"""
    genres = GenreSerializer(many=True, read_only=True)
    is_liked = serializers.SerializerMethodField()
    comment_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Movie
        fields = [
            'movie_id',
            'title',
            'youtube_key',
            'embed_url',
            'release_date',
            'genres',
            'vote_average',
            'star_rating',
            'ott_providers',
            'is_in_theaters',
            'overview',
            'poster_path',
            'view_count',
            'comment_count',
            'like_count',
            'is_liked',
        ]

    def get_is_liked(self, obj) -> bool:
        """로그인 유저: 좋아요 여부 조회 / 비로그인: False"""
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            from accounts.models import UserLikeList
            return UserLikeList.objects.filter(user=request.user, movie=obj).exists()
        return False

# 스웨거 문서용 래퍼
class ShortsResponseSerializer(serializers.Serializer):
    next_cursor = serializers.IntegerField(help_text="다음 페이지 조회를 위한 인덱스 커서 (로그인 유저는 0, 10, 20... 형식)")
    results = MovieShortsSerializer(many=True)

class ShortsDetailResponseSerializer(serializers.Serializer):
    current = MovieShortsSerializer()
    next_cursor = serializers.IntegerField()
    results = MovieShortsSerializer(many=True)


# ========== Comment Serializers ==========
class CommentCreateSerializer(serializers.Serializer):
    """댓글 작성 요청용"""
    content = serializers.CharField(max_length=1000)


class CommentResponseSerializer(serializers.ModelSerializer):
    """댓글 응답용"""
    comment_id = serializers.IntegerField(source='id')
    user_name = serializers.CharField(source='user.username')

    class Meta:
        model = Comment
        fields = ['comment_id', 'user_name', 'content', 'created_at']