from rest_framework import views, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.db.models import Case, When, Value, IntegerField
from movies.models import Movie
from .models import HomeCategory
from .serializers import HomeMovieSerializer, HomeCategorySerializer

class MainView(views.APIView):
    """
    고정 메인 10개 영화 API
    """
    permission_classes = [AllowAny]

    def get(self, request):
        # 종합 점수 기준 상위 10개 (평점 * 2 + 조회수 가중치)
        # 실제로는 더 복잡한 공식을 쓸 수 있지만 우선 기본 필드 활용
        movies = Movie.objects.all().order_by('-vote_average', '-view_count')[:10]
        
        user_data = {}
        if request.user.is_authenticated:
            user_data = {
                "userid": request.user.id,
                "username": request.user.username
            }

        return Response({
            "user": user_data,
            "main": HomeMovieSerializer(movies, many=True).data
        })

class SubView(views.APIView):
    """
    맞춤 카테고리 30개 API (3차원 오브젝트 리턴)
    """
    permission_classes = [AllowAny]

    def get(self, request):
        user = request.user
        categories = HomeCategory.objects.all().prefetch_related('movies')

        # 1. 유저 맞춤형 정렬 기준 설정
        if user.is_authenticated:
            # 유저의 pref_장르 필드들을 가져와 점수가 높은 순서대로 genre_key 리스트 생성
            genre_scores = []
            genre_fields = [f for f in user._meta.get_fields() if f.name.startswith('pref_')]
            for field in genre_fields:
                score = getattr(user, field.name, 0)
                genre_key = field.name.replace('pref_', '')
                genre_scores.append((genre_key, score))
            
            # 점수 높은 순으로 정렬
            genre_scores.sort(key=lambda x: x[1], reverse=True)
            top_genres = [gs[0] for gs in genre_scores if gs[1] > 0]

            # 카테고리 정렬: 유저 선호 장르가 genre_key와 일치하는 것을 우선순위로
            if top_genres:
                # Top 30개만 선택
                # 장르 매칭되는 카테고리들을 앞으로, 나머지를 뒤로
                preserved = Case(*[When(genre_key=pk, then=pos) for pos, pk in enumerate(top_genres)])
                categories = categories.order_by(preserved, '-base_score')[:30]
            else:
                categories = categories.order_by('-base_score')[:30]
        else:
            # 시청 기록 없는 경우 기본 점수순 30개
            categories = categories.order_by('-base_score')[:30]

        # 2. 3차원 오브젝트 응답 구조 생성 { "카테고리명": [[...], ...], ... }
        sub_data = {}
        for cat in categories:
            sub_data[cat.title] = HomeMovieSerializer(cat.movies.all(), many=True).data

        return Response({"sub": sub_data})
