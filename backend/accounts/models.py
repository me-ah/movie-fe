from django.db import models
from django.contrib.auth.models import AbstractUser
from django.db.models import F

class User(AbstractUser):
    LOGIN_TYPE_CHOICES = [
        ('email', 'Email'),
        ('kakao', 'Kakao'),
        ('google', 'Google'),
    ]
    login_type = models.CharField(max_length=10, choices=LOGIN_TYPE_CHOICES, default='email')
    
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
            
            # Mapping genre name to field name
            # Genre names in TMDB are like "Action", "Science Fiction"
            for genre in genres:
                field_name = f"pref_{genre.name.lower().replace(' ', '_')}"
                if hasattr(user, field_name):
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
