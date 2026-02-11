from django.db import models
from movies.models import Movie

class HomeCategory(models.Model):
    title = models.CharField(max_length=200)
    genre_key = models.CharField(max_length=255, blank=True, null=True, help_text="장르 이름들을 '|'로 연결 (예: 액션|코미디)")
    category_type = models.CharField(max_length=20, default='general', help_text="special 또는 general")
    movies = models.ManyToManyField(Movie, related_name='home_categories')
    base_score = models.FloatField(default=0)

    def __str__(self):
        return self.title