from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password

User = get_user_model()

class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    password_confirm = serializers.CharField(write_only=True, required=True)
    
    # Genre fields as Integer (optional, default 0)
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
            raise serializers.ValidationError({"password": "Password fields didn't match."})
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
        # Set preferences if provided
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
            raise serializers.ValidationError({"new_password": "New password fields didn't match."})
        return attrs

class SocialLoginSerializer(serializers.Serializer):
    access_token = serializers.CharField(
        required=True, 
        help_text="소셜 서비스(카카오/구글)에서 발급받은 액세스 토큰입니다."
    )
