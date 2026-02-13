from django.urls import path
from .views import ReviewListView, ReviewDetailView, ReviewCreateView, ReviewUpdateView, ReviewDeleteView, ReviewCommentCreateView, ReviewCommentListView, ReviewCommentUpdateView, ReviewCommentDeleteView, ReviewLikeView

urlpatterns = [
    path('list/', ReviewListView.as_view(), name='review-list'),
    path('create/', ReviewCreateView.as_view(), name='review-create'),
    path('<int:review_id>/update/', ReviewUpdateView.as_view(), name='review-update'),
    path('<int:review_id>/delete/', ReviewDeleteView.as_view(), name='review-delete'),
    path('<int:review_id>/comment/list/', ReviewCommentListView.as_view(), name='review-comment-list'),
    path('<int:review_id>/comment/create/', ReviewCommentCreateView.as_view(), name='review-comment-create'),
    path('<int:review_id>/comment/<int:comment_id>/update/', ReviewCommentUpdateView.as_view(), name='review-comment-update'),
    path('<int:review_id>/comment/<int:comment_id>/delete/', ReviewCommentDeleteView.as_view(), name='review-comment-delete'),
    path('<int:review_id>/', ReviewDetailView.as_view(), name='review-detail'),
    path('<int:review_id>/like/', ReviewLikeView.as_view(), name='review-like'),
]
