import base64
import json

from django.shortcuts import get_object_or_404
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from drf_spectacular.utils import extend_schema

from .models import Movie
from .serializers import MovieShortsSerializer


# ========== Shorts API View ==========
class MovieShortsView(APIView):
    """
    GET /api/movies/shorts/
    커서 기반 페이지네이션으로 영화 쇼츠 목록을 반환합니다.

    Query Parameters:
        - cursor (str, optional): base64 인코딩된 마지막 영화 PK
        - page_size (int, optional): 페이지 크기 (기본값 10, 최대 50)
    """
    permission_classes = [AllowAny]
    serializer_class = MovieShortsSerializer

    @extend_schema(
        responses={200: MovieShortsSerializer(many=True)},
        description="영화 쇼츠 목록을 반환합니다."
    )
    def get(self, request):
        # ---- 페이지 크기 설정 ----
        page_size = min(int(request.query_params.get('page_size', 10)), 50)

        # ---- 커서 디코딩 ----
        cursor = request.query_params.get('cursor', None)
        last_id = 0
        if cursor:
            try:
                decoded = base64.b64decode(cursor).decode('utf-8')
                cursor_data = json.loads(decoded)
                last_id = cursor_data.get('id', 0)
            except (ValueError, KeyError):
                last_id = 0

        # ---- 쿼리: 커서 이후 데이터 조회 ----
        movies = Movie.objects.filter(
            id__gt=last_id
        ).prefetch_related('genres').order_by('id')[:page_size + 1]

        movies_list = list(movies)

        # ---- 다음 페이지 존재 여부 ----
        has_next = len(movies_list) > page_size
        if has_next:
            movies_list = movies_list[:page_size]

        # ---- 다음 커서 생성 ----
        next_cursor = None
        if has_next and movies_list:
            last_movie = movies_list[-1]
            cursor_data = json.dumps({'id': last_movie.id})
            next_cursor = base64.b64encode(
                cursor_data.encode('utf-8')
            ).decode('utf-8')

        # ---- 직렬화 및 응답 ----
        serializer = MovieShortsSerializer(movies_list, many=True)

        response_data = {
            'next_cursor': next_cursor,
            'results': serializer.data,
        }

        return Response(response_data)


# ========== Shorts Detail API View ==========
class MovieShortsDetailView(APIView):
    """
    GET /api/movies/shorts/{movie_id}/
    공유 링크를 통해 진입한 사용자에게 특정 영화의 상세 정보와
    해당 영화 이후의 쇼츠 목록을 함께 반환합니다.

    Path Parameters:
        - movie_id (str): 조회할 영화의 고유 ID (Movie.movie_id)

    Query Parameters:
        - page_size (int, optional): 이후 영화 목록 크기 (기본값 10, 최대 50)

    Response:
        - current: 해당 영화의 상세 정보
        - next_cursor: 다음 페이지 커서 (없으면 null)
        - results: 해당 영화 이후의 영화 목록
    """
    permission_classes = [AllowAny]

    def get(self, request, movie_id):
        # ---- 해당 movie_id 영화 조회 (없으면 404) ----
        movie = get_object_or_404(Movie, movie_id=movie_id)

        # ---- current: 해당 영화 직렬화 ----
        current = MovieShortsSerializer(movie).data

        # ---- 이후 영화 목록 조회 (PK 기준 오름차순) ----
        page_size = min(int(request.query_params.get('page_size', 10)), 50)
        next_movies = Movie.objects.filter(
            id__gt=movie.id
        ).prefetch_related('genres').order_by('id')[:page_size + 1]

        next_list = list(next_movies)

        # ---- 다음 페이지 존재 여부 ----
        has_next = len(next_list) > page_size
        if has_next:
            next_list = next_list[:page_size]

        # ---- 다음 커서 생성 ----
        next_cursor = None
        if has_next and next_list:
            cursor_data = json.dumps({'id': next_list[-1].id})
            next_cursor = base64.b64encode(
                cursor_data.encode('utf-8')
            ).decode('utf-8')

        # ---- 응답 ----
        return Response({
            'current': current,
            'next_cursor': next_cursor,
            'results': MovieShortsSerializer(next_list, many=True).data,
        })
