from django.db import models
from movies.models import Movie
from django.conf import settings

class HomeCategory(models.Model):
    title = models.CharField(max_length=200)
    genre_key = models.CharField(max_length=255, blank=True, null=True, help_text="장르 이름들을 '|'로 연결 (예: 액션|코미디)")
    category_type = models.CharField(max_length=20, default='general', help_text="special 또는 general")
    movies = models.ManyToManyField(Movie, related_name='home_categories')
    base_score = models.FloatField(default=0)

    def __str__(self):
        return self.title

class MovieReview(models.Model):
    """영화 리뷰 모델 - home 앱에서 관리"""
    movie = models.ForeignKey(Movie, on_delete=models.CASCADE, related_name='reviews')
    author = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    rating = models.IntegerField(default=5)
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.author.username} - {self.movie.title} ({self.rating})"
