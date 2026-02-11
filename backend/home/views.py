from rest_framework import views, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.db.models import Case, When, Value, IntegerField
from drf_spectacular.utils import extend_schema
from movies.models import Movie
from .models import HomeCategory
from .serializers import (
    HomeMovieSerializer, 
    MainResponseSerializer, 
    SubResponseSerializer
)

class MainView(views.APIView):
    """
    고정 메인 10개 영화 API
    """
    permission_classes = [AllowAny]
    serializer_class = MainResponseSerializer # Swagger용

    @extend_schema(responses={200: MainResponseSerializer})
    def get(self, request):
        # 종합 점수 기준 상위 10개
        movies = Movie.objects.all().order_by('-vote_average', '-view_count')[:10]
        
        user_data = {}
        if request.user.is_authenticated:
            user_data = {
                "userid": request.user.id,
                "username": request.user.username
            }

        response_data = {
            "user": user_data,
            "main": HomeMovieSerializer(movies, many=True).data
        }
        return Response(response_data)

class SubView(views.APIView):
    """
    맞춤 카테고리 30개 API (3차원 오브젝트 리턴)
    """
    permission_classes = [AllowAny]
    serializer_class = SubResponseSerializer # Swagger용

    @extend_schema(responses={200: SubResponseSerializer})
    def get(self, request):
        user = request.user
        categories = HomeCategory.objects.all().prefetch_related('movies')

        if user.is_authenticated:
            # 유저의 pref_장르 점수 분석
            genre_scores = []
            genre_fields = [f for f in user._meta.get_fields() if f.name.startswith('pref_')]
            for field in genre_fields:
                score = getattr(user, field.name, 0)
                genre_key = field.name.replace('pref_', '')
                genre_scores.append((genre_key, score))
            
            genre_scores.sort(key=lambda x: x[1], reverse=True)
            top_genres = [gs[0] for gs in genre_scores if gs[1] > 0]

            if top_genres:
                preserved = Case(*[When(genre_key=pk, then=pos) for pos, pk in enumerate(top_genres)])
                categories = categories.order_by(preserved, '-base_score')[:30]
            else:
                categories = categories.order_by('-base_score')[:30]
        else:
            categories = categories.order_by('-base_score')[:30]

        sub_data = {}
        for cat in categories:
            sub_data[cat.title] = HomeMovieSerializer(cat.movies.all(), many=True).data

        return Response({"sub": sub_data})