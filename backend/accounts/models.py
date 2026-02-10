from django.db import models
from django.contrib.auth.models import AbstractUser

class User(AbstractUser):
    LOGIN_TYPE_CHOICES = [
        ('email', 'Email'),
        ('kakao', 'Kakao'),
        ('google', 'Google'),
    ]
    login_type = models.CharField(max_length=10, choices=LOGIN_TYPE_CHOICES, default='email')
    
    # Genre Preferences
    pref_action = models.BooleanField(default=False)
    pref_adventure = models.BooleanField(default=False)
    pref_animation = models.BooleanField(default=False)
    pref_comedy = models.BooleanField(default=False)
    pref_crime = models.BooleanField(default=False)
    pref_documentary = models.BooleanField(default=False)
    pref_drama = models.BooleanField(default=False)
    pref_family = models.BooleanField(default=False)
    pref_fantasy = models.BooleanField(default=False)
    pref_history = models.BooleanField(default=False)
    pref_horror = models.BooleanField(default=False)
    pref_music = models.BooleanField(default=False)
    pref_mystery = models.BooleanField(default=False)
    pref_romance = models.BooleanField(default=False)
    pref_science_fiction = models.BooleanField(default=False)
    pref_tv_movie = models.BooleanField(default=False)
    pref_thriller = models.BooleanField(default=False)
    pref_war = models.BooleanField(default=False)
    pref_western = models.BooleanField(default=False)

    def __str__(self):
        return self.username