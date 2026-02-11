from rest_framework import views, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.shortcuts import get_object_or_404
from django.db.models import Avg, Case, When
from drf_spectacular.utils import extend_schema, OpenApiParameter
from movies.models import Movie
from .models import HomeCategory, MovieReview
from .serializers import (
    HomeMovieSerializer, 
    MainResponseSerializer, 
    SubResponseSerializer,
    MovieDetailResponseSerializer,
    MovieMiniSerializer,
    ReviewSerializer,
    ReviewCreateSerializer
)

def update_movie_review_average(movie):
    """영화의 평균 리뷰 점수를 갱신하는 헬퍼 함수"""
    avg_rating = movie.reviews.aggregate(Avg('rating'))['rating__avg']
    if avg_rating is not None:
        movie.review_average = round(avg_rating, 1)
    else:
        movie.review_average = movie.vote_average
    movie.save(update_fields=['review_average'])

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
    GET /api/home/detail/?id={movie_id}
    """
    permission_classes = [AllowAny]
    serializer_class = MovieDetailResponseSerializer

    @extend_schema(
        parameters=[OpenApiParameter("id", type=int, description="영화의 PK", required=True)],
        responses={200: MovieDetailResponseSerializer}
    )
    def get(self, request):
        movie_id = request.query_params.get('id')
        if not movie_id:
            return Response({"error": "Movie ID required (?id=...)"}, status=status.HTTP_400_BAD_REQUEST)
        
        movie = get_object_or_404(Movie, id=movie_id)
        
        movie_genres = sorted([genre.name for genre in movie.genres.all()])
        exact_genre_key = "|".join(movie_genres)
        related_category = HomeCategory.objects.filter(genre_key=exact_genre_key).first()
        if not related_category: related_category = HomeCategory.objects.filter(movies=movie).first()

        recommend_list = []
        if related_category:
            recommend_list = related_category.movies.exclude(id=movie.id).order_by('-vote_average')[:10]
        else:
            recommend_list = Movie.objects.filter(genres__in=movie.genres.all()).exclude(id=movie.id).distinct().order_by('-vote_average')[:10]

        year = str(movie.release_date.year) if movie.release_date else "미상"
        response_data = {
            "trailer": movie.embed_url if movie.embed_url else movie.youtube_key,
            "title": movie.title, "rank": str(movie.review_average), "year": year,
            "poster": movie.poster_path, "runtime": None, "ott_list": movie.ott_providers,
            "MovieDetail": {
                "overview": movie.overview, "director": None, "genres": movie_genres,
                "year": int(year) if year.isdigit() else 0
            },
            "ReviewItem": [], "recommend_list": MovieMiniSerializer(recommend_list, many=True).data
        }
        return Response(response_data, status=status.HTTP_200_OK)

class MovieReviewListView(views.APIView):
    """
    영화 리뷰 목록 조회 및 작성 API
    GET /api/home/review/?id={movie_id} (최신순 조회)
    POST /api/home/review/ (리뷰 작성)
    """
    def get_permissions(self):
        if self.request.method == 'GET': return [AllowAny()]
        return [IsAuthenticated()]

    @extend_schema(
        parameters=[OpenApiParameter("id", type=int, description="영화의 PK", required=True)],
        responses={200: ReviewSerializer(many=True)}
    )
    def get(self, request):
        movie_id = request.query_params.get('id')
        if not movie_id: return Response({"error": "Movie ID required (?id=...)"}, status=status.HTTP_400_BAD_REQUEST)
        movie = get_object_or_404(Movie, id=movie_id)
        reviews = movie.reviews.all().select_related('author').order_by('-created_at')
        return Response(ReviewSerializer(reviews, many=True).data)

    @extend_schema(
        request=ReviewCreateSerializer,
        responses={201: ReviewSerializer},
        description="Body에 id(영화PK)를 포함해야 합니다. 예: {'id': 1, 'rating': 9, 'content': '...'}"
    )
    def post(self, request):
        movie_id = request.data.get('id')
        if not movie_id: return Response({"error": "Movie id required in request body"}, status=status.HTTP_400_BAD_REQUEST)
        movie = get_object_or_404(Movie, id=movie_id)
        if MovieReview.objects.filter(movie=movie, author=request.user).exists():
            return Response({"error": "이미 리뷰를 작성하셨습니다."}, status=status.HTTP_400_BAD_REQUEST)
        serializer = ReviewCreateSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(author=request.user, movie=movie)
            update_movie_review_average(movie)
            return Response(ReviewSerializer(serializer.instance).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class MovieReviewDetailView(views.APIView):
    permission_classes = [IsAuthenticated]
    def put(self, request, review_id):
        review = get_object_or_404(MovieReview, id=review_id, author=request.user)
        serializer = ReviewCreateSerializer(review, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            update_movie_review_average(review.movie)
            return Response(ReviewSerializer(review).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    def delete(self, request, review_id):
        review = get_object_or_404(MovieReview, id=review_id, author=request.user)
        movie = review.movie
        review.delete()
        update_movie_review_average(movie)
        return Response({"message": "리뷰가 삭제되었습니다."}, status=status.HTTP_204_NO_CONTENT)