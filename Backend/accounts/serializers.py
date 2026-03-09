from rest_framework import serializers
from .models import User, KarigarProfile
from django.contrib.auth import authenticate


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['username', 'phone_number', 'password']

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            phone_number=validated_data['phone_number'],
            password=validated_data['password']
        )
        return user


class LoginSerializer(serializers.Serializer):
    username_or_phone = serializers.CharField()
    password = serializers.CharField()

    def validate(self, data):
        username_or_phone = data.get("username_or_phone")
        password = data.get("password")

        user = authenticate(username=username_or_phone, password=password)

        if not user:
            try:
                user_obj = User.objects.get(phone_number=username_or_phone)
                user = authenticate(username=user_obj.username, password=password)
            except User.DoesNotExist:
                raise serializers.ValidationError("Invalid credentials")

        if not user:
            raise serializers.ValidationError("Invalid credentials")

        data["user"] = user
        return data