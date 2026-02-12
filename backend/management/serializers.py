from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from movies.models import Movie
from home.models import MovieReview

User = get_user_model()

class AdminUserSerializer(serializers.ModelSerializer):
    """관리자용 유저 상세 조회 및 수정 시리얼라이저 (모든 필드 포함)"""
    class Meta:
        model = User
        fields = '__all__'
        read_only_fields = ('date_joined', 'last_login')

class AdminUserCreateSerializer(serializers.ModelSerializer):
    """관리자용 유저 생성 전용 시리얼라이저 (필수 항목 위주)"""
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])

    class Meta:
        model = User
        fields = ('username', 'password', 'email', 'first_name', 'last_name', 'login_type')

    def create(self, validated_data):
        return User.objects.create_user(**validated_data)

class AdminMovieSerializer(serializers.ModelSerializer):
    """관리자용 영화 관리 시리얼라이저"""
    class Meta:
        model = Movie
        fields = '__all__'

class AdminReviewSerializer(serializers.ModelSerializer):
    """관리자용 리뷰 관리 시리얼라이저"""
    author_name = serializers.ReadOnlyField(source='author.username')
    movie_title = serializers.ReadOnlyField(source='movie.title')

    class Meta:
        model = MovieReview
        fields = '__all__'
