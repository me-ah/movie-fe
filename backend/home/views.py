from rest_framework import views, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.shortcuts import get_object_or_404
from drf_spectacular.utils import extend_schema, OpenApiParameter
from movies.models import Movie
from .models import HomeCategory, MovieReview
from .serializers import (
    HomeMovieSerializer, 
    MainResponseSerializer, 
    SubResponseSerializer,
    MovieDetailResponseSerializer,
    MovieMiniSerializer,
    ReviewSerializer
)

class MainView(views.APIView):
    permission_classes = [AllowAny]
    serializer_class = MainResponseSerializer
    @extend_schema(responses={200: MainResponseSerializer})
    def get(self, request):
        movies = Movie.objects.all().order_by('-vote_average', '-view_count')[:10]
        user_data = {"userid": request.user.id, "username": request.user.username} if request.user.is_authenticated else {}
        return Response({"user": user_data, "main": HomeMovieSerializer(movies, many=True).data})

class SubView(views.APIView):
    permission_classes = [AllowAny]
    serializer_class = SubResponseSerializer
    @extend_schema(responses={200: SubResponseSerializer})
    def get(self, request):
        user = request.user
        specials = HomeCategory.objects.filter(category_type='special').prefetch_related('movies')[:3]
        generals = HomeCategory.objects.filter(category_type='general').prefetch_related('movies')
        genre_map = {
            '액션': 'pref_action', '모험': 'pref_adventure', '애니메이션': 'pref_animation',
            '코미디': 'pref_comedy', '범죄': 'pref_crime', '다큐멘 터리': 'pref_documentary',
            '드라마': 'pref_drama', '가족': 'pref_family', '판타지': 'pref_fantasy',
            '역사': 'pref_history', '공포': 'pref_horror', '음악': 'pref_music',
            '미스터리': 'pref_mystery', '로맨스': 'pref_romance', 'SF': 'pref_science_fiction',
            'TV 영화': 'pref_tv_movie', '스릴러': 'pref_thriller', '전쟁': 'pref_war', '서부': 'pref_western'
        }
        category_list = []
        for cat in generals:
            user_score = 0
            if user.is_authenticated and cat.genre_key:
                genres = cat.genre_key.split('|')
                scores = [getattr(user, genre_map.get(g, ''), 0) for g in genres if genre_map.get(g)]
                user_score = sum(scores) / len(scores) if scores else 0
            category_list.append({"obj": cat, "user_score": user_score})
        category_list.sort(key=lambda x: x['user_score'], reverse=True)
        final_sub = []
        for s in specials:
            final_sub.append({"category_title": s.title, "movies": HomeMovieSerializer(s.movies.all(), many=True).data})
        for item in category_list[:27]:
            cat = item['obj']
            final_sub.append({"category_title": cat.title, "movies": HomeMovieSerializer(cat.movies.all(), many=True).data})
        return Response({"sub": final_sub})

class MovieDetailView(views.APIView):
    """
    영화 상세 정보 API
    """
    permission_classes = [AllowAny]
    serializer_class = MovieDetailResponseSerializer

    @extend_schema(
        parameters=[OpenApiParameter("id", type=int, description="영화의 PK")],
        responses={200: MovieDetailResponseSerializer}
    )
    def get(self, request):
        movie_id = request.query_params.get('id')
        if not movie_id:
            return Response({"error": "Movie ID required"}, status=status.HTTP_400_BAD_REQUEST)
        
        movie = get_object_or_404(Movie, id=movie_id)
        
        # 1. 추천 리스트 (이 영화가 포함된 카테고리 중 하나를 활용)
        # 471개 카테고리 중 이 영화를 포함하는 가장 첫 번째 카테고리의 영화 10개를 가져옴
        related_category = HomeCategory.objects.filter(movies=movie).first()
        recommend_list = []
        if related_category:
            recommend_list = related_category.movies.exclude(id=movie.id)[:10]
        else:
            # 카테고리가 없는 경우 장르가 겹치는 영화 랜덤 추천
            recommend_list = Movie.objects.filter(genres__in=movie.genres.all()).exclude(id=movie.id).distinct()[:10]

        # 2. 리뷰 데이터
        reviews = movie.reviews.all()[:10]

        # 3. 응답 데이터 조립
        year = str(movie.release_date.year) if movie.release_date else "미상"
        
        response_data = {
            "trailer": movie.embed_url if movie.embed_url else movie.youtube_key,
            "title": movie.title,
            "rank": str(movie.vote_average),
            "year": year,
            "poster": movie.poster_path,
            "runtime": None, # 데이터 없음
            "ott_list": movie.ott_providers,
            "MovieDetail": {
                "overview": movie.overview,
                "director": None, # 데이터 없음
                "genres": [g.name for g in movie.genres.all()],
                "year": int(year) if year.isdigit() else 0
            },
            "ReviewItem": ReviewSerializer(reviews, many=True).data,
            "recommend_list": MovieMiniSerializer(recommend_list, many=True).data
        }

        return Response(response_data, status=status.HTTP_200_OK)