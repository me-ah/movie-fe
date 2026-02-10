from django.db import models
from django.contrib.auth.models import AbstractUser

class User(AbstractUser):
    LOGIN_TYPE_CHOICES = [
        ('email', 'Email'),
        ('kakao', 'Kakao'),
        ('google', 'Google'),
    ]
    login_type = models.CharField(max_length=10, choices=LOGIN_TYPE_CHOICES, default='email')
    
    # Genre Preferences - Integer fields (Default 0)
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