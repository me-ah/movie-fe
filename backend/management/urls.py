from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import AdminUserViewSet, AdminMovieViewSet, AdminReviewViewSet

router = DefaultRouter()
router.register(r'accounts', AdminUserViewSet, basename='admin-accounts')
router.register(r'movies', AdminMovieViewSet, basename='admin-movies')
router.register(r'reviews', AdminReviewViewSet, basename='admin-reviews')

urlpatterns = [
    path('', include(router.urls)),
]
