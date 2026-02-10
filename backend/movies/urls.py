from django.urls import path
from .views import MovieShortsView

urlpatterns = [
    path('shorts/', MovieShortsView.as_view(), name='movie-shorts'),
]
