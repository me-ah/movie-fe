import os
import requests
from django.contrib.auth import get_user_model
from rest_framework import status, generics, views
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView
from drf_spectacular.utils import extend_schema
from .serializers import (
    UserRegistrationSerializer, 
    ChangePasswordSerializer, 
    SocialLoginSerializer,
    CustomTokenObtainPairSerializer
)

User = get_user_model()

class CustomTokenObtainPairView(TokenObtainPairView):
    """
    자체 로그인 API (ID 또는 Email 사용 가능)
    """
    serializer_class = CustomTokenObtainPairSerializer

class RegisterView(generics.CreateAPIView):
    """
    자체 회원가입 API
    """
    queryset = User.objects.all()
    permission_classes = (AllowAny,)
    serializer_class = UserRegistrationSerializer

class ChangePasswordView(views.APIView):
    """
    비밀번호 변경 API (자체 회원 전용)
    """
    permission_classes = (IsAuthenticated,)
    serializer_class = ChangePasswordSerializer

    @extend_schema(request=ChangePasswordSerializer)
    def post(self, request):
        user = request.user
        if user.login_type != 'email':
            return Response({"error": "Social login users cannot change password."}, status=status.HTTP_400_BAD_REQUEST)
        
        serializer = ChangePasswordSerializer(data=request.data)

        if serializer.is_valid():
            if not user.check_password(serializer.validated_data.get("old_password")):
                return Response({"old_password": ["Wrong password."]}, status=status.HTTP_400_BAD_REQUEST)

            user.set_password(serializer.validated_data.get("new_password"))
            user.save()
            return Response({
                'status': 'success',
                'message': 'Password updated successfully'
            }, status=status.HTTP_200_OK)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class KakaoLoginView(views.APIView):
    """
    카카오 소셜 로그인 API
    """
    permission_classes = (AllowAny,)
    serializer_class = SocialLoginSerializer

    @extend_schema(request=SocialLoginSerializer)
    def post(self, request):
        serializer = SocialLoginSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        access_token = serializer.validated_data.get('access_token')

        user_info_url = "https://kapi.kakao.com/v2/user/me"
        headers = {'Authorization': f'Bearer {access_token}'}
        user_info_response = requests.get(user_info_url, headers=headers)

        if user_info_response.status_code != 200:
            return Response({'error': 'Invalid Kakao token'}, status=status.HTTP_401_UNAUTHORIZED)

        user_info = user_info_response.json()
        kakao_id = user_info.get('id')
        kakao_account = user_info.get('kakao_account', {})
        email = kakao_account.get('email')
        nickname = kakao_account.get('profile', {}).get('nickname', '')

        if not email:
             return Response({'error': 'Email not provided by Kakao account'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = User.objects.get(email=email)
            if user.login_type != 'kakao':
                return Response({'error': 'Email already registered with different login type'}, status=status.HTTP_400_BAD_REQUEST)
        except User.DoesNotExist:
            user = User.objects.create_user(
                username=f"kakao_{kakao_id}",
                email=email,
                password=None,
                first_name=nickname,
                login_type='kakao'
            )
            user.save()

        refresh = RefreshToken.for_user(user)
        return Response({
            "message": "로그인 성공",
            "user": {
                "id": user.id,
                "username": user.username,
                "email": user.email
            },
            "token": str(refresh.access_token),
            "refresh": str(refresh)
        })

class GoogleLoginView(views.APIView):
    """
    구글 소셜 로그인 API
    """
    permission_classes = (AllowAny,)
    serializer_class = SocialLoginSerializer

    @extend_schema(request=SocialLoginSerializer)
    def post(self, request):
        serializer = SocialLoginSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        access_token = serializer.validated_data.get('access_token')
        
        user_info_url = "https://www.googleapis.com/oauth2/v3/userinfo"
        params = {'access_token': access_token}
        user_info_response = requests.get(user_info_url, params=params)

        if user_info_response.status_code != 200:
            return Response({'error': 'Invalid Google token'}, status=status.HTTP_401_UNAUTHORIZED)

        user_info = user_info_response.json()
        google_id = user_info.get('sub')
        email = user_info.get('email')
        first_name = user_info.get('given_name', '')
        last_name = user_info.get('family_name', '')

        if not email:
             return Response({'error': 'Email not provided by Google account'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = User.objects.get(email=email)
            if user.login_type != 'google':
                return Response({'error': 'Email already registered with different login type'}, status=status.HTTP_400_BAD_REQUEST)
        except User.DoesNotExist:
            user = User.objects.create_user(
                username=f"google_{google_id}",
                email=email,
                password=None,
                first_name=first_name,
                last_name=last_name,
                login_type='google'
            )
            user.save()

        refresh = RefreshToken.for_user(user)
        return Response({
            "message": "로그인 성공",
            "user": {
                "id": user.id,
                "username": user.username,
                "email": user.email
            },
            "token": str(refresh.access_token),
            "refresh": str(refresh)
        })
