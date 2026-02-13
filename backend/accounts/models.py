from django.db import models
from django.contrib.auth.models import AbstractUser
from django.db.models import F


# ========== 장르 ID → pref 필드 매핑 딕셔너리 ==========
GENRE_ID_TO_PREF_FIELD = {
    28: 'pref_action',
    12: 'pref_adventure',
    16: 'pref_animation',
    35: 'pref_comedy',
    80: 'pref_crime',
    99: 'pref_documentary',
    18: 'pref_drama',
    10751: 'pref_family',
    14: 'pref_fantasy',
    36: 'pref_history',
    27: 'pref_horror',
    10402: 'pref_music',
    9648: 'pref_mystery',
    10749: 'pref_romance',
    878: 'pref_science_fiction',
    10770: 'pref_tv_movie',
    53: 'pref_thriller',
    10752: 'pref_war',
    37: 'pref_western',
}

class User(AbstractUser):
    LOGIN_TYPE_CHOICES = [
        ('email', 'Email'),
        ('kakao', 'Kakao'),
        ('google', 'Google'),
    ]
    login_type = models.CharField(max_length=10, choices=LOGIN_TYPE_CHOICES, default='email')
    
    # Onboarding Completion Status
    is_onboarding_completed = models.BooleanField(default=False)
    
    # Genre Preferences - Integer fields (Default 0)
    # These will store accumulated watch time (seconds) per genre
    pref_action = models.IntegerField(default=0, null=True, blank=True)
    pref_adventure = models.IntegerField(default=0, null=True, blank=True)
    pref_animation = models.IntegerField(default=0, null=True, blank=True)
    pref_comedy = models.IntegerField(default=0, null=True, blank=True)
    pref_crime = models.IntegerField(default=0, null=True, blank=True)
    pref_documentary = models.IntegerField(default=0, null=True, blank=True)
    pref_drama = models.IntegerField(default=0, null=True, blank=True)
    pref_family = models.IntegerField(default=0, null=True, blank=True)
    pref_fantasy = models.IntegerField(default=0, null=True, blank=True)
    pref_history = models.IntegerField(default=0, null=True, blank=True)
    pref_horror = models.IntegerField(default=0, null=True, blank=True)
    pref_music = models.IntegerField(default=0, null=True, blank=True)
    pref_mystery = models.IntegerField(default=0, null=True, blank=True)
    pref_romance = models.IntegerField(default=0, null=True, blank=True)
    pref_science_fiction = models.IntegerField(default=0, null=True, blank=True)
    pref_tv_movie = models.IntegerField(default=0, null=True, blank=True)
    pref_thriller = models.IntegerField(default=0, null=True, blank=True)
    pref_war = models.IntegerField(default=0, null=True, blank=True)
    pref_western = models.IntegerField(default=0, null=True, blank=True)

    def __str__(self):
        return self.username

class UserMovieHistory(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='watch_histories')
    movie = models.ForeignKey('movies.Movie', on_delete=models.CASCADE)
    watch_time = models.IntegerField(default=0) # Seconds
    watched_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-watched_at']

    def save(self, *args, **kwargs):
        is_new = self.pk is None
        super().save(*args, **kwargs)
        
        if is_new:
            # Update user's genre preferences
            user = self.user
            movie = self.movie
            genres = movie.genres.all()
            
            # 장르 ID → pref 필드 매핑 딕셔너리 사용 (한국어/영어 장르명 무관)
            for genre in genres:
                field_name = GENRE_ID_TO_PREF_FIELD.get(genre.id)
                if field_name:
                    setattr(user, field_name, F(field_name) + self.watch_time)
            user.save()

            # Limit to 500 records per user
            history_count = UserMovieHistory.objects.filter(user=user).count()
            if history_count > 500:
                oldest_histories = UserMovieHistory.objects.filter(user=user).order_by('watched_at')[:history_count - 500]
                UserMovieHistory.objects.filter(pk__in=oldest_histories).delete()

class UserMyList(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='my_lists')
    movie = models.ForeignKey('movies.Movie', on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'movie')


# ========== UserLikeList 모델 (좋아요) ==========
class UserLikeList(models.Model):
    """유저-영화 좋아요 관계 테이블 (UserMyList와 동일 패턴)"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='like_lists')
    movie = models.ForeignKey('movies.Movie', on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'movie')

