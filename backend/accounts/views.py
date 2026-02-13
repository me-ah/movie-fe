import os
import requests
from django.contrib.auth import get_user_model
from django.contrib.auth.models import update_last_login
from django.db.models import Sum, F
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
    MyPageResponseSerializer, 
    WatchHistorySerializer,
    OnboardingSerializer,
    UserProfileUpdateSerializer
)
from movies.models import Movie
from .models import UserMovieHistory, UserMyList, UserLikeList

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
            return Response({"error": "소셜 로그인 사용자는 비밀번호를 변경할 수 없습니둥."}, status=status.HTTP_400_BAD_REQUEST)
        serializer = ChangePasswordSerializer(data=request.data)
        if serializer.is_valid():
            if not user.check_password(serializer.validated_data.get("old_password")):
                return Response({"old_password": ["현재 비밀번호가 틀렸습니둥."]}, status=status.HTTP_400_BAD_REQUEST)
            user.set_password(serializer.validated_data.get("new_password"))
            user.save()
            return Response({'status': 'success', 'message': 'Password updated successfully'}, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class UserProfileUpdateView(generics.UpdateAPIView):
    permission_classes = (IsAuthenticated,)
    serializer_class = UserProfileUpdateSerializer
    http_method_names = ['patch', 'options']
    def get_object(self): return self.request.user
    @extend_schema(request=UserProfileUpdateSerializer, responses={200: UserProfileUpdateSerializer})
    def patch(self, request, *args, **kwargs): return super().partial_update(request, *args, **kwargs)

class UserProfileDeleteView(views.APIView):
    permission_classes = (IsAuthenticated,)
    def delete(self, request):
        user = request.user
        try:
            user.delete()
            return Response({"message": "User deleted successfully"}, status=status.HTTP_204_NO_CONTENT)
        except Exception as e:
            return Response({"error": "DELETE_FAILED", "message": f"회원 탈퇴 중 오류 발생: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class MyPageView(views.APIView):
    permission_classes = (IsAuthenticated,)
    serializer_class = MyPageRequestSerializer
    @extend_schema(request=MyPageRequestSerializer, responses={200: MyPageResponseSerializer})
    def post(self, request):
        user = request.user
        request_userid = request.data.get('userid')
        if request_userid is None: return Response({"error": "MISSING_PARAMETER", "message": "userid 파라미터가 누락되었습니둥"}, status=status.HTTP_400_BAD_REQUEST)
        try:
            if int(user.id) != int(request_userid): return Response({"error": "NOT_USER_DATA", "message": "인증 정보와 요청한 유저 ID가 일치하지 않습니둥"}, status=status.HTTP_404_NOT_FOUND)
        except (ValueError, TypeError): return Response({"error": "INVALID_PARAMETER", "message": "userid는 숫자 형식이어야 합니둥"}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            userdata = {
                "userid": user.id, 
                "username": user.username, 
                "useremail": user.email, 
                "firstname": user.first_name, 
                "lastname": user.last_name,
                "login_type": user.login_type,
                "onboarding": user.is_onboarding_completed,
                "is_superuser": user.is_superuser # 마이페이지 데이터에도 추가
            }
            watchtime_sum = UserMovieHistory.objects.filter(user=user).aggregate(Sum('watch_time'))['watch_time__sum'] or 0
            usermylist_count = UserLikeList.objects.filter(user=user).count()
            record_movies_qs = UserMovieHistory.objects.filter(user=user).select_related('movie').order_by('-watched_at')[:10]
            recordmovie = {}
            for history in record_movies_qs:
                recordmovie[str(history.movie.movie_id)] = {"recordmovie_name": history.movie.title, "recordmovie_poster": history.movie.poster_path}
            like_movies_qs = UserLikeList.objects.filter(user=user).select_related('movie').order_by('-created_at')[:10]
            mylistmovie = {}
            for item in like_movies_qs:
                mylistmovie[str(item.movie.movie_id)] = {"mylistmovie_name": item.movie.title, "mylistmovie_poster": item.movie.poster_path}
            return Response({"userdata": userdata, "watchtime": watchtime_sum, "usermylist": usermylist_count, "recordmovie": recordmovie, "mylistmovie": mylistmovie}, status=status.HTTP_200_OK)
        except Exception as e: return Response({"error": "SERVER_ERROR", "message": f"데이터 조회 중 서버 에러 발생: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

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
            user = User.objects.create_user(username=username, email=email or f"{username}@kakao.com", password=None, first_name=nickname, login_type='kakao')
        update_last_login(None, user)
        refresh = RefreshToken.for_user(user)
        return Response({"message": "로그인 성공", "user": {"userid": user.id, "username": user.username, "useremail": user.email, "firstname": user.first_name, "lastname": user.last_name, "onboarding": user.is_onboarding_completed, "login_type": user.login_type, "is_superuser": user.is_superuser}, "token": str(refresh.access_token), "refresh": str(refresh)})

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
            user = User.objects.create_user(username=username, email=email or f"{username}@google.com", password=None, first_name=first_name, last_name=last_name, login_type='google')
        update_last_login(None, user)
        refresh = RefreshToken.for_user(user)
        return Response({"message": "로그인 성공", "user": {"userid": user.id, "username": user.username, "useremail": user.email, "firstname": user.first_name, "lastname": user.last_name, "onboarding": user.is_onboarding_completed, "login_type": user.login_type, "is_superuser": user.is_superuser}, "token": str(refresh.access_token), "refresh": str(refresh)})

class WatchHistoryView(views.APIView):
    permission_classes = (IsAuthenticated,)
    serializer_class = WatchHistorySerializer
    @extend_schema(request=WatchHistorySerializer)
    def post(self, request):
        serializer = WatchHistorySerializer(data=request.data)
        if not serializer.is_valid(): return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        movie_id, watch_time = serializer.validated_data['movie_id'], serializer.validated_data['watch_time']
        try: movie = Movie.objects.get(movie_id=movie_id)
        except Movie.DoesNotExist: return Response({"error": "해당 영화를 찾을 수 없습니다."}, status=status.HTTP_404_NOT_FOUND)
        if watch_time < 3: return Response({"message": "시청 시간이 짧아 기록되지 않았습니둥.", "movie_id": movie_id, "watch_time": watch_time}, status=status.HTTP_200_OK)
        UserMovieHistory.objects.create(user=request.user, movie=movie, watch_time=watch_time)
        return Response({"message": "시청 기록이 저장되었습니다.", "movie_id": movie_id, "watch_time": watch_time}, status=status.HTTP_201_CREATED)

class OnboardingView(views.APIView):
    permission_classes = (IsAuthenticated,)
    serializer_class = OnboardingSerializer
    @extend_schema(request=OnboardingSerializer)
    def post(self, request):
        user = request.user
        if user.is_onboarding_completed: return Response({"error": "이미 온보딩을 완료한 사용자입니둥."}, status=status.HTTP_400_BAD_REQUEST)
        serializer = OnboardingSerializer(data=request.data)
        if not serializer.is_valid(): return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        for field, is_selected in serializer.validated_data.items():
            if is_selected:
                current_val = getattr(user, field, 0) or 0
                setattr(user, field, current_val + 50)
        user.is_onboarding_completed = True
        user.save()
        return Response({"status": "success", "message": "온보딩이 완료되었습니다.", "onboarding": user.is_onboarding_completed})
