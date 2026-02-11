from rest_framework import serializers
from .models import Review, ReviewComment


# ========== 유저 정보 (간략) ==========
class ReviewUserSerializer(serializers.Serializer):
    """리뷰/댓글에 포함되는 유저 정보"""
    id = serializers.IntegerField()
    username = serializers.CharField()


# ========== 리뷰 댓글 ==========
class ReviewCommentSerializer(serializers.ModelSerializer):
    """리뷰 댓글 시리얼라이저"""
    user = ReviewUserSerializer(read_only=True)

    class Meta:
        model = ReviewComment
        fields = ['id', 'content', 'user', 'review', 'created_at']
        read_only_fields = ['id', 'user', 'review', 'created_at']


# ========== 리뷰 목록용 (comments 제외) ==========
class ReviewListSerializer(serializers.ModelSerializer):
    """리뷰 목록 시리얼라이저"""
    user = ReviewUserSerializer(read_only=True)

    class Meta:
        model = Review
        fields = ['id', 'title', 'movie_title', 'rank', 'content', 'user', 'created_at', 'updated_at']


# ========== 리뷰 상세용 (comments 포함) ==========
class ReviewDetailSerializer(serializers.ModelSerializer):
    """리뷰 상세 시리얼라이저 — 댓글 포함"""
    user = ReviewUserSerializer(read_only=True)
    comments = ReviewCommentSerializer(many=True, read_only=True)

    class Meta:
        model = Review
        fields = ['id', 'title', 'movie_title', 'rank', 'content', 'user', 'comments', 'created_at', 'updated_at']
