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
            'like_count',
            'is_liked',
        ]

    def get_is_liked(self, obj):
        """
        향후 User 모델 연동 시 변경 예정
        현재는 항상 False 반환
        """
        # TODO: request.user가 인증된 경우 좋아요 여부 확인 로직 추가
        return False


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

