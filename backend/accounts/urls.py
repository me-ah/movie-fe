from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    RegisterView, 
    ChangePasswordView, 
    KakaoLoginView, 
    GoogleLoginView, 
    CustomTokenObtainPairView,
    MyPageView,
    UserProfileUpdateView,
    UserProfileDeleteView,
    WatchHistoryView
)

urlpatterns = [
    path('register/', RegisterView.as_view(), name='auth_register'),
    path('login/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('login/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('change_password/', ChangePasswordView.as_view(), name='auth_change_password'),
    path('login/kakao/', KakaoLoginView.as_view(), name='kakao_login'),
    path('login/google/', GoogleLoginView.as_view(), name='google_login'),
    path('mypage/', MyPageView.as_view(), name='user_mypage'),
    
    # 프로필 수정 및 탈퇴
    path('profile/update/', UserProfileUpdateView.as_view(), name='profile_update'),
    path('profile/delete/', UserProfileDeleteView.as_view(), name='profile_delete'),
    
    # 시청 기록 저장
    path('watch-history/', WatchHistoryView.as_view(), name='watch_history'),
]