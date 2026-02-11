from django.urls import path
from .views import ReviewListView, ReviewDetailView

urlpatterns = [
    path('list/', ReviewListView.as_view(), name='review-list'),
    path('<int:review_id>/', ReviewDetailView.as_view(), name='review-detail'),
]
