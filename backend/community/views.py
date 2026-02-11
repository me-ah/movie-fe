from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework import status
from rest_framework.pagination import PageNumberPagination
from django.shortcuts import get_object_or_404

from .models import Review
from .serializers import ReviewListSerializer, ReviewDetailSerializer


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
            serializer = ReviewListSerializer(page, many=True)
            return paginator.get_paginated_response(serializer.data)

        serializer = ReviewListSerializer(queryset, many=True)
        return Response(serializer.data)


# ========== 리뷰 상세 조회 ==========
class ReviewDetailView(APIView):
    """
    GET /api/review/{review_id}/
    리뷰 상세 조회 (공개 API, 댓글 포함)
    """
    permission_classes = [AllowAny]

    def get(self, request, review_id):
        review = get_object_or_404(Review, id=review_id)
        serializer = ReviewDetailSerializer(review)
        return Response(serializer.data, status=status.HTTP_200_OK)
