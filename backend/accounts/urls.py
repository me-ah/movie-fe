from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import RegisterView, ChangePasswordView, KakaoLoginView, GoogleLoginView, CustomTokenObtainPairView

urlpatterns = [
    path('register/', RegisterView.as_view(), name='auth_register'),
    path('login/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('login/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('change_password/', ChangePasswordView.as_view(), name='auth_change_password'),
    path('login/kakao/', KakaoLoginView.as_view(), name='kakao_login'),
    path('login/google/', GoogleLoginView.as_view(), name='google_login'),
]