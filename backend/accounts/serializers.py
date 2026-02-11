from rest_framework import serializers
from django.contrib.auth import get_user_model, authenticate
from django.contrib.auth.password_validation import validate_password
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

User = get_user_model()

class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    password_confirm = serializers.CharField(write_only=True, required=True)
    
    pref_action = serializers.IntegerField(required=False, default=0)
    pref_adventure = serializers.IntegerField(required=False, default=0)
    pref_animation = serializers.IntegerField(required=False, default=0)
    pref_comedy = serializers.IntegerField(required=False, default=0)
    pref_crime = serializers.IntegerField(required=False, default=0)
    pref_documentary = serializers.IntegerField(required=False, default=0)
    pref_drama = serializers.IntegerField(required=False, default=0)
    pref_family = serializers.IntegerField(required=False, default=0)
    pref_fantasy = serializers.IntegerField(required=False, default=0)
    pref_history = serializers.IntegerField(required=False, default=0)
    pref_horror = serializers.IntegerField(required=False, default=0)
    pref_music = serializers.IntegerField(required=False, default=0)
    pref_mystery = serializers.IntegerField(required=False, default=0)
    pref_romance = serializers.IntegerField(required=False, default=0)
    pref_science_fiction = serializers.IntegerField(required=False, default=0)
    pref_tv_movie = serializers.IntegerField(required=False, default=0)
    pref_thriller = serializers.IntegerField(required=False, default=0)
    pref_war = serializers.IntegerField(required=False, default=0)
    pref_western = serializers.IntegerField(required=False, default=0)

    class Meta:
        model = User
        fields = (
            'username', 'email', 'password', 'password_confirm', 'first_name', 'last_name',
            'pref_action', 'pref_adventure', 'pref_animation', 'pref_comedy', 'pref_crime',
            'pref_documentary', 'pref_drama', 'pref_family', 'pref_fantasy', 'pref_history',
            'pref_horror', 'pref_music', 'pref_mystery', 'pref_romance', 'pref_science_fiction',
            'pref_tv_movie', 'pref_thriller', 'pref_war', 'pref_western'
        )

    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError({"password": "비밀번호가 일치하지 않습니다."})
        return attrs

    def create(self, validated_data):
        validated_data.pop('password_confirm')
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
            login_type='email'
        )
        for key, value in validated_data.items():
            if key.startswith('pref_'):
                setattr(user, key, value)
        user.save()
        return user

class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True, validators=[validate_password])
    new_password_confirm = serializers.CharField(required=True)

    def validate(self, attrs):
        if attrs['new_password'] != attrs['new_password_confirm']:
            raise serializers.ValidationError({"new_password": "비밀번호 확인이 일치하지 않습니다."})
        return attrs

class SocialLoginSerializer(serializers.Serializer):
    access_token = serializers.CharField(
        required=True, 
        help_text="소셜 서비스(카카오/구글)에서 발급받은 액세스 토큰입니다."
    )

class UserDataSerializer(serializers.Serializer):
    userid = serializers.IntegerField(source='id')
    username = serializers.CharField()
    useremail = serializers.EmailField(source='email')
    firstname = serializers.CharField(source='first_name')
    lastname = serializers.CharField(source='last_name')

class LoginResponseSerializer(serializers.Serializer):
    message = serializers.CharField()
    user = UserDataSerializer()
    token = serializers.CharField()
    refresh = serializers.CharField()

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        username = attrs.get("username")
        password = attrs.get("password")
        user = authenticate(username=username, password=password)
        if not user:
            try:
                user_obj = User.objects.get(email=username)
                user = authenticate(username=user_obj.username, password=password)
            except User.DoesNotExist:
                pass
        if not user:
            raise serializers.ValidationError('아이디 또는 비밀번호가 일치하지 않습니다.')
        refresh = self.get_token(user)
        return {
            "message": "로그인 성공",
            "user": {
                "userid": user.id,
                "username": user.username,
                "useremail": user.email,
                "firstname": user.first_name,
                "lastname": user.last_name
            },
            "token": str(refresh.access_token),
            "refresh": str(refresh)
        }

# ========== MyPage Serializers ==========

class MyPageRequestSerializer(serializers.Serializer):
    userid = serializers.IntegerField()

class MovieMiniSerializer(serializers.Serializer):
    """Simplified movie info for MyPage"""
    name = serializers.CharField(source='title')
    poster = serializers.URLField(source='poster_path')

class MyPageResponseSerializer(serializers.Serializer):
    userdata = UserDataSerializer()
    watchtime = serializers.IntegerField()
    usermylist = serializers.IntegerField()
    recordmovie = serializers.DictField(child=serializers.DictField())
    mylistmovie = serializers.DictField(child=serializers.DictField())


# ========== Watch History Serializer ==========
class WatchHistorySerializer(serializers.Serializer):
    movie_id = serializers.CharField()
    watch_time = serializers.IntegerField(min_value=1)

