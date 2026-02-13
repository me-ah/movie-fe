from django.db import models
from django.conf import settings


# ========== Review 모델 ==========
class Review(models.Model):
    """커뮤니티 리뷰 게시글"""
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='reviews'
    )
    title = models.CharField(max_length=200)           # 리뷰 제목
    movie_title = models.CharField(max_length=200)     # 영화 제목 (텍스트)
    rank = models.IntegerField()                        # 평점 (1~10)
    content = models.TextField()                        # 리뷰 본문
    like_users = models.ManyToManyField(                # 좋아요 누른 유저들
        settings.AUTH_USER_MODEL, related_name='liked_reviews', blank=True
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"[{self.movie_title}] {self.title}"


# ========== ReviewComment 모델 ==========
class ReviewComment(models.Model):
    """리뷰 댓글"""
    review = models.ForeignKey(
        Review, on_delete=models.CASCADE, related_name='comments'
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='review_comments'
    )
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f"{self.user.username}: {self.content[:20]}"
