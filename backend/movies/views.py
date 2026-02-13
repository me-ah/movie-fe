import base64
import json
import random
import redis

from django.shortcuts import get_object_or_404
from django.db.models import Case, When, F, Count
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework import status
from drf_spectacular.utils import extend_schema, OpenApiParameter

from .models import Movie, Comment
from .serializers import (
    MovieShortsSerializer, 
    CommentCreateSerializer, 
    CommentResponseSerializer,
    ShortsResponseSerializer,
    ShortsDetailResponseSerializer
)
from accounts.models import UserLikeList
from .recommendation import generate_personalized_playlist

# Redis 직접 연결 (도커 호스트명 'redis' 사용)
r = redis.Redis(host='redis', port=6379, db=0, decode_responses=True)


# ========== Helper Functions ==========

def get_shorts_list(user, cursor_idx, page_size=10):
    """
    로그인 유저에게 개인화된 쇼츠 리스트를 제공하고 리스트를 관리함 (Redis 활용)
    유저가 10개를 볼 때마다 백그라운드에서 다음 20개를 충전하는 방식
    """
    cache_key = f"shorts_playlist:{user.id}"
    
    # Redis에서 현재 플레이리스트 가져오기
    playlist = r.lrange(cache_key, 0, -1)
    
    # 데이터가 없거나, 충전이 필요한 시점 (현재 커서가 리스트 끝에 도달하려고 할 때)
    if not playlist or (cursor_idx + page_size >= len(playlist)):
        new_movies = generate_personalized_playlist(user)
        if new_movies:
            # Redis에 추가 (오른쪽에 푸시)
            r.rpush(cache_key, *new_movies)
            r.expire(cache_key, 3600) # 1시간 유효
            playlist.extend([str(mid) for mid in new_movies])

    # 현재 커서부터 요청한 개수만큼 ID 추출
    target_ids = [int(mid) for mid in playlist[cursor_idx : cursor_idx + page_size]]
    
    # 영화 데이터 조회 (순서 보존)
    if not target_ids:
        return Movie.objects.none()
        
    preserved = Case(*[When(id=pk, then=pos) for pos, pk in enumerate(target_ids)])
    return Movie.objects.filter(id__in=target_ids).annotate(comment_count=Count('comments')).order_by(preserved)


# ========== Shorts API View ==========

class MovieShortsView(APIView):
    """
    GET /api/movies/shorts/
    개인화된 무한 스크롤 영화 쇼츠 목록을 반환합니다.

    Query Parameters:
        - cursor (int, optional): 인덱스 기반 커서 (0, 10, 20...)
        - page_size (int, optional): 페이지 크기 (기본값 10, 최대 50)
    """
    permission_classes = [AllowAny]
    serializer_class = MovieShortsSerializer

    @extend_schema(
        parameters=[OpenApiParameter("cursor", type=int, description="인덱스 기반 커서 (기본값 0)")],
        responses={200: ShortsResponseSerializer},
        description="로그인 유저에게는 취향 기반 믹스 큐레이션을, 비로그인 유저에게는 일반 목록을 제공합니다."
    )
    def get(self, request):
        # ---- 페이지 크기 설정 ----
        page_size = min(int(request.query_params.get('page_size', 10)), 50)
        
        # ---- 커서 처리 (인덱스 기반) ----
        raw_cursor = request.query_params.get('cursor', None)
        try:
            cursor_idx = int(raw_cursor) if raw_cursor else 0
        except ValueError:
            cursor_idx = 0

        # ---- 유저 상태에 따른 쿼리셋 결정 ----
        if request.user.is_authenticated:
            # 개인화된 큐레이션 로직 사용 (Redis 기반)
            movies_qs = get_shorts_list(request.user, cursor_idx, page_size)
        else:
            # 비로그인: 기존 PK 순서 로직 유지
            movies_qs = Movie.objects.annotate(comment_count=Count('comments')).filter(id__gt=cursor_idx).order_by('id')[:page_size]

        # ---- 직렬화 및 응답 ----
        serializer = MovieShortsSerializer(movies_qs, many=True, context={'request': request})

        return Response({
            'next_cursor': cursor_idx + page_size,
            'results': serializer.data,
        })


# ========== Shorts Detail API View ==========

class MovieShortsDetailView(APIView):
    """
    GET /api/movies/shorts/{movie_id}/
    공유 링크를 통해 진입한 사용자에게 특정 영화의 상세 정보와
    해당 영화 이후의 개인화된 쇼츠 목록을 함께 반환합니다.

    Path Parameters:
        - movie_id (str): 조회할 영화의 고유 ID (Movie.movie_id)
    """
    permission_classes = [AllowAny]

    @extend_schema(responses={200: ShortsDetailResponseSerializer})
    def get(self, request, movie_id):
        # ---- 해당 movie_id 영화 조회 (없으면 404) ----
        # comment_count 주석 추가
        movie = get_object_or_404(Movie.objects.annotate(comment_count=Count('comments')), movie_id=movie_id)

        # ---- current: 해당 영화 직렬화 ----
        current = MovieShortsSerializer(movie, context={'request': request}).data

        # ---- 이후 영화 목록 조회 (개인화 적용) ----
        page_size = min(int(request.query_params.get('page_size', 10)), 50)
        
        if request.user.is_authenticated:
            # 상세 진입 시에는 플레이리스트의 처음부터 추천을 이어감
            # get_shorts_list는 이미 annotate가 적용됨
            next_movies_qs = get_shorts_list(request.user, 0, page_size)
        else:
            # 비로그인: 해당 영화 이후 PK 순서대로
            next_movies_qs = Movie.objects.annotate(comment_count=Count('comments')).filter(id__gt=movie.id).order_by('id')[:page_size]

        # ---- 응답 ----
        return Response({
            'current': current,
            'next_cursor': page_size,
            'results': MovieShortsSerializer(next_movies_qs, many=True, context={'request': request}).data,
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

        # ---- 댓글 생성 ----
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
            is_liked, message = True, "좋아요가 등록되었습니다."
        else:
            # 좋아요 취소 → like_count -1
            like.delete()
            movie.like_count = F('like_count') - 1
            movie.save(update_fields=['like_count'])
            is_liked, message = False, "좋아요가 취소되었습니다."

        movie.refresh_from_db()

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
    조회수 증가 API
    """
    permission_classes = [AllowAny]

    def post(self, request, movie_id):
        # ---- 영화 조회 ----
        movie = get_object_or_404(Movie, movie_id=movie_id)

        # ---- 조회수 증가 ----
        movie.view_count = F('view_count') + 1
        movie.save(update_fields=['view_count'])
        movie.refresh_from_db()

        # ---- 응답 ----
        return Response({
            "movie_id": movie_id,
            "view_count": movie.view_count,
            "message": "조회수가 증가되었습니다."
        }, status=status.HTTP_200_OK)