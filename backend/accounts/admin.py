from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User

class CustomUserAdmin(UserAdmin):
    # Admin 상세 페이지에서 장르 취향 필드를 그룹화하여 보여줍니다.
    fieldsets = UserAdmin.fieldsets + (
        ('Genre Preferences', {
            'fields': (
                'login_type', 'pref_action', 'pref_adventure', 'pref_animation', 
                'pref_comedy', 'pref_crime', 'pref_documentary', 'pref_drama', 
                'pref_family', 'pref_fantasy', 'pref_history', 'pref_horror', 
                'pref_music', 'pref_mystery', 'pref_romance', 'pref_science_fiction', 
                'pref_tv_movie', 'pref_thriller', 'pref_war', 'pref_western'
            ),
        }),
    )
    list_display = ('username', 'email', 'login_type', 'is_staff')
    list_filter = ('login_type', 'is_staff', 'is_superuser')

admin.site.register(User, CustomUserAdmin)