from django.db import models
from movies.models import Movie

class HomeCategory(models.Model):
    title = models.CharField(max_length=100)
    genre_key = models.CharField(max_length=50, blank=True, null=True, help_text="유저의 pref_... 장르 필드와 매칭되는 키 (예: action, comedy)")
    movies = models.ManyToManyField(Movie, related_name='home_categories')
    base_score = models.FloatField(default=0, help_text="이 카테고리 내 영화들의 평균 점수 (디폴트 정렬용)")

    def __str__(self):
        return self.title
