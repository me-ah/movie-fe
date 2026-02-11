from rest_framework import views, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from drf_spectacular.utils import extend_schema
from movies.models import Movie
from .models import HomeCategory
from .serializers import (
    HomeMovieSerializer, 
    MainResponseSerializer, 
    SubResponseSerializer
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
        
        # 1. 고정 스페셜 카테고리 (3개)
        specials = HomeCategory.objects.filter(category_type='special').prefetch_related('movies')[:3]
        
        # 2. 나머지 일반/혼합 카테고리
        generals = HomeCategory.objects.filter(category_type='general').prefetch_related('movies')

        # 장르 한국어-영어 필드 매핑
        genre_map = {
            '액션': 'pref_action', '모험': 'pref_adventure', '애니메이션': 'pref_animation',
            '코미디': 'pref_comedy', '범죄': 'pref_crime', '다큐멘 터리': 'pref_documentary',
            '드라마': 'pref_drama', '가족': 'pref_family', '판타지': 'pref_fantasy',
            '역사': 'pref_history', '공포': 'pref_horror', '음악': 'pref_music',
            '미스터리': 'pref_mystery', '로맨스': 'pref_romance', 'SF': 'pref_science_fiction',
            'TV 영화': 'pref_tv_movie', '스릴러': 'pref_thriller', '전쟁': 'pref_war', '서부': 'pref_western'
        }

        # 3. 유저 취향에 따른 점수 계산 및 정렬
        category_list = []
        for cat in generals:
            user_score = 0
            if user.is_authenticated and cat.genre_key:
                genres = cat.genre_key.split('|')
                scores = []
                for g_name in genres:
                    field_name = genre_map.get(g_name)
                    if field_name:
                        scores.append(getattr(user, field_name, 0))
                
                # 평균 점수 계산
                user_score = sum(scores) / len(scores) if scores else 0
            
            category_list.append({
                "obj": cat,
                "user_score": user_score
            })

        # 점수 내림차순 정렬
        category_list.sort(key=lambda x: x['user_score'], reverse=True)

        # 4. 최종 결과 조립 (스페셜 3개 + 맞춤 27개 = 총 30개)
        final_sub = []
        
        # 스페셜 추가
        for s in specials:
            final_sub.append({
                "category_title": s.title,
                "movies": HomeMovieSerializer(s.movies.all(), many=True).data
            })

        # 맞춤 추가 (최대 27개)
        for item in category_list[:27]:
            cat = item['obj']
            final_sub.append({
                "category_title": cat.title,
                "movies": HomeMovieSerializer(cat.movies.all(), many=True).data
            })

        return Response({"sub": final_sub})
