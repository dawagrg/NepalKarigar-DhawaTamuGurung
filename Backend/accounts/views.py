import uuid
from datetime import timedelta, datetime, timezone

from django.contrib.auth import get_user_model, authenticate
from django.utils import timezone as dj_timezone

from rest_framework              import status
from rest_framework.decorators   import api_view, permission_classes
from rest_framework.permissions  import IsAuthenticated
from rest_framework.response     import Response
from rest_framework_simplejwt.tokens import RefreshToken

from .models import PasswordResetToken

User = get_user_model()


# ── helpers ───────────────────────────────────────────────────────────────────

def _tokens(user):
    refresh = RefreshToken.for_user(user)
    return {"refresh": str(refresh), "access": str(refresh.access_token)}


def _user_data(user, request=None):
    """Return user dict with full absolute URL for profile_image."""
    image_url = None
    if user.profile_image:
        if request:
            image_url = request.build_absolute_uri(user.profile_image.url)
        else:
            image_url = user.profile_image.url   # relative fallback
    return {
        "user_id":       user.id,
        "username":      user.username,
        "first_name":    user.first_name,
        "last_name":     user.last_name,
        "email":         user.email,
        "phone_number":  user.phone_number,
        "role":          user.role,
        "bio":           user.bio or "",
        "address":       user.address or "",
        "profile_image": image_url,
        "date_joined":   user.date_joined.strftime("%Y-%m-%d") if user.date_joined else "",
    }


# ── 2.2.1  Register ───────────────────────────────────────────────────────────

@api_view(["POST"])
def register_user(request):
    data = request.data

    username     = data.get("username", "").strip()
    phone_number = data.get("phone_number", "").strip()
    email        = data.get("email", "").strip()
    first_name   = data.get("first_name", "").strip()
    last_name    = data.get("last_name", "").strip()
    password     = data.get("password", "")
    role         = data.get("role", "customer")

    if not username:
        return Response({"error": "Username is required."}, status=400)
    if not phone_number:
        return Response({"error": "Phone number is required."}, status=400)
    if not password:
        return Response({"error": "Password is required."}, status=400)

    if User.objects.filter(username=username).exists():
        return Response({"error": "Username already taken."}, status=400)
    if User.objects.filter(phone_number=phone_number).exists():
        return Response({"error": "Phone number already registered."}, status=400)
    if email and User.objects.filter(email=email).exists():
        return Response({"error": "Email address already registered."}, status=400)

    user = User.objects.create_user(
        username=username,
        password=password,
        phone_number=phone_number,
        email=email,
        first_name=first_name,
        last_name=last_name,
        role=role,
    )

    tokens = _tokens(user)
    return Response({**tokens, **_user_data(user, request), "message": "Account created successfully."}, status=201)


# ── 2.2.1  Login ──────────────────────────────────────────────────────────────

@api_view(["POST"])
def login_user(request):
    identifier = request.data.get("username", "").strip()
    password   = request.data.get("password", "")

    if not identifier or not password:
        return Response({"error": "Phone/email and password are required."}, status=400)

    # Try authenticating by username directly
    user = authenticate(username=identifier, password=password)

    # If that fails, try looking up by phone number
    if user is None:
        try:
            user_obj = User.objects.get(phone_number=identifier)
            user = authenticate(username=user_obj.username, password=password)
        except User.DoesNotExist:
            pass

    # Also try by email
    if user is None:
        try:
            user_obj = User.objects.get(email=identifier)
            user = authenticate(username=user_obj.username, password=password)
        except User.DoesNotExist:
            pass

    if user is None:
        return Response({"error": "Incorrect phone number/email or password."}, status=401)

    tokens = _tokens(user)
    return Response({**tokens, **_user_data(user, request)})


# ── 2.2.2  Forgot Password ────────────────────────────────────────────────────

@api_view(["POST"])
def forgot_password(request):
    identifier = request.data.get("identifier", "").strip()
    if not identifier:
        return Response({"error": "Please provide a phone number or email."}, status=400)

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
        return Response({"error": "No account found with that phone number or email."}, status=404)

    token = PasswordResetToken.objects.create(user=user)
    return Response({
        "message":     "Reset token generated. Use it to set a new password within 1 hour.",
        "reset_token": str(token.token),
    })


# ── 2.2.2  Reset Password ─────────────────────────────────────────────────────

@api_view(["POST"])
def reset_password(request):
    token_str        = request.data.get("reset_token", "").strip()
    new_password     = request.data.get("new_password", "")
    confirm_password = request.data.get("confirm_password", "")

    if not token_str:
        return Response({"error": "Reset token is required."}, status=400)
    if not new_password or not confirm_password:
        return Response({"error": "Both password fields are required."}, status=400)
    if new_password != confirm_password:
        return Response({"error": "Passwords do not match."}, status=400)
    if len(new_password) < 8:
        return Response({"error": "Password must be at least 8 characters."}, status=400)

    try:
        token = PasswordResetToken.objects.get(token=token_str, is_used=False)
    except PasswordResetToken.DoesNotExist:
        return Response({"error": "Invalid or already used token."}, status=400)

    # Check expiry (1 hour)
    age = dj_timezone.now() - token.created_at
    if age > timedelta(hours=1):
        return Response({"error": "Token has expired. Please request a new one."}, status=400)

    token.user.set_password(new_password)
    token.user.save()
    token.is_used = True
    token.save()

    return Response({"message": "Password updated successfully."})


# ── 2.3  Get Profile ──────────────────────────────────────────────────────────

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_profile(request):
    return Response(_user_data(request.user, request))


# ── 2.3  Update Profile ───────────────────────────────────────────────────────

@api_view(["PATCH"])
@permission_classes([IsAuthenticated])
def update_profile(request):
    user = request.user
    data = request.data

    for field in ("first_name", "last_name", "email", "bio", "address"):
        val = data.get(field)
        if val is not None:
            setattr(user, field, val)

    # Phone — check uniqueness before saving
    phone = data.get("phone_number")
    if phone and phone != user.phone_number:
        if User.objects.filter(phone_number=phone).exclude(pk=user.pk).exists():
            return Response({"error": "That phone number is already in use."}, status=400)
        user.phone_number = phone

    # Profile image
    if "profile_image" in request.FILES:
        user.profile_image = request.FILES["profile_image"]

    user.save()
    return Response(_user_data(user, request))


# ── 2.3  Change Password ──────────────────────────────────────────────────────

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def change_password(request):
    user             = request.user
    old_password     = request.data.get("old_password", "")
    new_password     = request.data.get("new_password", "")
    confirm_password = request.data.get("confirm_password", "")

    if not user.check_password(old_password):
        return Response({"error": "Current password is incorrect."}, status=400)
    if new_password != confirm_password:
        return Response({"error": "New passwords do not match."}, status=400)
    if len(new_password) < 8:
        return Response({"error": "Password must be at least 8 characters."}, status=400)

    user.set_password(new_password)
    user.save()

    tokens = _tokens(user)
    return Response({**tokens, "message": "Password changed successfully."})