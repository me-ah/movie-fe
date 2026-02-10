from django.db import models
from django.contrib.auth.models import AbstractUser

class User(AbstractUser):
    LOGIN_TYPE_CHOICES = [
        ('email', 'Email'),
        ('kakao', 'Kakao'),
        ('google', 'Google'),
    ]
    login_type = models.CharField(max_length=10, choices=LOGIN_TYPE_CHOICES, default='email')
    
    # Genre Preferences - Optional fields
    pref_action = models.BooleanField(default=False, null=True, blank=True)
    pref_adventure = models.BooleanField(default=False, null=True, blank=True)
    pref_animation = models.BooleanField(default=False, null=True, blank=True)
    pref_comedy = models.BooleanField(default=False, null=True, blank=True)
    pref_crime = models.BooleanField(default=False, null=True, blank=True)
    pref_documentary = models.BooleanField(default=False, null=True, blank=True)
    pref_drama = models.BooleanField(default=False, null=True, blank=True)
    pref_family = models.BooleanField(default=False, null=True, blank=True)
    pref_fantasy = models.BooleanField(default=False, null=True, blank=True)
    pref_history = models.BooleanField(default=False, null=True, blank=True)
    pref_horror = models.BooleanField(default=False, null=True, blank=True)
    pref_music = models.BooleanField(default=False, null=True, blank=True)
    pref_mystery = models.BooleanField(default=False, null=True, blank=True)
    pref_romance = models.BooleanField(default=False, null=True, blank=True)
    pref_science_fiction = models.BooleanField(default=False, null=True, blank=True)
    pref_tv_movie = models.BooleanField(default=False, null=True, blank=True)
    pref_thriller = models.BooleanField(default=False, null=True, blank=True)
    pref_war = models.BooleanField(default=False, null=True, blank=True)
    pref_western = models.BooleanField(default=False, null=True, blank=True)

    def __str__(self):
        return self.username
