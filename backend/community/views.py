from drf_spectacular.utils import extend_schema, OpenApiParameter
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework import status
from rest_framework.pagination import PageNumberPagination
from django.shortcuts import get_object_or_404

from .models import Review
from .serializers import ReviewListSerializer, ReviewDetailSerializer, CommunityReviewCreateSerializer


# ========== 페이지네이션 설정 ==========
class ReviewPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 50


# ========== 리뷰 목록 조회 ==========
class ReviewListView(APIView):
    """
    GET /api/review/list/
    리뷰 목록 조회 (공개 API, 페이징 + 검색 + 필터 + 정렬)
    """
    permission_classes = [AllowAny]

    @extend_schema(
        summary="리뷰 목록 조회",
        description="영화 리뷰 목록을 조회합니다. 검색, 필터, 정렬, 페이징을 지원합니다.",
        parameters=[
            OpenApiParameter(name='page', description='페이지 번호', required=False, type=int),
            OpenApiParameter(name='search', description='영화 제목 검색', required=False, type=str),
            OpenApiParameter(name='rating', description='평점 필터 (1~10)', required=False, type=int),
            OpenApiParameter(name='type', description='정렬 기준 (rating, title, movie_title, created_at)', required=False, type=str),
            OpenApiParameter(name='order', description='정렬 방향 (asc, desc)', required=False, type=str),
        ],
        responses=ReviewListSerializer(many=True)
    )
    def get(self, request):
        queryset = Review.objects.all()

        # ---- search: 영화 제목 검색 ----
        search = request.query_params.get('search')
        if search:
            queryset = queryset.filter(movie_title__icontains=search)

        # ---- rating: 평점 필터 ----
        rating = request.query_params.get('rating')
        if rating:
            try:
                queryset = queryset.filter(rank=int(rating))
            except ValueError:
                pass

        # ---- type + order: 정렬 ----
        sort_type = request.query_params.get('type', 'created_at')
        order = request.query_params.get('order', 'desc')

        # 허용된 정렬 필드만 사용
        allowed_sort = {
            'rating': 'rank',
            'title': 'title',
            'movie_title': 'movie_title',
            'created_at': 'created_at',
        }
        sort_field = allowed_sort.get(sort_type, 'created_at')

        # 오름차순/내림차순
        if order == 'asc':
            queryset = queryset.order_by(sort_field)
        else:
            queryset = queryset.order_by(f'-{sort_field}')

        # ---- 페이징 ----
        paginator = ReviewPagination()
        page = paginator.paginate_queryset(queryset, request)

        if page is not None:
            # context에 request 전달 (is_liked 필드용)
            serializer = ReviewListSerializer(page, many=True, context={'request': request})
            return paginator.get_paginated_response(serializer.data)

        serializer = ReviewListSerializer(queryset, many=True, context={'request': request})
        return Response(serializer.data)


# ========== 리뷰 상세 조회 ==========
class ReviewDetailView(APIView):
    """
    GET /api/review/{review_id}/
    리뷰 상세 조회 (공개 API, 댓글 포함)
    """
    permission_classes = [AllowAny]

    @extend_schema(
        summary="리뷰 상세 조회",
        description="특정 리뷰의 상세 정보와 댓글 목록을 조회합니다.",
        responses=ReviewDetailSerializer
    )
    def get(self, request, review_id):
        review = get_object_or_404(Review, id=review_id)
        serializer = ReviewDetailSerializer(review, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)


# ========== 리뷰 작성 ==========
class ReviewCreateView(APIView):
    """
    POST /api/review/create/
    리뷰 게시글 작성 (JWT 인증 필수)
    """
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary="리뷰 작성",
        description="새로운 영화 리뷰를 작성합니다. (JWT 인증 필수)",
        request=CommunityReviewCreateSerializer,
        responses={201: ReviewListSerializer}
    )
    def post(self, request):
        serializer = CommunityReviewCreateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        # ---- 리뷰 저장 (user 자동 설정) ----
        review = serializer.save(user=request.user)

        # ---- 응답 데이터 생성 ----
        response_serializer = ReviewListSerializer(review, context={'request': request})
        return Response({
            "message": "게시글이 성공적으로 작성되었습니다.",
            "post": response_serializer.data
        }, status=status.HTTP_201_CREATED)
