from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password

User = get_user_model()

class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    password_confirm = serializers.CharField(write_only=True, required=True)
    
    # Explicitly set genre fields as optional
    pref_action = serializers.BooleanField(required=False, default=False)
    pref_adventure = serializers.BooleanField(required=False, default=False)
    pref_animation = serializers.BooleanField(required=False, default=False)
    pref_comedy = serializers.BooleanField(required=False, default=False)
    pref_crime = serializers.BooleanField(required=False, default=False)
    pref_documentary = serializers.BooleanField(required=False, default=False)
    pref_drama = serializers.BooleanField(required=False, default=False)
    pref_family = serializers.BooleanField(required=False, default=False)
    pref_fantasy = serializers.BooleanField(required=False, default=False)
    pref_history = serializers.BooleanField(required=False, default=False)
    pref_horror = serializers.BooleanField(required=False, default=False)
    pref_music = serializers.BooleanField(required=False, default=False)
    pref_mystery = serializers.BooleanField(required=False, default=False)
    pref_romance = serializers.BooleanField(required=False, default=False)
    pref_science_fiction = serializers.BooleanField(required=False, default=False)
    pref_tv_movie = serializers.BooleanField(required=False, default=False)
    pref_thriller = serializers.BooleanField(required=False, default=False)
    pref_war = serializers.BooleanField(required=False, default=False)
    pref_western = serializers.BooleanField(required=False, default=False)

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
    access_token = serializers.CharField(required=True)