from drf_spectacular.utils import extend_schema, OpenApiParameter
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework import status
from rest_framework.pagination import PageNumberPagination
from django.shortcuts import get_object_or_404

from .models import Review, ReviewComment
from .serializers import ReviewListSerializer, ReviewDetailSerializer, CommunityReviewCreateSerializer, CommunityReviewUpdateSerializer, ReviewCommentSerializer, ReviewCommentUpdateSerializer


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


# ========== 리뷰 수정 (PATCH) ==========
class ReviewUpdateView(APIView):
    """
    PATCH /api/review/{review_id}/update/
    리뷰 수정 (작성자 본인만 가능)
    """
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary="리뷰 수정",
        description="본인이 작성한 리뷰를 수정합니다. (PATCH 부분 수정)",
        request=CommunityReviewUpdateSerializer,
        responses={200: ReviewListSerializer}
    )
    def patch(self, request, review_id):
        review = get_object_or_404(Review, id=review_id)

        # ---- 작성자 검증 ----
        if review.user != request.user:
            return Response({"error": "본인의 게시글만 수정할 수 있습니다."}, status=status.HTTP_403_FORBIDDEN)

        serializer = CommunityReviewUpdateSerializer(review, data=request.data, partial=True)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        updated_review = serializer.save()

        # ---- 응답 데이터 생성 ----
        response_serializer = ReviewListSerializer(updated_review, context={'request': request})
        return Response({
            "message": "게시글 수정 완료",
            "post": response_serializer.data
        }, status=status.HTTP_200_OK)


# ========== 리뷰 삭제 (DELETE) ==========
class ReviewDeleteView(APIView):
    """
    DELETE /api/review/{review_id}/delete/
    리뷰 삭제 (작성자 본인만 가능)
    """
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary="리뷰 삭제",
        description="본인이 작성한 리뷰를 삭제합니다.",
        responses={200: None}
    )
    def delete(self, request, review_id):
        review = get_object_or_404(Review, id=review_id)

        # ---- 작성자 검증 ----
        if review.user != request.user:
            return Response({"error": "본인의 게시글만 삭제할 수 있습니다."}, status=status.HTTP_403_FORBIDDEN)

        title = review.title  # 삭제 전 제목 저장
        review.delete()

        return Response({
            "message": f'작성하신 게시글 "{title}"이(가) 성공적으로 삭제 되었습니다.'
        }, status=status.HTTP_200_OK)


# ========== 댓글 작성 (POST) ==========
class ReviewCommentCreateView(APIView):
    """
    POST /api/review/{review_id}/comment/create/
    댓글 작성 (JWT 인증 필수)
    """
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary="댓글 작성",
        description="특정 리뷰에 댓글을 작성합니다.",
        request=ReviewCommentSerializer,
        responses={200: ReviewCommentSerializer}  # or any specific response schema
    )
    def post(self, request, review_id):
        review = get_object_or_404(Review, id=review_id)
        
        # request.data는 불변일 수 있으므로 copy() 사용
        data = request.data.copy()
        data['review'] = review.id
        
        serializer = ReviewCommentSerializer(data=data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        comment = serializer.save(user=request.user, review=review)
        
        return Response({
            "message": "댓글이 정상적으로 작성 됐습니다.",
            "comment": ReviewCommentSerializer(comment).data
        }, status=status.HTTP_200_OK)


# ========== 댓글 목록 조회 (GET) ==========
class ReviewCommentListView(APIView):
    """
    GET /api/review/{review_id}/comment/list/
    댓글 목록 조회 (공개, 페이징 + 정렬)
    """
    permission_classes = [AllowAny]

    @extend_schema(
        summary="댓글 목록 조회",
        description="특정 리뷰의 댓글 목록을 조회합니다. (페이징, 정렬)",
        parameters=[
            OpenApiParameter(name='page', description='페이지 번호', required=False, type=int),
            OpenApiParameter(name='order', description='정렬 (asc: 오래된순, desc: 최신순)', required=False, type=str),
        ],
        responses=ReviewCommentSerializer(many=True)
    )
    def get(self, request, review_id):
        # 리뷰 존재 여부 확인 (없으면 404)
        review = get_object_or_404(Review, id=review_id)
        
        # 해당 리뷰의 댓글만 필터링
        queryset = ReviewComment.objects.filter(review=review)

        # ---- 정렬 ----
        order = request.query_params.get('order', 'desc')  # 기본값: 최신순
        if order == 'asc':
            queryset = queryset.order_by('created_at')
        else:
            queryset = queryset.order_by('-created_at')

        # ---- 페이징 ----
        paginator = ReviewPagination()
        page = paginator.paginate_queryset(queryset, request)

        if page is not None:
            serializer = ReviewCommentSerializer(page, many=True)
            return paginator.get_paginated_response(serializer.data)

        serializer = ReviewCommentSerializer(queryset, many=True)
        return Response(serializer.data)


# ========== 댓글 수정 (PUT) ==========
class ReviewCommentUpdateView(APIView):
    """
    PUT /api/review/{review_id}/comment/{comment_id}/update/
    댓글 수정 (작성자 본인만 가능)
    """
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary="댓글 수정",
        description="본인이 작성한 댓글을 수정합니다.",
        request=ReviewCommentUpdateSerializer,
        responses=ReviewCommentSerializer
    )
    def put(self, request, review_id, comment_id):
        # 댓글 조회 및 존재 확인
        comment = get_object_or_404(ReviewComment, id=comment_id)

        # URL의 review_id와 댓글의 review가 일치하는지 검증 (데이터 무결성)
        if comment.review.id != review_id:
            return Response({"error": "잘못된 경로입니다. (리뷰 ID 불일치)"}, status=status.HTTP_400_BAD_REQUEST)

        # ---- 작성자 검증 ----
        if comment.user != request.user:
            return Response({"error": "본인의 댓글만 수정할 수 있습니다."}, status=status.HTTP_403_FORBIDDEN)

        serializer = ReviewCommentUpdateSerializer(comment, data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        updated_comment = serializer.save()

        # ---- 응답 데이터 생성 (수정된 댓글 정보 반환) ----
        return Response({
            "message": "댓글이 성공적으로 수정되었습니다",
            "comment": ReviewCommentSerializer(updated_comment).data
        }, status=status.HTTP_200_OK)


# ========== 댓글 삭제 (DELETE) ==========
class ReviewCommentDeleteView(APIView):
    """
    DELETE /api/review/{review_id}/comment/{comment_id}/delete/
    댓글 삭제 (작성자 본인만 가능)
    """
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary="댓글 삭제",
        description="본인이 작성한 댓글을 삭제합니다.",
        responses={200: None}
    )
    def delete(self, request, review_id, comment_id):
        # 댓글 조회 및 존재 확인
        comment = get_object_or_404(ReviewComment, id=comment_id)

        # URL의 review_id와 댓글의 review가 일치하는지 검증
        if comment.review.id != review_id:
            return Response({"error": "잘못된 경로입니다. (리뷰 ID 불일치)"}, status=status.HTTP_400_BAD_REQUEST)

        # ---- 작성자 검증 ----
        if comment.user != request.user:
            return Response({"error": "본인의 댓글만 삭제할 수 있습니다."}, status=status.HTTP_403_FORBIDDEN)

        comment.delete()

        return Response({
            "message": "댓글이 성공적으로 삭제되었습니다"
        }, status=status.HTTP_200_OK)
