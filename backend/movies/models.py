from django.db import models
from django.conf import settings


# ========== Genre 모델 ==========
class Genre(models.Model):
    """TMDB 장르 모델 — id는 TMDB 장르 ID를 직접 사용"""
    id = models.IntegerField(primary_key=True)
    name = models.CharField(max_length=50)

    class Meta:
        ordering = ['id']

    def __str__(self):
        return self.name


# ========== Movie 모델 ==========
class Movie(models.Model):
    """영화 모델 — movie_info.json 데이터 기반"""
    movie_id = models.CharField(max_length=20, unique=True, db_index=True)
    title = models.CharField(max_length=200)
    youtube_key = models.CharField(max_length=50, blank=True)
    embed_url = models.URLField(max_length=500, blank=True)
    release_date = models.DateField(null=True, blank=True)

    # ---- 장르 (양방향 참조: movie.genres.all() / genre.movies.all()) ----
    genres = models.ManyToManyField(Genre, related_name='movies', blank=True)

    # ---- 평점 ----
    vote_average = models.FloatField(default=0)   # TMDB 평점
    star_rating = models.FloatField(default=0)     # 내부 별점
    review_average = models.FloatField(default=0) # 사용자 리뷰 평균 평점 (추가)

    # ---- 부가 정보 ----
    ott_providers = models.JSONField(default=list, blank=True)
    is_in_theaters = models.BooleanField(default=False)
    overview = models.TextField(blank=True)
    poster_path = models.URLField(max_length=500, blank=True)

    # ---- 전체 조회수 / 좋아요 수 (User 무관) ----
    view_count = models.PositiveIntegerField(default=0)
    like_count = models.PositiveIntegerField(default=0)

    # ---- 시간 ----
    updated_at = models.DateTimeField(auto_now=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['id']

    def __str__(self):
        return f"[{self.movie_id}] {self.title}"


# ========== Comment 모델 (쇼츠 댓글용) ==========
class Comment(models.Model):
    """쇼츠용 댓글 모델"""
    movie = models.ForeignKey(Movie, on_delete=models.CASCADE, related_name='comments')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username}: {self.content[:20]}"
