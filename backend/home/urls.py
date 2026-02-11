from django.urls import path
from .views import (
    MainView, 
    SubView, 
    MovieDetailView, 
    MovieReviewCreateView, 
    MovieReviewDetailView
)

urlpatterns = [
    path('main/', MainView.as_view(), name='home_main'),
    path('sub/', SubView.as_view(), name='home_sub'),
    path('detail/', MovieDetailView.as_view(), name='movie_detail'),
    path('detail/<int:movie_id>/review/', MovieReviewCreateView.as_view(), name='review_create'),
    path('review/<int:review_id>/', MovieReviewDetailView.as_view(), name='review_detail'),
]
