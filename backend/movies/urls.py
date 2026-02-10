from django.urls import path
from .views import MovieShortsView, MovieShortsDetailView

urlpatterns = [
    path('shorts/', MovieShortsView.as_view(), name='movie-shorts'),
    path('shorts/<str:movie_id>/', MovieShortsDetailView.as_view(), name='movie-shorts-detail'),
]
