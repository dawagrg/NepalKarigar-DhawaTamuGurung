from django.contrib.auth import get_user_model, authenticate
from django.utils import timezone
from datetime import timedelta
from rest_framework.decorators import api_view, permission_classes, parser_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.response import Response
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from .models import PasswordResetToken

User = get_user_model()


def get_tokens_for_user(user):
    refresh = RefreshToken.for_user(user)
    return {
        "refresh": str(refresh),
        "access": str(refresh.access_token),
    }


def user_data(user, request=None):
    """Helper — returns consistent user payload across all endpoints."""
    profile_image_url = None
    if user.profile_image:
        if request:
            profile_image_url = request.build_absolute_uri(user.profile_image.url)
        else:
            profile_image_url = user.profile_image.url
    return {
        "user_id": user.id,
        "username": user.username,
        "role": user.role,
        "email": user.email,
        "first_name": user.first_name,
        "last_name": user.last_name,
        "phone_number": user.phone_number,
        "bio": user.bio or "",
        "address": user.address or "",
        "profile_image": profile_image_url,
        "date_joined": user.date_joined.strftime("%Y-%m-%d"),
    }


# ─────────────────────────────────────────
#  2.2.1  REGISTER
# ─────────────────────────────────────────
@api_view(["POST"])
def register_user(request):
    username     = request.data.get("username", "").strip()
    password     = request.data.get("password", "")
    phone_number = request.data.get("phone_number", "").strip()
    email        = request.data.get("email", "").strip()
    first_name   = request.data.get("first_name", "").strip()
    last_name    = request.data.get("last_name", "").strip()
    role         = request.data.get("role", "customer").strip().lower()

    # ── Validation ──
    if not username or not password:
        return Response({"error": "Username and password are required"},
                        status=status.HTTP_400_BAD_REQUEST)
    if not phone_number:
        return Response({"error": "Phone number is required"},
                        status=status.HTTP_400_BAD_REQUEST)
    if role not in ("customer", "karigar"):
        return Response({"error": "Role must be either 'customer' or 'karigar'"},
                        status=status.HTTP_400_BAD_REQUEST)
    if len(password) < 8:
        return Response({"error": "Password must be at least 8 characters"},
                        status=status.HTTP_400_BAD_REQUEST)
    if User.objects.filter(username=username).exists():
        return Response({"error": "Username already exists"},
                        status=status.HTTP_400_BAD_REQUEST)
    if User.objects.filter(phone_number=phone_number).exists():
        return Response({"error": "Phone number already registered"},
                        status=status.HTTP_400_BAD_REQUEST)
    if email and User.objects.filter(email=email).exists():
        return Response({"error": "Email already registered"},
                        status=status.HTTP_400_BAD_REQUEST)

    user = User.objects.create_user(
        username=username,
        phone_number=phone_number,
        password=password,
        email=email,
        first_name=first_name,
        last_name=last_name,
        role=role,
    )

    tokens = get_tokens_for_user(user)
    return Response({
        "message": f"Registered successfully as {role.capitalize()}!",
        **user_data(user, request),
        **tokens,
    }, status=status.HTTP_201_CREATED)


# ─────────────────────────────────────────
#  2.2.1  LOGIN
# ─────────────────────────────────────────
@api_view(["POST"])
def login_user(request):
    username = request.data.get("username", "").strip()
    password = request.data.get("password", "")

    if not username or not password:
        return Response({"error": "Username and password are required"},
                        status=status.HTTP_400_BAD_REQUEST)

    user = authenticate(username=username, password=password)

    # Fallback: phone number login
    if user is None:
        try:
            user_obj = User.objects.get(phone_number=username)
            user = authenticate(username=user_obj.username, password=password)
        except User.DoesNotExist:
            pass

    if user is None:
        return Response({"error": "Invalid credentials"},
                        status=status.HTTP_401_UNAUTHORIZED)

    tokens = get_tokens_for_user(user)
    return Response({
        "message": f"Welcome back, {user.username}!",
        **user_data(user, request),
        **tokens,
    })


# ─────────────────────────────────────────
#  2.2.2  FORGOT PASSWORD
# ─────────────────────────────────────────
@api_view(["POST"])
def forgot_password(request):
    identifier = request.data.get("identifier", "").strip()
    if not identifier:
        return Response({"error": "Phone number or email is required"},
                        status=status.HTTP_400_BAD_REQUEST)

    user = None
    try:
        user = User.objects.get(phone_number=identifier)
    except User.DoesNotExist:
        pass

    if user is None:
        try:
            user = User.objects.get(email=identifier)
        except User.DoesNotExist:
            pass

    if user is None:
        return Response({"message": "If the account exists, a reset token has been sent."})

    PasswordResetToken.objects.filter(user=user, is_used=False).update(is_used=True)
    reset_token = PasswordResetToken.objects.create(user=user)

    return Response({
        "message": "Password reset token generated successfully.",
        "reset_token": str(reset_token.token),
        "note": "Token expires in 1 hour."
    })


