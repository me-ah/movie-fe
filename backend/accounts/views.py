import os
import requests
from django.contrib.auth import get_user_model
from django.db.models import Sum
from rest_framework import status, generics, views
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView
from drf_spectacular.utils import extend_schema
from . import serializers
from .serializers import (
    UserRegistrationSerializer, 
    ChangePasswordSerializer, 
    SocialLoginSerializer,
    CustomTokenObtainPairSerializer,
    LoginResponseSerializer,
    MyPageRequestSerializer,
    MyPageResponseSerializer
)
from .models import UserMovieHistory, UserMyList

User = get_user_model()

class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer
    @extend_schema(responses={200: LoginResponseSerializer})
    def post(self, request, *args, **kwargs):
        return super().post(request, *args, **kwargs)

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = (AllowAny,)
    serializer_class = UserRegistrationSerializer

class ChangePasswordView(views.APIView):
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
            return Response({'status': 'success', 'message': 'Password updated successfully'}, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class MyPageView(views.APIView):
    """
    마이페이지 API
    POST /api/accounts/mypage/
    """
    permission_classes = (IsAuthenticated,)
    serializer_class = MyPageRequestSerializer

    @extend_schema(request=MyPageRequestSerializer, responses={200: MyPageResponseSerializer})
    def post(self, request):
        user = request.user
        # Verify if the provided userid matches the authenticated user
        if user.id != request.data.get('userid'):
             return Response({
                "error": "NOT_USER_DATA",
                "message": "잘못된 요청입니둥"
            }, status=status.HTTP_404_NOT_FOUND)

        # 1. User Data
        userdata = {
            "userid": str(user.id),
            "username": user.username,
            "useremail": user.email,
            "firstname": user.first_name,
            "lastname": user.last_name,
        }

        # 2. Watch Time (Sum of all watch histories)
        watchtime_sum = UserMovieHistory.objects.filter(user=user).aggregate(Sum('watch_time'))['watch_time__sum'] or 0

        # 3. User MyList Count
        usermylist_count = UserMyList.objects.filter(user=user).count()

        # 4. Record Movies (Recent 10)
        # Structure: "recordmovie": { "pk": { "name": "...", "poster": "..." }, ... }
        record_movies_qs = UserMovieHistory.objects.filter(user=user).select_related('movie')[:10]
        recordmovie = {}
        for history in record_movies_qs:
            recordmovie[str(history.movie.id)] = {
                "recordmovie_name": history.movie.title,
                "recordmovie_poster": history.movie.poster_path
            }

        # 5. MyList Movies (Recent 10)
        mylist_movies_qs = UserMyList.objects.filter(user=user).select_related('movie')[:10]
        mylistmovie = {}
        for item in mylist_movies_qs:
            mylistmovie[str(item.movie.id)] = {
                "mylistmovie_name": item.movie.title,
                "mylistmovie_poster": item.movie.poster_path
            }

        response_data = {
            "userdata": userdata,
            "watchtime": str(watchtime_sum),
            "usermylist": str(usermylist_count),
            "recordmovie": recordmovie,
            "mylistmovie": mylistmovie
        }

        return Response(response_data, status=status.HTTP_200_OK)

class KakaoLoginView(views.APIView):
    permission_classes = (AllowAny,)
    serializer_class = SocialLoginSerializer
    @extend_schema(request=SocialLoginSerializer, responses={200: LoginResponseSerializer})
    def post(self, request):
        serializer = SocialLoginSerializer(data=request.data)
        if not serializer.is_valid(): return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        access_token = serializer.validated_data.get('access_token')
        user_info_response = requests.get("https://kapi.kakao.com/v2/user/me", headers={'Authorization': f'Bearer {access_token}'})
        if user_info_response.status_code != 200: return Response({'error': 'Invalid Kakao token'}, status=status.HTTP_401_UNAUTHORIZED)
        user_info = user_info_response.json()
        kakao_id, kakao_account = user_info.get('id'), user_info.get('kakao_account', {})
        email, nickname = kakao_account.get('email'), kakao_account.get('profile', {}).get('nickname', f"kakao_{user_info.get('id')}")
        username = f"kakao_{kakao_id}"
        try:
            user = User.objects.get(username=username)
            if email: user.email = email
            user.save()
        except User.DoesNotExist:
            if email and User.objects.filter(email=email).exists(): email = f"{username}@kakao.com"
            user = User.objects.create_user(username=username, email=email or f"{username}@kakao.com", password=None, first_name=nickname, login_type='kakao')
        refresh = RefreshToken.for_user(user)
        return Response({"message": "로그인 성공", "user": {"userid": user.id, "username": user.username, "useremail": user.email, "firstname": user.first_name, "lastname": user.last_name}, "token": str(refresh.access_token), "refresh": str(refresh)})

class GoogleLoginView(views.APIView):
    permission_classes = (AllowAny,)
    serializer_class = SocialLoginSerializer
    @extend_schema(request=SocialLoginSerializer, responses={200: LoginResponseSerializer})
    def post(self, request):
        serializer = SocialLoginSerializer(data=request.data)
        if not serializer.is_valid(): return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        access_token = serializer.validated_data.get('access_token')
        user_info_response = requests.get("https://www.googleapis.com/oauth2/v3/userinfo", params={'access_token': access_token})
        if user_info_response.status_code != 200: return Response({'error': 'Invalid Google token'}, status=status.HTTP_401_UNAUTHORIZED)
        user_info = user_info_response.json()
        google_id, email = user_info.get('sub'), user_info.get('email')
        first_name, last_name = user_info.get('given_name', f"google_{google_id}"), user_info.get('family_name', '')
        username = f"google_{google_id}"
        try:
            user = User.objects.get(username=username)
            if email: user.email = email
            user.save()
        except User.DoesNotExist:
            if email and User.objects.filter(email=email).exists(): email = f"{username}@google.com"
            user = User.objects.create_user(username=username, email=email or f"{username}@google.com", password=None, first_name=first_name, last_name=last_name, login_type='google')
        refresh = RefreshToken.for_user(user)
        return Response({"message": "로그인 성공", "user": {"userid": user.id, "username": user.username, "useremail": user.email, "firstname": user.first_name, "lastname": user.last_name}, "token": str(refresh.access_token), "refresh": str(refresh)})