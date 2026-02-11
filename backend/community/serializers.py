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


# ========== 좋아요 필드 Mixin ==========
class LikeFieldsMixin(serializers.Serializer):
    """like_users_count, is_liked 공통 필드"""
    like_users_count = serializers.SerializerMethodField()
    is_liked = serializers.SerializerMethodField()

    def get_like_users_count(self, obj):
        return obj.like_users.count()

    def get_is_liked(self, obj):
        request = self.context.get('request')
        if request and hasattr(request, 'user') and request.user.is_authenticated:
            return obj.like_users.filter(id=request.user.id).exists()
        return False


# ========== 리뷰 작성용 ==========
class CommunityReviewCreateSerializer(serializers.ModelSerializer):
    """리뷰 작성 시리얼라이저"""
    title = serializers.CharField(max_length=200)
    movie_title = serializers.CharField(max_length=200)
    rank = serializers.IntegerField()
    content = serializers.CharField()

    class Meta:
        model = Review
        fields = ['title', 'movie_title', 'rank', 'content']


# ========== 리뷰 수정용 ==========
class CommunityReviewUpdateSerializer(serializers.ModelSerializer):
    """리뷰 수정 시리얼라이저 (PATCH)"""
    title = serializers.CharField(required=False)
    movie_title = serializers.CharField(required=False)
    rank = serializers.IntegerField(required=False)
    content = serializers.CharField(required=False)

    class Meta:
        model = Review
        fields = ['title', 'movie_title', 'rank', 'content']


# ========== 리뷰 응답용 (작성/목록 공통) ==========
class ReviewListSerializer(LikeFieldsMixin, serializers.ModelSerializer):
    """리뷰 목록/작성 응답 시리얼라이저"""
    user = ReviewUserSerializer(read_only=True)

    class Meta:
        model = Review
        fields = ['id', 'title', 'movie_title', 'rank', 'content', 'user',
                  'like_users_count', 'is_liked', 'created_at', 'updated_at']


# ========== 리뷰 상세용 (comments 포함) ==========
class ReviewDetailSerializer(LikeFieldsMixin, serializers.ModelSerializer):
    """리뷰 상세 시리얼라이저 — 댓글 포함"""
    user = ReviewUserSerializer(read_only=True)
    comments = ReviewCommentSerializer(many=True, read_only=True)

    class Meta:
        model = Review
        fields = ['id', 'title', 'movie_title', 'rank', 'content', 'user',
                  'comments', 'like_users_count', 'is_liked', 'created_at', 'updated_at']
