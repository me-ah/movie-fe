from django.urls import path
from .views import (
    MainView, 
    SubView, 
    MovieDetailView, 
    MovieReviewListView,
    MovieReviewDetailView
)

urlpatterns = [
    path('main/', MainView.as_view(), name='home_main'),
    path('sub/', SubView.as_view(), name='home_sub'),
    
    # 영화 상세 (Query Parameter: ?id=...)
    path('detail/', MovieDetailView.as_view(), name='movie_detail'),
    
    # 리뷰 관련 (Query Parameter: ?id=... / Body: {id: ...})
    path('review/', MovieReviewListView.as_view(), name='review_list_create'),
    path('review/<int:review_id>/', MovieReviewDetailView.as_view(), name='review_detail_update_delete'),
]
