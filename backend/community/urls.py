from django.urls import path
from .views import ReviewListView, ReviewDetailView, ReviewCreateView

urlpatterns = [
    path('list/', ReviewListView.as_view(), name='review-list'),
    path('create/', ReviewCreateView.as_view(), name='review-create'),
    path('<int:review_id>/', ReviewDetailView.as_view(), name='review-detail'),
]
