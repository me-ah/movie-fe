import os
import requests
from django.contrib.auth import get_user_model, authenticate
from rest_framework import status, generics, views
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework_simplejwt.tokens import RefreshToken
from .serializers import UserRegistrationSerializer, ChangePasswordSerializer, SocialLoginSerializer

User = get_user_model()

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = (AllowAny,)
    serializer_class = UserRegistrationSerializer

class ChangePasswordView(views.APIView):
    permission_classes = (IsAuthenticated,)

    def post(self, request):
        user = request.user
        if user.login_type != 'email':
            return Response({"error": "Social login users cannot change password."}, status=status.HTTP_400_BAD_REQUEST)
        
        serializer = ChangePasswordSerializer(data=request.data)

        if serializer.is_valid():
            if not user.check_password(serializer.data.get("old_password")):
                return Response({"old_password": ["Wrong password."]}, status=status.HTTP_400_BAD_REQUEST)

            user.set_password(serializer.data.get("new_password"))
            user.save()
            return Response({
                'status': 'success',
                'message': 'Password updated successfully'
            }, status=status.HTTP_200_OK)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class KakaoLoginView(views.APIView):
    permission_classes = (AllowAny,)

    def post(self, request):
        access_token = request.data.get('access_token')
        if not access_token:
            return Response({'error': 'Access token required'}, status=status.HTTP_400_BAD_REQUEST)

        # Verify token with Kakao
        user_info_url = "https://kapi.kakao.com/v2/user/me"
        headers = {'Authorization': f'Bearer {access_token}'}
        user_info_response = requests.get(user_info_url, headers=headers)

        if user_info_response.status_code != 200:
            return Response({'error': 'Invalid Kakao token'}, status=status.HTTP_401_UNAUTHORIZED)

        user_info = user_info_response.json()
        kakao_id = user_info.get('id')
        kakao_account = user_info.get('kakao_account')
        email = kakao_account.get('email')
        nickname = kakao_account.get('profile', {}).get('nickname', '')

        if not email:
             return Response({'error': 'Email not provided by Kakao account'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = User.objects.get(email=email)
            if user.login_type != 'kakao':
                return Response({'error': 'Email already registered with different login type'}, status=status.HTTP_400_BAD_REQUEST)
        except User.DoesNotExist:
            # Create new user
            user = User.objects.create_user(
                username=f"kakao_{kakao_id}", # Ensure unique username
                email=email,
                password=None, # Unusable password
                first_name=nickname,
                login_type='kakao'
            )
            user.save()

        refresh = RefreshToken.for_user(user)
        return Response({
            'refresh': str(refresh),
            'access': str(refresh.access_token),
        })

class GoogleLoginView(views.APIView):
    permission_classes = (AllowAny,)

    def post(self, request):
        access_token = request.data.get('access_token')
        if not access_token:
            return Response({'error': 'Access token required'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Google user info endpoint
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
            'refresh': str(refresh),
            'access': str(refresh.access_token),
        })