import base64
import json

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny

from .models import Movie
from .serializers import MovieShortsSerializer


# ========== Shorts API View ==========
class MovieShortsView(APIView):
    """
    GET /api/v1/movies/shorts/
    커서 기반 페이지네이션으로 영화 쇼츠 목록을 반환합니다.

    Query Parameters:
        - cursor (str, optional): base64 인코딩된 마지막 영화 PK
        - page_size (int, optional): 페이지 크기 (기본값 10, 최대 50)
    """
    permission_classes = [AllowAny]
    serializer_class = MovieShortsSerializer

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
