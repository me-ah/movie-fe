from rest_framework import serializers
from movies.models import Movie
from home.models import HomeCategory

class HomeMovieSerializer(serializers.BaseSerializer):
    """
    [[id, title, poster_url, video_url], ...] 형식으로 변환
    """
    def to_representation(self, instance):
        return [
            instance.id,
            instance.title,
            instance.poster_path,
            instance.embed_url if instance.embed_url else instance.youtube_key
        ]

class HomeCategorySerializer(serializers.ModelSerializer):
    movies = HomeMovieSerializer(many=True)

    class Meta:
        model = HomeCategory
        fields = ['title', 'movies']
