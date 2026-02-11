from django.urls import path, re_path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    RegisterView, 
    ChangePasswordView, 
    KakaoLoginView, 
    GoogleLoginView, 
    CustomTokenObtainPairView,
    MyPageView,
    WatchHistoryView
)

urlpatterns = [
    path('register/', RegisterView.as_view(), name='auth_register'),
    path('login/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('login/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('change_password/', ChangePasswordView.as_view(), name='auth_change_password'),
    path('login/kakao/', KakaoLoginView.as_view(), name='kakao_login'),
    path('login/google/', GoogleLoginView.as_view(), name='google_login'),
    # 슬래시 유무에 관계없이 매칭되도록 re_path 사용 고려 또는 기본 path 유지
    path('mypage/', MyPageView.as_view(), name='user_mypage'),
    path('watch-history/', WatchHistoryView.as_view(), name='watch-history'),
]
