from rest_framework import viewsets, permissions, pagination, filters
from django.contrib.auth import get_user_model
from drf_spectacular.utils import extend_schema, OpenApiParameter
from movies.models import Movie
from home.models import MovieReview
from .serializers import (
    AdminUserSerializer, 
    AdminUserCreateSerializer, 
    AdminMovieSerializer, 
    AdminReviewSerializer
)

User = get_user_model()

# ========== Pagination ==========

class AdminMoviePagination(pagination.PageNumberPagination):
    """영화 관리용 가변 페이지네이션 (10, 20, 50, 100)"""
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 100

# ========== Admin ViewSets ==========

@extend_schema(tags=['Admin - Accounts'])
class AdminUserViewSet(viewsets.ModelViewSet):
    """관리자용 유저 CRUD (PATCH만 허용)"""
    queryset = User.objects.all().order_by('-id')
    serializer_class = AdminUserSerializer
    permission_classes = [permissions.IsAdminUser]
    http_method_names = ['get', 'post', 'patch', 'delete', 'head', 'options']

    def get_serializer_class(self):
        if self.action == 'create':
            return AdminUserCreateSerializer
        return AdminUserSerializer

    @extend_schema(request=AdminUserCreateSerializer, responses={201: AdminUserSerializer})
    def create(self, request, *args, **kwargs):
        return super().create(request, *args, **kwargs)

@extend_schema(tags=['Admin - Movies'])
class AdminMovieViewSet(viewsets.ModelViewSet):
    """관리자용 영화 CRUD (PATCH만 허용)"""
    queryset = Movie.objects.all().order_by('-id')
    serializer_class = AdminMovieSerializer
    permission_classes = [permissions.IsAdminUser]
    pagination_class = AdminMoviePagination
    filter_backends = [filters.SearchFilter]
    search_fields = ['title']
    http_method_names = ['get', 'post', 'patch', 'delete', 'head', 'options']

@extend_schema(tags=['Admin - Reviews'])
class AdminReviewViewSet(viewsets.ModelViewSet):
    """관리자용 리뷰 CRUD (PATCH만 허용)"""
    queryset = MovieReview.objects.all().order_by('-id')
    serializer_class = AdminReviewSerializer
    permission_classes = [permissions.IsAdminUser]
    http_method_names = ['get', 'post', 'patch', 'delete', 'head', 'options']
