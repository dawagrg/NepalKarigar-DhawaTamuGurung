from rest_framework import serializers
from .models import User, KarigarProfile


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "email",
            "user_type",
            "phone",
            "location",
        ]


class RegisterSerializer(serializers.ModelSerializer):

    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = [
            "username",
            "email",
            "password",
            "user_type",
            "phone",
            "location",
        ]

    def create(self, validated_data):
        user = User.objects.create_user(**validated_data)
        return user


class KarigarProfileSerializer(serializers.ModelSerializer):

    user = UserSerializer()

    class Meta:
        model = KarigarProfile
        fields = "__all__"