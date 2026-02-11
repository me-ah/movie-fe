from django.urls import path
from .views import ReviewListView, ReviewDetailView, ReviewCreateView, ReviewUpdateView, ReviewDeleteView

urlpatterns = [
    path('list/', ReviewListView.as_view(), name='review-list'),
    path('create/', ReviewCreateView.as_view(), name='review-create'),
    path('<int:review_id>/update/', ReviewUpdateView.as_view(), name='review-update'),
    path('<int:review_id>/delete/', ReviewDeleteView.as_view(), name='review-delete'),
    path('<int:review_id>/', ReviewDetailView.as_view(), name='review-detail'),
]
