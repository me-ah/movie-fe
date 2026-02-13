from django.urls import path, re_path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    RegisterView, 
    ChangePasswordView, 
    KakaoLoginView, 
    GoogleLoginView, 
    CustomTokenObtainPairView,
    MyPageView,
    WatchHistoryView,
    OnboardingView,
    UserProfileUpdateView,
    UserProfileDeleteView
)

urlpatterns = [
    path('register/', RegisterView.as_view(), name='auth_register'),
    path('login/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('login/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('change_password/', ChangePasswordView.as_view(), name='auth_change_password'),
    path('login/kakao/', KakaoLoginView.as_view(), name='kakao_login'),
    path('login/google/', GoogleLoginView.as_view(), name='google_login'),
    path('onboarding/', OnboardingView.as_view(), name='user_onboarding'),
    path('mypage/', MyPageView.as_view(), name='user_mypage'),
    path('watch-history/', WatchHistoryView.as_view(), name='watch_history'),
    
    # Profile management (Allow both with and without trailing slash)
    re_path(r'^profile/?$', UserProfileUpdateView.as_view(), name='user_profile_update'),
    re_path(r'^profile/delete/?$', UserProfileDeleteView.as_view(), name='user_profile_delete'),
]
