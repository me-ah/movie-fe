from django.urls import path
from .views import MovieShortsView, MovieShortsDetailView, ShortsCommentView, ShortsCommentDeleteView, ShortsLikeView, ShortsViewCountView

urlpatterns = [
    path('shorts/', MovieShortsView.as_view(), name='movie-shorts'),
    path('shorts/<str:movie_id>/comments/', ShortsCommentView.as_view(), name='shorts-comment'),
    path('shorts/<str:movie_id>/comments/<int:comment_id>/', ShortsCommentDeleteView.as_view(), name='shorts-comment-delete'),
    path('shorts/<str:movie_id>/like/', ShortsLikeView.as_view(), name='shorts-like'),
    path('shorts/<str:movie_id>/view/', ShortsViewCountView.as_view(), name='shorts-view-count'),
    path('shorts/<str:movie_id>/', MovieShortsDetailView.as_view(), name='movie-shorts-detail'),
]