# ─────────────────────────────────────────
#  2.2.2  RESET PASSWORD
# ─────────────────────────────────────────
@api_view(["POST"])
def reset_password(request):
    token_str        = request.data.get("reset_token", "").strip()
    new_password     = request.data.get("new_password", "")
    confirm_password = request.data.get("confirm_password", "")

    if not token_str or not new_password or not confirm_password:
        return Response({"error": "All fields are required"},
                        status=status.HTTP_400_BAD_REQUEST)
    if new_password != confirm_password:
        return Response({"error": "Passwords do not match"},
                        status=status.HTTP_400_BAD_REQUEST)
    if len(new_password) < 8:
        return Response({"error": "Password must be at least 8 characters"},
                        status=status.HTTP_400_BAD_REQUEST)

    try:
        reset_token = PasswordResetToken.objects.get(token=token_str, is_used=False)
    except PasswordResetToken.DoesNotExist:
        return Response({"error": "Invalid or already used reset token"},
                        status=status.HTTP_400_BAD_REQUEST)

    if timezone.now() > reset_token.created_at + timedelta(hours=1):
        reset_token.is_used = True
        reset_token.save()
        return Response({"error": "Reset token has expired. Please request a new one."},
                        status=status.HTTP_400_BAD_REQUEST)

    user = reset_token.user
    user.set_password(new_password)
    user.save()
    reset_token.is_used = True
    reset_token.save()

    return Response({"message": "Password reset successfully. You can now log in."})


# ─────────────────────────────────────────
#  2.3  GET PROFILE
# ─────────────────────────────────────────
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_profile(request):
    return Response(user_data(request.user, request))


# ─────────────────────────────────────────
#  2.3  UPDATE PROFILE
# ─────────────────────────────────────────
@api_view(["PUT", "PATCH"])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser, FormParser, JSONParser])
def update_profile(request):
    user = request.user

    user.first_name = request.data.get("first_name", user.first_name)
    user.last_name  = request.data.get("last_name",  user.last_name)
    user.bio        = request.data.get("bio",        user.bio)
    user.address    = request.data.get("address",    user.address)

    # Phone uniqueness
    new_phone = request.data.get("phone_number", user.phone_number)
    if new_phone != user.phone_number:
        if User.objects.filter(phone_number=new_phone).exists():
            return Response({"error": "Phone number already in use"},
                            status=status.HTTP_400_BAD_REQUEST)
        user.phone_number = new_phone

    # Email uniqueness
    new_email = request.data.get("email", user.email)
    if new_email and new_email != user.email:
        if User.objects.filter(email=new_email).exclude(pk=user.pk).exists():
            return Response({"error": "Email already in use"},
                            status=status.HTTP_400_BAD_REQUEST)
        user.email = new_email

    if "profile_image" in request.FILES:
        user.profile_image = request.FILES["profile_image"]

    user.save()

    return Response({
        "message": "Profile updated successfully",
        **user_data(user, request),
    })


# ─────────────────────────────────────────
#  2.3  CHANGE PASSWORD
# ─────────────────────────────────────────
@api_view(["POST"])
@permission_classes([IsAuthenticated])
def change_password(request):
    user             = request.user
    old_password     = request.data.get("old_password", "")
    new_password     = request.data.get("new_password", "")
    confirm_password = request.data.get("confirm_password", "")

    if not old_password or not new_password or not confirm_password:
        return Response({"error": "All fields are required"},
                        status=status.HTTP_400_BAD_REQUEST)
    if not user.check_password(old_password):
        return Response({"error": "Current password is incorrect"},
                        status=status.HTTP_400_BAD_REQUEST)
    if new_password != confirm_password:
        return Response({"error": "New passwords do not match"},
                        status=status.HTTP_400_BAD_REQUEST)
    if len(new_password) < 8:
        return Response({"error": "Password must be at least 8 characters"},
                        status=status.HTTP_400_BAD_REQUEST)

    user.set_password(new_password)
    user.save()

    tokens = get_tokens_for_user(user)
    return Response({"message": "Password changed successfully.", **tokens})