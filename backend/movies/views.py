import base64
import json

from django.shortcuts import get_object_or_404
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework import status
from django.db.models import F
from drf_spectacular.utils import extend_schema

from .models import Movie, Comment
from .serializers import MovieShortsSerializer, CommentCreateSerializer, CommentResponseSerializer
from accounts.models import UserLikeList


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
        serializer = MovieShortsSerializer(movies_list, many=True, context={'request': request})

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
        current = MovieShortsSerializer(movie, context={'request': request}).data

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
            'results': MovieShortsSerializer(next_list, many=True, context={'request': request}).data,
        })


# ========== Shorts Comment View ==========
class ShortsCommentView(APIView):
    """
    GET  /api/movies/shorts/{movie_id}/comments/ — 댓글 목록 조회 (로그인 불필요)
    POST /api/movies/shorts/{movie_id}/comments/ — 댓글 작성 (로그인 필수)
    """
    serializer_class = CommentCreateSerializer

    # ---- GET은 비로그인, POST는 로그인 필수 ----
    def get_permissions(self):
        if self.request.method == 'GET':
            return [AllowAny()]
        return [IsAuthenticated()]

    # ---- 댓글 목록 조회 ----
    def get(self, request, movie_id):
        movie = get_object_or_404(Movie, movie_id=movie_id)
        comments = Comment.objects.filter(movie=movie)
        serializer = CommentResponseSerializer(comments, many=True)
        return Response({
            "movie_id": movie_id,
            "comments": serializer.data
        }, status=status.HTTP_200_OK)

    # ---- 댓글 작성 ----
    @extend_schema(request=CommentCreateSerializer, responses={201: CommentResponseSerializer})
    def post(self, request, movie_id):
        # ---- 댓글 내용 검증 ----
        serializer = CommentCreateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        # ---- 영화 조회 (없으면 404) ----
        movie = get_object_or_404(Movie, movie_id=movie_id)

        # ---- 댓글 생성 (user는 JWT에서 자동 추출, created_at은 auto_now_add) ----
        comment = Comment.objects.create(
            movie=movie,
            user=request.user,
            content=serializer.validated_data['content']
        )

        # ---- 응답 ----
        response_data = CommentResponseSerializer(comment).data
        response_data['message'] = '댓글이 성공적으로 등록되었습니다.'
        return Response(response_data, status=status.HTTP_201_CREATED)


# ========== Shorts Comment Delete View ==========
class ShortsCommentDeleteView(APIView):
    """
    DELETE /api/movies/shorts/{movie_id}/comments/{comment_id}/
    본인이 작성한 댓글만 삭제합니다.
    """
    permission_classes = [IsAuthenticated]

    def delete(self, request, movie_id, comment_id):
        # ---- 댓글 조회 (없으면 404) ----
        comment = get_object_or_404(Comment, id=comment_id, movie__movie_id=movie_id)

        # ---- 본인 확인 (다른 사용자면 403) ----
        if comment.user != request.user:
            return Response(
                {"error": "본인의 댓글만 삭제할 수 있습니다."},
                status=status.HTTP_403_FORBIDDEN
            )

        # ---- 삭제 ----
        comment.delete()
        return Response({
            "comment_id": comment_id,
            "message": "댓글이 삭제되었습니다."
        }, status=status.HTTP_200_OK)


# ========== Shorts Like View ==========
class ShortsLikeView(APIView):
    """
    POST /api/movies/shorts/{movie_id}/like/
    좋아요 토글 (등록 ↔ 취소)
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, movie_id):
        # ---- 영화 조회 (없으면 404) ----
        movie = get_object_or_404(Movie, movie_id=movie_id)

        # ---- 좋아요 토글 ----
        like, created = UserLikeList.objects.get_or_create(
            movie=movie, user=request.user
        )

        if created:
            # 좋아요 등록 → like_count +1
            movie.like_count = F('like_count') + 1
            movie.save(update_fields=['like_count'])
            movie.refresh_from_db()
            is_liked, message = True, "좋아요가 등록되었습니다."
        else:
            # 좋아요 취소 (토글) → like_count -1
            like.delete()
            movie.like_count = F('like_count') - 1
            movie.save(update_fields=['like_count'])
            movie.refresh_from_db()
            is_liked, message = False, "좋아요가 취소되었습니다."

        # ---- 응답 ----
        return Response({
            "movie_id": movie_id,
            "is_liked": is_liked,
            "total_likes": movie.like_count,
            "message": message
        }, status=status.HTTP_200_OK)


# ========== Shorts View Count View ==========
class ShortsViewCountView(APIView):
    """
    POST /api/movies/shorts/{movie_id}/view/
    Shorts 조회수 1 증가 (로그인 불필요)
    """
    permission_classes = [AllowAny]

    def post(self, request, movie_id):
        # ---- 영화 조회 (없으면 404) ----
        movie = get_object_or_404(Movie, movie_id=movie_id)

        # ---- 조회수 +1 (원자적 연산) ----
        movie.view_count = F('view_count') + 1
        movie.save(update_fields=['view_count'])
        movie.refresh_from_db()

        # ---- 응답 ----
        return Response({
            "movie_id": movie_id,
            "current_view_count": movie.view_count,
            "message": "조회수가 성공적으로 집계되었습니다."
        }, status=status.HTTP_200_OK)



