from django.urls import path
from .views import MainView, SubView, MovieDetailView

urlpatterns = [
    path('main/', MainView.as_view(), name='home_main'),
    path('sub/', SubView.as_view(), name='home_sub'),
    path('detail/', MovieDetailView.as_view(), name='movie_detail'),
]