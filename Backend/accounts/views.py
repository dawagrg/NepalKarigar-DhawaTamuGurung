from django.contrib.auth        import authenticate
from django.db.models           import Q, Avg
from django.utils               import timezone as dj_timezone
from rest_framework.decorators  import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response    import Response
from rest_framework_simplejwt.tokens import RefreshToken

from .models import (
    User, PasswordResetToken, ServiceCategory, SubService,
    KarigarProfile, KarigarGallery, Booking, Review, KarigarApplication,
    AdminNotification, Complaint, ContactMessage,
)

# ══════════════════════════════════════════════════════════════════════════════
#  HELPERS
# ══════════════════════════════════════════════════════════════════════════════

def _tokens(user):
    refresh = RefreshToken.for_user(user)
    return {"refresh": str(refresh), "access": str(refresh.access_token)}


def _abs_url(request, relative_url):
    if request:
        return request.build_absolute_uri(relative_url)
    return relative_url


def _user_data(user, request=None):
    img = None
    if user.profile_image:
        img = _abs_url(request, user.profile_image.url)
    kp_id = None
    try:
        kp_id = user.karigar_profile.id
    except Exception:
        pass
    # Staff/superusers show "admin" role regardless of their user.role field
    effective_role = "admin" if (user.is_staff or user.is_superuser) else user.role
    return {
        "user_id":       user.id,
        "username":      user.username,
        "first_name":    user.first_name,
        "last_name":     user.last_name,
        "email":         user.email,
        "phone_number":  user.phone_number,
        "role":          effective_role,
        "bio":           user.bio,
        "address":       user.address,
        "profile_image": img,
        "karigar_profile_id": kp_id,
        "is_staff":      user.is_staff or user.is_superuser,
    }


def _karigar_data(kp, request=None):
    img = None
    if kp.user.profile_image:
        img = _abs_url(request, kp.user.profile_image.url)
    gallery = []
    for g in kp.gallery.all():
        gallery.append({
            "id":      g.id,
            "image":   _abs_url(request, g.image.url),
            "caption": g.caption,
        })
    sub_services = [
        {"id": ss.id, "name": ss.name, "base_price": str(ss.base_price) if ss.base_price else ""}
        for ss in kp.sub_services.filter(is_active=True)
    ]
    return {
        "karigar_profile_id": kp.id,
        "user_id":        kp.user.id,
        "username":       kp.user.username,
        "full_name":      f"{kp.user.first_name} {kp.user.last_name}".strip() or kp.user.username,
        "profile_image":  img,
        "role":           kp.user.role,
        "bio":            kp.user.bio,
        "phone_number":   kp.user.phone_number,
        "email":          kp.user.email,
        "category":       kp.category.name if kp.category else "",
        "category_id":    kp.category.id   if kp.category else None,
        "sub_services":   sub_services,
        "experience_years": kp.experience_years,
        "hourly_rate":    str(kp.hourly_rate) if kp.hourly_rate else "",
        "location":       kp.location,
        "district":       kp.district,
        "available":      kp.available,
        "is_verified":    kp.is_verified,
        "total_jobs":     kp.total_jobs,
        "avg_rating":     str(kp.avg_rating),
        "gallery":        gallery,
    }


def _get_karigar_profile_id(karigar_user):
    """Return the KarigarProfile pk for a karigar User, or None."""
    try:
        return karigar_user.karigar_profile.id
    except Exception:
        return None


def _booking_data(b, request=None):
    cust_img = None
    if b.user.profile_image:
        cust_img = _abs_url(request, b.user.profile_image.url)
    kar_img = None
    if b.karigar.profile_image:
        kar_img = _abs_url(request, b.karigar.profile_image.url)

    has_review = Review.objects.filter(booking=b).exists()

    return {
        "id":               b.id,
        "customer_id":      b.user.id,
        "customer_name":    f"{b.user.first_name} {b.user.last_name}".strip() or b.user.username,
        "customer_username":b.user.username,
        "customer_phone":   b.user.phone_number,
        "customer_image":   cust_img,
        "karigar_user_id":  b.karigar.id,
        "karigar_name":     f"{b.karigar.first_name} {b.karigar.last_name}".strip() or b.karigar.username,
        "karigar_username": b.karigar.username,
        "karigar_phone":    b.karigar.phone_number,
        "karigar_image":    kar_img,
        "karigar_profile_id": _get_karigar_profile_id(b.karigar),
        "sub_service_id":   b.sub_service.id   if b.sub_service else None,
        "sub_service_name": b.sub_service.name if b.sub_service else "General",
        "address":          b.address,
        "date":             str(b.date),
        "note":             b.note,
        "status":           b.status,
        "karigar_rate":     str(b.karigar_rate)  if b.karigar_rate  else "",
        "offered_rate":     str(b.offered_rate)  if b.offered_rate  else "",
        "counter_rate":     str(b.counter_rate)  if b.counter_rate  else "",
        "final_rate":       str(b.final_rate)    if b.final_rate    else "",
        "bargain_status":   b.bargain_status,
        "bargain_message":  b.bargain_message,
        "created_at":       b.created_at.isoformat() if b.created_at else "",
        "updated_at":       b.updated_at.isoformat() if b.updated_at else "",
        "has_review":       has_review,
    }


# ══════════════════════════════════════════════════════════════════════════════
#  SPRINT 1 — AUTH & PROFILE
# ══════════════════════════════════════════════════════════════════════════════

@api_view(["POST"])
@permission_classes([AllowAny])
def register_user(request):
    data = request.data
    required = ["username", "password", "role", "phone_number"]
    for field in required:
        if not data.get(field):
            return Response({"error": f"{field} is required."}, status=400)

    role = data.get("role")
    if role not in ("customer", "karigar"):
        return Response({"error": "Role must be 'customer' or 'karigar'."}, status=400)

    if User.objects.filter(username=data["username"]).exists():
        return Response({"username": ["A user with that username already exists."]}, status=400)
    if User.objects.filter(phone_number=data["phone_number"]).exists():
        return Response({"phone_number": ["Phone number already registered."]}, status=400)
    if data.get("email") and User.objects.filter(email=data["email"]).exists():
        return Response({"email": ["Email already registered."]}, status=400)

    user = User.objects.create_user(
        username=data["username"],
        password=data["password"],
        role=role,
        phone_number=data["phone_number"],
        email=data.get("email", ""),
        first_name=data.get("first_name", ""),
        last_name=data.get("last_name", ""),
    )

    if role == "karigar":
        KarigarProfile.objects.create(user=user)
        # Karigar accounts start inactive — must submit application & get admin approval
        user.is_active = False
        user.save()
        return Response({
            "requires_application": True,
            "user_id":      user.id,
            "username":     user.username,
            "phone_number": user.phone_number,
            "role":         "karigar",
            "message": "Account created. Please complete your verification application.",
        }, status=201)

    _create_admin_notification(
        type_="new_user",
        title=f"New {role.title()} Registered",
        message=f"{user.first_name or user.username} ({user.phone_number}) registered as a {role}.",
        link="/admin-dashboard",
        ref_user_id=user.id,
    )
    return Response({**_tokens(user), **_user_data(user, request)}, status=201)


@api_view(["POST"])
@permission_classes([AllowAny])
def login_user(request):
    identifier = request.data.get("username", "").strip()
    password   = request.data.get("password", "")
    if not identifier or not password:
        return Response({"error": "Phone/email and password are required."}, status=400)

    # ── Step 1: Find the user object by username / phone / email ────────────
    # We do this BEFORE authenticate() because Django's authenticate()
    # returns None for inactive (banned) users — we need to check is_active
    # ourselves to return a proper ban message instead of "incorrect credentials".
    user_obj = None
    try:
        user_obj = User.objects.get(username=identifier)
    except User.DoesNotExist:
        for field in ("phone_number", "email"):
            try:
                user_obj = User.objects.get(**{field: identifier})
                break
            except User.DoesNotExist:
                pass

    if user_obj is None:
        return Response({"error": "Incorrect credentials."}, status=401)

    # ── Step 2: Check if banned BEFORE authenticating ─────────────────────
    if not user_obj.is_active:
        reason   = user_obj.ban_reason or "No reason provided."
        ban_date = user_obj.ban_date.strftime("%Y-%m-%d") if user_obj.ban_date else ""
        return Response({
            "error":      "banned",
            "message":    "Your account has been banned by the administrator.",
            "ban_reason": reason,
            "ban_date":   ban_date,
        }, status=403)

    # ── Step 3: Verify password ───────────────────────────────────────────
    user = authenticate(username=user_obj.username, password=password)
    if user is None:
        return Response({"error": "Incorrect credentials."}, status=401)

    return Response({**_tokens(user), **_user_data(user, request)})


@api_view(["POST"])
@permission_classes([AllowAny])
def forgot_password(request):
    identifier = request.data.get("identifier", "").strip()
    if not identifier:
        return Response({"error": "Please provide a phone number or email."}, status=400)
    user = None
    for field in ("phone_number", "email"):
        try:
            user = User.objects.get(**{field: identifier})
            break
        except User.DoesNotExist:
            pass
    if not user:
        return Response({"error": "No account found."}, status=404)
    token = PasswordResetToken.objects.create(user=user)
    return Response({"message": "Token generated.", "reset_token": str(token.token)})


@api_view(["POST"])
@permission_classes([AllowAny])
def reset_password(request):
    token_str        = request.data.get("reset_token", "").strip()
    new_password     = request.data.get("new_password", "")
    confirm_password = request.data.get("confirm_password", "")
    if not token_str:
        return Response({"error": "Reset token is required."}, status=400)
    if not new_password:
        return Response({"error": "New password is required."}, status=400)
    if new_password != confirm_password:
        return Response({"error": "Passwords do not match."}, status=400)
    if len(new_password) < 8:
        return Response({"error": "Password must be at least 8 characters."}, status=400)
    try:
        import uuid
        token_obj = PasswordResetToken.objects.get(token=uuid.UUID(token_str), is_used=False)
    except Exception:
        return Response({"error": "Invalid or expired token."}, status=400)
    from datetime import timedelta
    if dj_timezone.now() - token_obj.created_at > timedelta(hours=1):
        return Response({"error": "Token has expired."}, status=400)
    user = token_obj.user
    user.set_password(new_password)
    user.save()
    token_obj.is_used = True
    token_obj.save()
    return Response({"message": "Password reset successful."})


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_profile(request):
    return Response(_user_data(request.user, request))


@api_view(["PUT", "PATCH"])
@permission_classes([IsAuthenticated])
def update_profile(request):
    user = request.user
    data = request.data
    for field in ("first_name", "last_name", "email", "bio", "address"):
        if field in data:
            setattr(user, field, data[field])
    # Handle profile image upload if included
    if "profile_image" in request.FILES:
        user.profile_image = request.FILES["profile_image"]
    user.save()
    return Response(_user_data(user, request))


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def upload_profile_image(request):
    img = request.FILES.get("profile_image")
    if not img:
        return Response({"error": "No image provided."}, status=400)
    request.user.profile_image = img
    request.user.save()
    return Response(_user_data(request.user, request))


# ── Change Password ────────────────────────────────────────────────────────────
@api_view(["POST"])
@permission_classes([IsAuthenticated])
def change_password(request):
    """
    POST /api/accounts/change-password/
    Body: { current_password, new_password }
    """
    # Accept both field names: 'current_password' (API standard) or 'old_password' (frontend form)
    current = (request.data.get("current_password") or
               request.data.get("old_password") or "").strip()
    new_pw  = request.data.get("new_password", "").strip()
    if not current or not new_pw:
        return Response({"error": "Both current and new password are required."}, status=400)
    if len(new_pw) < 8:
        return Response({"error": "New password must be at least 8 characters."}, status=400)
    if not request.user.check_password(current):
        return Response({"error": "Current password is incorrect."}, status=400)
    if current == new_pw:
        return Response({"error": "New password must be different from current password."}, status=400)
    request.user.set_password(new_pw)
    request.user.save()
    return Response({"message": "Password changed successfully."})


# ══════════════════════════════════════════════════════════════════════════════
#  SPRINT 2 — CATEGORIES & KARIGAR
# ══════════════════════════════════════════════════════════════════════════════

@api_view(["GET"])
@permission_classes([AllowAny])
def list_categories(request):
    cats = ServiceCategory.objects.filter(is_active=True).prefetch_related(
        "sub_services"
    ).order_by("name")

    result = []
    for cat in cats:
        active_subs   = cat.sub_services.filter(is_active=True)
        karigar_count = KarigarProfile.objects.filter(category=cat).count()
        result.append({
            "id":            cat.id,
            "name":          cat.name,
            "description":   cat.description,
            "icon":          cat.icon,
            "karigar_count": karigar_count,
            "sub_services": [
                {
                    "id":         s.id,
                    "name":       s.name,
                    "base_price": str(s.base_price) if s.base_price else "",
                }
                for s in active_subs
            ],
        })
    return Response(result)


@api_view(["GET"])
@permission_classes([AllowAny])
def list_karigars_by_category(request, category_id):
    try:
        cat = ServiceCategory.objects.get(pk=category_id, is_active=True)
    except ServiceCategory.DoesNotExist:
        return Response({"error": "Category not found."}, status=404)
    kps = KarigarProfile.objects.filter(
        category=cat, available=True, user__is_active=True
    ).select_related("user", "category")
    return Response([_karigar_data(kp, request) for kp in kps])


@api_view(["GET"])
@permission_classes([AllowAny])
def list_karigars(request):
    # Only show karigars whose accounts are active (approved by admin)
    return Response(
        [_karigar_data(kp, request)
         for kp in KarigarProfile.objects.select_related("user", "category")
                                         .filter(user__is_active=True)]
    )


@api_view(["GET"])
@permission_classes([AllowAny])
def karigar_public_profile(request, pk):
    try:
        kp = KarigarProfile.objects.select_related("user", "category").get(pk=pk)
    except KarigarProfile.DoesNotExist:
        return Response({"error": "Karigar not found."}, status=404)
    return Response(_karigar_data(kp, request))


@api_view(["GET"])
@permission_classes([AllowAny])
def search_karigars(request):
    # Only show karigars with active (admin-approved) accounts
    qs = KarigarProfile.objects.select_related("user", "category").prefetch_related("sub_services").filter(user__is_active=True)

    q          = request.query_params.get("q", "").strip()
    category   = request.query_params.get("category", "")
    district   = request.query_params.get("district", "").strip()
    available  = request.query_params.get("available", "")
    min_rate   = request.query_params.get("min_rate", "")
    max_rate   = request.query_params.get("max_rate", "")
    min_rating = request.query_params.get("min_rating", "")
    min_exp    = request.query_params.get("min_exp", "")
    ordering   = request.query_params.get("ordering", "rating")

    if q:
        qs = qs.filter(
            Q(user__first_name__icontains=q) |
            Q(user__last_name__icontains=q) |
            Q(user__username__icontains=q) |
            Q(category__name__icontains=q) |
            Q(sub_services__name__icontains=q) |
            Q(district__icontains=q) |
            Q(location__icontains=q)
        ).distinct()
    if category:
        try:
            qs = qs.filter(category_id=int(category))
        except ValueError:
            pass
    if district:
        qs = qs.filter(district__icontains=district)
    if available == "true":
        qs = qs.filter(available=True)
    elif available == "false":
        qs = qs.filter(available=False)
    if min_rate:
        try:
            qs = qs.filter(hourly_rate__gte=float(min_rate))
        except ValueError:
            pass
    if max_rate:
        try:
            qs = qs.filter(hourly_rate__lte=float(max_rate))
        except ValueError:
            pass
    if min_rating:
        try:
            qs = qs.filter(avg_rating__gte=float(min_rating))
        except ValueError:
            pass
    if min_exp:
        try:
            qs = qs.filter(experience_years__gte=int(min_exp))
        except ValueError:
            pass

    ORDER_MAP = {
        "rating":    "-avg_rating",
        "jobs":      "-total_jobs",
        "rate_asc":  "hourly_rate",
        "rate_desc": "-hourly_rate",
        "newest":    "-user__date_joined",
    }
    qs = qs.order_by(ORDER_MAP.get(ordering, "-avg_rating"))

    try:
        page      = max(1, int(request.query_params.get("page", 1)))
        page_size = min(30, max(5, int(request.query_params.get("page_size", 12))))
    except ValueError:
        page, page_size = 1, 12

    total  = qs.count()
    start  = (page - 1) * page_size
    kps    = qs[start: start + page_size]

    return Response({
        "total":   total,
        "page":    page,
        "pages":   (total + page_size - 1) // page_size,
        "results": [_karigar_data(kp, request) for kp in kps],
    })


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def karigar_dashboard(request):
    if request.user.role != "karigar":
        return Response({"error": "Karigar access only."}, status=403)
    try:
        kp = KarigarProfile.objects.get(user=request.user)
    except KarigarProfile.DoesNotExist:
        kp = KarigarProfile.objects.create(user=request.user)
    return Response(_karigar_data(kp, request))


@api_view(["PUT", "PATCH"])
@permission_classes([IsAuthenticated])
def update_karigar_dashboard(request):
    if request.user.role != "karigar":
        return Response({"error": "Karigar access only."}, status=403)
    try:
        kp = KarigarProfile.objects.get(user=request.user)
    except KarigarProfile.DoesNotExist:
        kp = KarigarProfile.objects.create(user=request.user)

    data = request.data
    for field in ("experience_years", "hourly_rate", "location", "district", "available", "bio"):
        if field in data:
            if field == "available":
                kp.available = str(data[field]).lower() in ("true", "1", "yes")
            else:
                setattr(kp, field, data[field])

    for field in ("first_name", "last_name", "bio", "address"):
        if field in data:
            setattr(request.user, field, data[field])
    request.user.save()

    if "category_id" in data:
        try:
            cat = ServiceCategory.objects.get(pk=int(data["category_id"]), is_active=True)
            kp.category = cat
        except (ServiceCategory.DoesNotExist, ValueError):
            pass

    if "sub_service_ids" in data:
        ids = data["sub_service_ids"]
        if isinstance(ids, str):
            import json
            try:
                ids = json.loads(ids)
            except Exception:
                ids = []
        kp.sub_services.set(SubService.objects.filter(pk__in=ids))

    kp.save()
    # Re-fetch to get accurate M2M data
    kp.refresh_from_db()
    return Response(_karigar_data(kp, request))


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def upload_gallery_image(request):
    if request.user.role != "karigar":
        return Response({"error": "Karigar access only."}, status=403)
    img = request.FILES.get("image")
    if not img:
        return Response({"error": "No image provided."}, status=400)
    try:
        kp = KarigarProfile.objects.get(user=request.user)
    except KarigarProfile.DoesNotExist:
        return Response({"error": "Karigar profile not found."}, status=404)
    g = KarigarGallery.objects.create(
        karigar=kp, image=img, caption=request.data.get("caption", "")
    )
    return Response({
        "id":      g.id,
        "image":   _abs_url(request, g.image.url),
        "caption": g.caption,
    }, status=201)


@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def delete_gallery_image(request, pk):
    if request.user.role != "karigar":
        return Response({"error": "Karigar access only."}, status=403)
    try:
        g = KarigarGallery.objects.get(pk=pk, karigar__user=request.user)
    except KarigarGallery.DoesNotExist:
        return Response({"error": "Image not found."}, status=404)
    g.image.delete(save=False)
    g.delete()
    return Response({"message": "Image deleted."})


# ══════════════════════════════════════════════════════════════════════════════
#  SPRINT 3 — BOOKINGS & BARGAINING
# ══════════════════════════════════════════════════════════════════════════════

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def create_booking(request):
    if request.user.role != "customer":
        return Response({"error": "Only customers can create bookings."}, status=403)

    karigar_profile_id = request.data.get("karigar_profile_id")
    sub_service_id     = request.data.get("sub_service_id")
    address            = request.data.get("address", "").strip()
    date_str           = request.data.get("date", "")
    note               = request.data.get("note", "")
    offered_rate       = request.data.get("offered_rate")

    if not karigar_profile_id:
        return Response({"error": "karigar_profile_id is required."}, status=400)
    if not address:
        return Response({"error": "Address is required."}, status=400)
    if not date_str:
        return Response({"error": "Date is required."}, status=400)

    try:
        from datetime import date
        booking_date = date.fromisoformat(date_str)
    except ValueError:
        return Response({"error": "Invalid date format. Use YYYY-MM-DD."}, status=400)

    if booking_date < dj_timezone.now().date():
        return Response({"error": "Booking date cannot be in the past."}, status=400)

    try:
        kp = KarigarProfile.objects.get(pk=karigar_profile_id)
    except KarigarProfile.DoesNotExist:
        return Response({"error": "Karigar not found."}, status=404)

    sub_service = None
    if sub_service_id:
        try:
            sub_service = SubService.objects.get(pk=sub_service_id)
        except SubService.DoesNotExist:
            pass

    bargain_status = "none"
    if offered_rate:
        try:
            offered_rate = float(offered_rate)
            bargain_status = "customer_offered"
        except ValueError:
            offered_rate = None

    booking = Booking.objects.create(
        user=request.user,
        karigar=kp.user,
        sub_service=sub_service,
        address=address,
        date=booking_date,
        note=note,
        status="pending",
        karigar_rate=kp.hourly_rate,
        offered_rate=offered_rate if offered_rate else None,
        bargain_status=bargain_status,
    )
    _create_admin_notification(
        type_="new_booking",
        title="New Booking Created",
        message=f"{request.user.username} booked karigar {kp.user.username}.",
        link="/admin-dashboard",
        ref_booking_id=booking.id,
    )
    return Response(_booking_data(booking, request), status=201)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def list_bookings(request):
    user = request.user
    if user.role == "karigar":
        qs = Booking.objects.filter(karigar=user).select_related("user", "karigar", "sub_service").order_by("-created_at")
    else:
        qs = Booking.objects.filter(user=user).select_related("user", "karigar", "sub_service").order_by("-created_at")

    status = request.query_params.get("status", "")
    if status:
        qs = qs.filter(status=status)

    return Response([_booking_data(b, request) for b in qs])


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def booking_detail(request, pk):
    try:
        if request.user.role == "karigar":
            b = Booking.objects.get(pk=pk, karigar=request.user)
        else:
            b = Booking.objects.get(pk=pk, user=request.user)
    except Booking.DoesNotExist:
        return Response({"error": "Booking not found."}, status=404)
    return Response(_booking_data(b, request))


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def cancel_booking(request, pk):
    try:
        if request.user.role == "karigar":
            b = Booking.objects.get(pk=pk, karigar=request.user)
        else:
            b = Booking.objects.get(pk=pk, user=request.user)
    except Booking.DoesNotExist:
        return Response({"error": "Booking not found."}, status=404)

    if b.status in ("completed", "cancelled"):
        return Response({"error": f"Cannot cancel a {b.status} booking."}, status=400)

    b.status = "cancelled"
    b.save()
    return Response(_booking_data(b, request))


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def respond_booking(request, pk):
    if request.user.role != "karigar":
        return Response({"error": "Only karigars can accept/reject bookings."}, status=403)
    try:
        b = Booking.objects.get(pk=pk, karigar=request.user)
    except Booking.DoesNotExist:
        return Response({"error": "Booking not found."}, status=404)

    action = request.data.get("action", "")
    if action not in ("accept", "reject"):
        return Response({"error": "action must be 'accept' or 'reject'."}, status=400)
    if b.status not in ("pending", "bargaining"):
        return Response({"error": f"Cannot respond to a {b.status} booking."}, status=400)

    if action == "accept":
        b.status = "accepted"
        if b.bargain_status == "customer_offered" and b.offered_rate:
            b.final_rate = b.offered_rate
        elif b.bargain_status == "karigar_countered" and b.counter_rate:
            b.final_rate = b.counter_rate
        else:
            b.final_rate = b.karigar_rate
        b.bargain_status = "none"
    else:
        b.status = "rejected"

    b.save()
    return Response(_booking_data(b, request))


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def bargain_offer(request, pk):
    if request.user.role != "customer":
        return Response({"error": "Only customers can make rate offers."}, status=403)
    try:
        b = Booking.objects.get(pk=pk, user=request.user)
    except Booking.DoesNotExist:
        return Response({"error": "Booking not found."}, status=404)

    if b.status not in ("pending", "bargaining"):
        return Response({"error": "Can only bargain on pending/bargaining bookings."}, status=400)

    offered_rate    = request.data.get("offered_rate")
    bargain_message = request.data.get("message", "")

    if not offered_rate:
        return Response({"error": "offered_rate is required."}, status=400)
    try:
        offered_rate = float(offered_rate)
        if offered_rate <= 0:
            raise ValueError
    except ValueError:
        return Response({"error": "Invalid rate."}, status=400)

    b.offered_rate    = offered_rate
    b.bargain_status  = "customer_offered"
    b.bargain_message = bargain_message
    b.status          = "bargaining"
    b.save()
    return Response(_booking_data(b, request))


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def bargain_counter(request, pk):
    if request.user.role != "karigar":
        return Response({"error": "Only karigars can send counter offers."}, status=403)
    try:
        b = Booking.objects.get(pk=pk, karigar=request.user)
    except Booking.DoesNotExist:
        return Response({"error": "Booking not found."}, status=404)

    if b.bargain_status != "customer_offered":
        return Response({"error": "No customer offer to counter."}, status=400)

    counter_rate    = request.data.get("counter_rate")
    bargain_message = request.data.get("message", "")

    if not counter_rate:
        return Response({"error": "counter_rate is required."}, status=400)
    try:
        counter_rate = float(counter_rate)
        if counter_rate <= 0:
            raise ValueError
    except ValueError:
        return Response({"error": "Invalid rate."}, status=400)

    b.counter_rate    = counter_rate
    b.bargain_status  = "karigar_countered"
    b.bargain_message = bargain_message
    b.save()
    return Response(_booking_data(b, request))


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def bargain_accept_counter(request, pk):
    if request.user.role != "customer":
        return Response({"error": "Only customers can accept counter offers."}, status=403)
    try:
        b = Booking.objects.get(pk=pk, user=request.user)
    except Booking.DoesNotExist:
        return Response({"error": "Booking not found."}, status=404)

    if b.bargain_status != "karigar_countered":
        return Response({"error": "No counter offer to accept."}, status=400)

    b.final_rate    = b.counter_rate
    b.status        = "accepted"
    b.bargain_status = "agreed"   # model choices: none/customer_offered/karigar_countered/agreed
    b.save()
    return Response(_booking_data(b, request))


# ── Mark Booking as Completed (Karigar) ────────────────────────────────────────
@api_view(["POST"])
@permission_classes([IsAuthenticated])
def mark_booking_complete(request, pk):
    """
    POST /api/accounts/bookings/<pk>/complete/
    Karigar marks an accepted booking as completed — unlocks the review system.
    """
    if request.user.role != "karigar":
        return Response({"error": "Only karigars can mark bookings as completed."}, status=403)
    try:
        booking = Booking.objects.get(pk=pk, karigar=request.user)
    except Booking.DoesNotExist:
        return Response({"error": "Booking not found."}, status=404)

    if booking.status != "accepted":
        # Return current booking data alongside the error so frontend can sync its state
        return Response(
            {
                "error": f"Only accepted bookings can be completed. Current status: {booking.status}.",
                "booking": _booking_data(booking, request),
            },
            status=400
        )

    booking.status = "completed"
    booking.save()

    try:
        kp = KarigarProfile.objects.get(user=request.user)
        _recalc_karigar_stats(kp)
    except KarigarProfile.DoesNotExist:
        pass

    _create_admin_notification(
        type_="booking_complete",
        title="Booking Completed",
        message=f"{request.user.username} marked booking with {booking.user.username} as completed.",
        link="/admin-dashboard",
        ref_booking_id=booking.id,
    )
    return Response(_booking_data(booking, request))


# ══════════════════════════════════════════════════════════════════════════════
#  SPRINT 4 — ADMIN DASHBOARD
# ══════════════════════════════════════════════════════════════════════════════

# ── Public Platform Stats (for Home page hero section) ───────────────────────
@api_view(["GET"])
@permission_classes([AllowAny])
def public_stats(request):
    """
    GET /api/accounts/public-stats/
    Returns non-sensitive platform statistics for the Home page.
    No authentication required.
    """
    return Response({
        "users":    User.objects.filter(is_active=True).count(),
        "bookings": Booking.objects.count(),
        "karigars": KarigarProfile.objects.filter(is_verified=True).count(),
        "reviews":  Review.objects.count(),
    })


def _is_admin(user):
    return user.is_staff or user.is_superuser


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def admin_stats(request):
    if not _is_admin(request.user):
        return Response({"error": "Admin access required."}, status=403)

    # Exclude staff/superusers from regular user counts
    total_users          = User.objects.filter(is_staff=False, is_superuser=False).count()
    total_customers      = User.objects.filter(role="customer", is_staff=False).count()
    total_karigars       = User.objects.filter(role="karigar",  is_staff=False).count()
    active_karigars      = User.objects.filter(role="karigar", is_active=True).count()
    pending_karigars     = User.objects.filter(role="karigar", is_active=False).count()
    verified_kgs         = KarigarProfile.objects.filter(is_verified=True).count()
    unverified_kgs       = KarigarProfile.objects.filter(is_verified=False).count()
    available_kgs        = KarigarProfile.objects.filter(available=True).count()
    pending_applications = KarigarApplication.objects.filter(status="pending").count()

    total_bookings      = Booking.objects.count()
    pending_bookings    = Booking.objects.filter(status="pending").count()
    bargaining_bookings = Booking.objects.filter(status="bargaining").count()
    accepted_bookings   = Booking.objects.filter(status="accepted").count()
    completed_bookings  = Booking.objects.filter(status="completed").count()
    rejected_bookings   = Booking.objects.filter(status="rejected").count()
    cancelled_bookings  = Booking.objects.filter(status="cancelled").count()

    total_categories = ServiceCategory.objects.filter(is_active=True).count()
    total_reviews    = Review.objects.count()

    from datetime import timedelta
    week_ago           = dj_timezone.now() - timedelta(days=7)
    new_users_week     = User.objects.filter(date_joined__gte=week_ago).count()
    new_bookings_week  = Booking.objects.filter(created_at__gte=week_ago).count()

    return Response({
        "users": {
            "total":         total_users,
            "customers":     total_customers,
            "karigars":      total_karigars,
            "active_karigars":  active_karigars,
            "pending_karigars": pending_karigars,
            "new_this_week": new_users_week,
        },
        "karigars": {
            "verified":              verified_kgs,
            "unverified":            unverified_kgs,
            "available":             available_kgs,
            "pending_applications":  pending_applications,
        },
        "bookings": {
            "total":         total_bookings,
            "pending":       pending_bookings,
            "bargaining":    bargaining_bookings,
            "accepted":      accepted_bookings,
            "completed":     completed_bookings,
            "rejected":      rejected_bookings,
            "cancelled":     cancelled_bookings,
            "new_this_week": new_bookings_week,
        },
        "categories": total_categories,
        "reviews":    total_reviews,
    })


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def admin_list_users(request):
    if not _is_admin(request.user):
        return Response({"error": "Admin access required."}, status=403)

    # Exclude staff/superusers from the user management list
    qs     = User.objects.filter(is_staff=False, is_superuser=False).order_by("-date_joined")
    role   = request.query_params.get("role", "")
    search = request.query_params.get("search", "").strip()

    if role in ("customer", "karigar"):
        qs = qs.filter(role=role)
    if search:
        qs = qs.filter(
            Q(username__icontains=search) | Q(first_name__icontains=search) |
            Q(last_name__icontains=search) | Q(email__icontains=search) |
            Q(phone_number__icontains=search)
        )

    try:
        page      = max(1, int(request.query_params.get("page", 1)))
        page_size = min(50, max(5, int(request.query_params.get("page_size", 15))))
    except ValueError:
        page, page_size = 1, 15

    total = qs.count()
    start = (page - 1) * page_size
    users = qs[start: start + page_size]

    def _u(u):
        img   = request.build_absolute_uri(u.profile_image.url) if u.profile_image else None
        kp_id = None
        try:
            kp_id = u.karigar_profile.id
        except Exception:
            pass
        # Staff/superusers show as "admin" regardless of stored role field
        effective_role = "admin" if (u.is_staff or u.is_superuser) else u.role
        return {
            "id":                 u.id,
            "username":           u.username,
            "full_name":          f"{u.first_name} {u.last_name}".strip() or u.username,
            "email":              u.email,
            "phone_number":       u.phone_number,
            "role":               effective_role,
            "is_active":          u.is_active,
            "is_staff":           u.is_staff,
            "date_joined":        u.date_joined.strftime("%Y-%m-%d"),
            "profile_image":      img,
            "karigar_profile_id": kp_id,
        }

    return Response({
        "count":     total,
        "page":      page,
        "pages":     (total + page_size - 1) // page_size,
        "page_size": page_size,
        "results":   [_u(u) for u in users],
    })


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def admin_toggle_user_active(request, pk):
    if not _is_admin(request.user):
        return Response({"error": "Admin access required."}, status=403)
    if request.user.id == pk:
        return Response({"error": "Cannot deactivate your own account."}, status=400)
    try:
        user = User.objects.get(pk=pk)
    except User.DoesNotExist:
        return Response({"error": "User not found."}, status=404)

    is_banning = user.is_active  # True → we are about to ban

    if is_banning:
        # Require a reason when banning
        reason = request.data.get("reason", "").strip()
        if not reason:
            return Response({"error": "Please provide a reason for banning this user."}, status=400)
        user.ban_reason = reason
        user.ban_date   = dj_timezone.now()
        user.is_active  = False
        # Send SMS notification to the banned user
        sms_msg = (
            f"Dear {user.first_name or user.username}, your NepalKarigar account has been "
            f"suspended. Reason: {reason}. "
            f"Contact support@nepalkarigar.com.np for assistance."
        )
        _send_sms_notification(user.phone_number, sms_msg)
    else:
        # Unbanning — clear ban fields
        user.ban_reason = None
        user.ban_date   = None
        user.is_active  = True

    user.save()

    action = "banned" if is_banning else "unbanned"
    return Response({
        "id":         user.id,
        "username":   user.username,
        "is_active":  user.is_active,
        "ban_reason": user.ban_reason or "",
        "message":    f"User {action} successfully.",
    })


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def admin_verify_karigar(request, pk):
    if not _is_admin(request.user):
        return Response({"error": "Admin access required."}, status=403)
    try:
        kp = KarigarProfile.objects.get(pk=pk)
    except KarigarProfile.DoesNotExist:
        return Response({"error": "Karigar profile not found."}, status=404)
    kp.is_verified = not kp.is_verified
    kp.save()
    return Response({
        "karigar_profile_id": kp.id,
        "username":    kp.user.username,
        "is_verified": kp.is_verified,
        "message":     "Karigar verified." if kp.is_verified else "Verification removed.",
    })


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def admin_list_bookings(request):
    if not _is_admin(request.user):
        return Response({"error": "Admin access required."}, status=403)

    qs     = Booking.objects.select_related("user", "karigar", "sub_service").order_by("-created_at")
    status = request.query_params.get("status", "")
    search = request.query_params.get("search", "").strip()

    if status:
        qs = qs.filter(status=status)
    if search:
        qs = qs.filter(
            Q(user__username__icontains=search) |
            Q(karigar__username__icontains=search) |
            Q(address__icontains=search)
        )

    try:
        page      = max(1, int(request.query_params.get("page", 1)))
        page_size = min(50, max(5, int(request.query_params.get("page_size", 15))))
    except ValueError:
        page, page_size = 1, 15

    total    = qs.count()
    start    = (page - 1) * page_size
    bookings = qs[start: start + page_size]

    def _b(b):
        return {
            "id":                b.id,
            "customer_name":     f"{b.user.first_name} {b.user.last_name}".strip() or b.user.username,
            "customer_username": b.user.username,
            "karigar_name":      f"{b.karigar.first_name} {b.karigar.last_name}".strip() or b.karigar.username,
            "karigar_username":  b.karigar.username,
            "sub_service_name":  b.sub_service.name if b.sub_service else "General",
            "address":           b.address,
            "date":              str(b.date),
            "status":            b.status,
            "bargain_status":    b.bargain_status,
            "karigar_rate":      str(b.karigar_rate)  if b.karigar_rate  else "",
            "offered_rate":      str(b.offered_rate)  if b.offered_rate  else "",
            "final_rate":        str(b.final_rate)    if b.final_rate    else "",
            "created_at":        b.created_at.strftime("%Y-%m-%d") if b.created_at else "",
        }

    return Response({
        "count":   total,
        "page":    page,
        "pages":   (total + page_size - 1) // page_size,
        "results": [_b(b) for b in bookings],
    })


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def admin_list_karigars(request):
    if not _is_admin(request.user):
        return Response({"error": "Admin access required."}, status=403)

    qs       = KarigarProfile.objects.select_related("user", "category").order_by("-user__date_joined")
    verified = request.query_params.get("verified", "")
    search   = request.query_params.get("search", "").strip()

    if verified == "true":
        qs = qs.filter(is_verified=True)
    elif verified == "false":
        qs = qs.filter(is_verified=False)
    if search:
        qs = qs.filter(
            Q(user__username__icontains=search) | Q(user__first_name__icontains=search) |
            Q(user__last_name__icontains=search) | Q(category__name__icontains=search) |
            Q(district__icontains=search)
        )

    try:
        page      = max(1, int(request.query_params.get("page", 1)))
        page_size = min(50, max(5, int(request.query_params.get("page_size", 15))))
    except ValueError:
        page, page_size = 1, 15

    total = qs.count()
    start = (page - 1) * page_size
    kps   = qs[start: start + page_size]

    def _kp(kp):
        img = request.build_absolute_uri(kp.user.profile_image.url) if kp.user.profile_image else None
        return {
            "karigar_profile_id": kp.id,
            "user_id":            kp.user.id,
            "username":           kp.user.username,
            "full_name":          f"{kp.user.first_name} {kp.user.last_name}".strip() or kp.user.username,
            "profile_image":      img,
            "category":           kp.category.name if kp.category else "",
            "district":           kp.district,
            "hourly_rate":        str(kp.hourly_rate) if kp.hourly_rate else "",
            "experience_years":   kp.experience_years,
            "is_verified":        kp.is_verified,
            "available":          kp.available,
            "total_jobs":         kp.total_jobs,
            "avg_rating":         str(kp.avg_rating),
            "date_joined":        kp.user.date_joined.strftime("%Y-%m-%d"),
        }

    return Response({
        "count":   total,
        "page":    page,
        "pages":   (total + page_size - 1) // page_size,
        "results": [_kp(kp) for kp in kps],
    })


# ══════════════════════════════════════════════════════════════════════════════
#  SPRINT 5 — REVIEWS
# ══════════════════════════════════════════════════════════════════════════════

def _review_data(r, request=None):
    img = None
    if r.user.profile_image:
        img = _abs_url(request, r.user.profile_image.url)
    return {
        "id":               r.id,
        "reviewer":         f"{r.user.first_name} {r.user.last_name}".strip() or r.user.username,
        "reviewer_username": r.user.username,
        "avatar":           img,
        "rating":           r.rating,
        "comment":          r.comment,
        "date":             r.created_at.strftime("%Y-%m-%d") if r.created_at else "",
        "booking_id":       r.booking.id,
    }


def _recalc_karigar_stats(kp):
    """Recalculate avg_rating and total_jobs after any review change."""
    from django.db.models import Avg as _Avg
    # Use DB aggregate — efficient, no memory load
    result = Review.objects.filter(karigar=kp).aggregate(avg=_Avg("rating"))
    avg = result["avg"]
    kp.avg_rating = round(float(avg), 2) if avg is not None else 0.00
    kp.total_jobs = Booking.objects.filter(karigar=kp.user, status="completed").count()
    kp.save(update_fields=["avg_rating", "total_jobs"])


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def submit_review(request, booking_id):
    """
    POST /api/accounts/bookings/<booking_id>/review/
    Customer submits a review for a completed booking.
    """
    if request.user.role != "customer":
        return Response({"error": "Only customers can submit reviews. You are logged in as a karigar."}, status=403)

    # First check if booking exists at all
    try:
        booking = Booking.objects.get(pk=booking_id)
    except Booking.DoesNotExist:
        return Response({"error": f"Booking #{booking_id} does not exist."}, status=404)

    # Then check if it belongs to this customer
    if booking.user != request.user:
        return Response({"error": f"Booking #{booking_id} does not belong to your account (logged in as: {request.user.username})."}, status=403)

    if booking.status != "completed":
        return Response({"error": f"Booking status is '{booking.status}'. You can only review completed bookings."}, status=400)

    if Review.objects.filter(booking=booking).exists():
        return Response({"error": "You have already submitted a review for this booking."}, status=400)

    rating  = request.data.get("rating")
    comment = request.data.get("comment", "").strip()

    if rating is None:
        return Response({"error": "Rating is required."}, status=400)
    try:
        rating = int(rating)
        if rating < 1 or rating > 5:
            raise ValueError
    except ValueError:
        return Response({"error": "Rating must be between 1 and 5."}, status=400)

    # booking.karigar is a User — get their KarigarProfile for Review.karigar FK
    try:
        karigar_profile = KarigarProfile.objects.get(user=booking.karigar)
    except KarigarProfile.DoesNotExist:
        return Response({"error": "Karigar profile not found."}, status=404)

    review = Review.objects.create(
        user=request.user,
        karigar=karigar_profile,
        booking=booking,
        rating=rating,
        comment=comment,
    )

    _recalc_karigar_stats(karigar_profile)

    _create_admin_notification(
        type_="review_posted",
        title="New Review Posted",
        message=f"{request.user.username} rated {karigar_profile.user.username} {review.rating} stars.",
        link="/admin-dashboard",
    )
    return Response(_review_data(review, request), status=201)


@api_view(["GET"])
@permission_classes([AllowAny])
def list_karigar_reviews(request, karigar_profile_id):
    """
    GET /api/accounts/karigars/<karigar_profile_id>/reviews/?page=
    Returns paginated reviews + rating summary for a karigar.
    """
    try:
        kp = KarigarProfile.objects.get(pk=karigar_profile_id)
    except KarigarProfile.DoesNotExist:
        return Response({"error": "Karigar not found."}, status=404)

    reviews = Review.objects.filter(karigar=kp.user).select_related("user").order_by("-created_at")

    try:
        page      = max(1, int(request.query_params.get("page", 1)))
        page_size = 10
    except ValueError:
        page = 1

    total  = reviews.count()
    start  = (page - 1) * page_size
    paged  = reviews[start: start + page_size]

    distribution = {str(i): reviews.filter(rating=i).count() for i in range(1, 6)}

    return Response({
        "count":        total,
        "page":         page,
        "pages":        (total + page_size - 1) // page_size,
        "avg_rating":   str(kp.avg_rating),
        "total_jobs":   kp.total_jobs,
        "distribution": distribution,
        "results":      [_review_data(r, request) for r in paged],
    })


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def check_reviewable(request, booking_id):
    """
    GET /api/accounts/bookings/<booking_id>/reviewable/
    Returns whether the booking can receive a review.
    """
    try:
        booking = Booking.objects.get(pk=booking_id, user=request.user)
    except Booking.DoesNotExist:
        return Response({"error": "Booking not found."}, status=404)

    already_reviewed = Review.objects.filter(booking=booking).exists()
    return Response({
        "booking_id":  booking.id,
        "can_review":  booking.status == "completed" and not already_reviewed,
        "status":      booking.status,
        "has_review":  already_reviewed,
    })


@api_view(["PUT", "PATCH"])
@permission_classes([IsAuthenticated])
def edit_review(request, review_id):
    """
    PUT /api/accounts/reviews/<review_id>/
    Customer edits their own review.
    """
    try:
        review = Review.objects.get(pk=review_id, user=request.user)
    except Review.DoesNotExist:
        return Response({"error": "Review not found."}, status=404)

    rating  = request.data.get("rating")
    comment = request.data.get("comment", review.comment).strip()

    if rating is not None:
        try:
            rating = int(rating)
            if rating < 1 or rating > 5:
                raise ValueError
        except ValueError:
            return Response({"error": "Rating must be between 1 and 5."}, status=400)
        review.rating = rating

    review.comment = comment
    review.save()

    # review.karigar IS a KarigarProfile instance — use it directly
    _recalc_karigar_stats(review.karigar)
    return Response(_review_data(review, request))


@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def delete_review(request, review_id):
    """
    DELETE /api/accounts/reviews/<review_id>/delete/
    Customer deletes their own review.
    """
    try:
        review = Review.objects.get(pk=review_id, user=request.user)
    except Review.DoesNotExist:
        return Response({"error": "Review not found."}, status=404)

    kp = review.karigar   # review.karigar IS a KarigarProfile
    review.delete()
    _recalc_karigar_stats(kp)
    return Response({"message": "Review deleted."})


# ══════════════════════════════════════════════════════════════════════════════
#  IMPROVEMENTS — Notifications
# ══════════════════════════════════════════════════════════════════════════════

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_notifications(request):
    """
    GET /api/accounts/notifications/
    Returns last 72 hours of activity relevant to the current user.
    Used by NotificationBell (30-second polling).
    """
    from datetime import timedelta
    user   = request.user
    cutoff = dj_timezone.now() - timedelta(hours=72)
    notifs = []

    if user.role == "customer":
        bookings = Booking.objects.filter(user=user, updated_at__gte=cutoff).order_by("-updated_at")[:20]
        for b in bookings:
            kname = f"{b.karigar.first_name} {b.karigar.last_name}".strip() or b.karigar.username
            if b.status == "accepted":
                notifs.append({"id": f"b{b.id}_accepted",  "type": "success", "msg": f"{kname} accepted your booking.", "booking_id": b.id, "ts": b.updated_at.isoformat()})
            elif b.status == "rejected":
                notifs.append({"id": f"b{b.id}_rejected",  "type": "error",   "msg": f"{kname} declined your booking.", "booking_id": b.id, "ts": b.updated_at.isoformat()})
            elif b.status == "completed":
                notifs.append({"id": f"b{b.id}_completed", "type": "info",    "msg": f"Job with {kname} is complete. Leave a review!", "booking_id": b.id, "ts": b.updated_at.isoformat()})
            elif b.bargain_status == "karigar_countered":
                notifs.append({"id": f"b{b.id}_counter",   "type": "bargain", "msg": f"{kname} sent a counter offer.", "booking_id": b.id, "ts": b.updated_at.isoformat()})
    elif user.role == "karigar":
        bookings = Booking.objects.filter(karigar=user, updated_at__gte=cutoff).order_by("-updated_at")[:20]
        for b in bookings:
            cname = f"{b.user.first_name} {b.user.last_name}".strip() or b.user.username
            if b.status == "pending" and b.bargain_status == "none":
                notifs.append({"id": f"b{b.id}_new",       "type": "info",    "msg": f"New booking request from {cname}.", "booking_id": b.id, "ts": b.updated_at.isoformat()})
            elif b.bargain_status == "customer_offered":
                notifs.append({"id": f"b{b.id}_offer",     "type": "bargain", "msg": f"{cname} sent a rate offer.", "booking_id": b.id, "ts": b.updated_at.isoformat()})
            elif b.status == "cancelled":
                notifs.append({"id": f"b{b.id}_cancelled", "type": "error",   "msg": f"{cname} cancelled their booking.", "booking_id": b.id, "ts": b.updated_at.isoformat()})
            elif b.status == "accepted":
                notifs.append({"id": f"b{b.id}_accepted_k", "type": "success", "msg": f"You accepted booking from {cname}.", "booking_id": b.id, "ts": b.updated_at.isoformat()})

    # Complaint update notifications — for both roles
    complaints_updated = Complaint.objects.filter(
        complainant=user,
        status__in=("resolved", "dismissed", "reviewing"),
        updated_at__gte=cutoff
    ).order_by("-updated_at")[:10]
    for comp in complaints_updated:
        status_msg = {
            "reviewing": "is now under review",
            "resolved":  "has been resolved",
            "dismissed": "has been dismissed",
        }.get(comp.status, "was updated")
        notifs.append({
            "id":   f"comp{comp.id}_{comp.status}",
            "type": "success" if comp.status == "resolved" else "info",
            "msg":  f"Your complaint against {comp.accused.username} {status_msg}.",
            "ts":   comp.updated_at.isoformat(),
        })

    # Sort all notifications by timestamp
    notifs.sort(key=lambda x: x["ts"], reverse=True)
    return Response({"count": len(notifs), "results": notifs[:25]})


# ══════════════════════════════════════════════════════════════════════════════
#  KARIGAR APPLICATION — Verification Flow
# ══════════════════════════════════════════════════════════════════════════════

def _application_data(app, request=None):
    """Serialise a KarigarApplication for API responses."""
    def img(field):
        return _abs_url(request, field.url) if field else None
    return {
        "id":                 app.id,
        "user_id":            app.user.id,
        "username":           app.user.username,
        "full_name":          app.full_name,
        "phone_number":       app.user.phone_number,
        "email":              app.user.email,
        "date_of_birth":      str(app.date_of_birth),
        "age":                app.age,
        "address":            app.address,
        "district":           app.district,
        "citizenship_number": app.citizenship_number,
        "citizenship_front":  img(app.citizenship_front),
        "citizenship_back":   img(app.citizenship_back),
        "service_category":   app.service_category.name if app.service_category else "",
        "service_category_id":app.service_category.id   if app.service_category else None,
        "service_title":      app.service_title,
        "experience_years":   app.experience_years,
        "certificate":        img(app.certificate),
        "work_sample":        img(app.work_sample),
        "about_yourself":     app.about_yourself,
        "status":             app.status,
        "admin_note":         app.admin_note,
        "submitted_at":       app.submitted_at.strftime("%Y-%m-%d %H:%M") if app.submitted_at else "",
        "reviewed_at":        app.reviewed_at.strftime("%Y-%m-%d %H:%M") if app.reviewed_at else "",
    }


def _send_sms_notification(phone_number, message):
    """
    Send an SMS notification.
    In development this prints to console.
    In production replace with Sparrow SMS / Aakash SMS API.
    """
    import re
    clean = re.sub(r'\D', '', phone_number)
    print(f"\n{'='*60}")
    print(f"📱 SMS TO: +977-{clean}")
    print(f"MESSAGE : {message}")
    print(f"{'='*60}\n")
    # ── Production: Sparrow SMS (Nepal) ──────────────────────────────────
    # import requests
    # requests.post("https://api.sparrowsms.com/v2/sms/", json={
    #     "token":  "YOUR_SPARROW_TOKEN",
    #     "from":   "NepalKarigar",
    #     "to":     clean,
    #     "text":   message,
    # })


@api_view(["POST"])
@permission_classes([AllowAny])
def submit_karigar_application(request):
    """
    POST /api/accounts/karigar-application/submit/
    Karigar submits verification application after registration.
    Uses multipart/form-data (files included).
    Does NOT require authentication — user is inactive at this point.
    """
    user_id = request.data.get("user_id")
    if not user_id:
        return Response({"error": "user_id is required."}, status=400)

    try:
        user = User.objects.get(pk=user_id, role="karigar")
    except User.DoesNotExist:
        return Response({"error": "Karigar account not found."}, status=404)

    # Prevent re-submission if already submitted
    if KarigarApplication.objects.filter(user=user).exists():
        existing = KarigarApplication.objects.get(user=user)
        return Response({
            "already_submitted": True,
            "status": existing.status,
            "message": "Application already submitted. Please wait for admin review.",
        })

    # Validate required fields
    required = ["full_name", "date_of_birth", "age", "address",
                "district", "citizenship_number"]
    for field in required:
        if not request.data.get(field, "").strip():
            return Response({"error": f"{field.replace('_', ' ').title()} is required."}, status=400)

    if "citizenship_front" not in request.FILES:
        return Response({"error": "Citizenship front photo is required."}, status=400)

    # Parse date_of_birth
    from datetime import date as dt_date
    dob_str = request.data.get("date_of_birth", "")
    try:
        dob = dt_date.fromisoformat(dob_str)
    except ValueError:
        return Response({"error": "Invalid date of birth format. Use YYYY-MM-DD."}, status=400)

    # Service category (optional but encouraged)
    service_category = None
    cat_id = request.data.get("service_category_id")
    if cat_id:
        try:
            service_category = ServiceCategory.objects.get(pk=int(cat_id))
        except (ServiceCategory.DoesNotExist, ValueError):
            pass

    app = KarigarApplication.objects.create(
        user               = user,
        full_name          = request.data.get("full_name", "").strip(),
        date_of_birth      = dob,
        age                = int(request.data.get("age", 0)),
        address            = request.data.get("address", "").strip(),
        district           = request.data.get("district", "").strip(),
        citizenship_number = request.data.get("citizenship_number", "").strip(),
        citizenship_front  = request.FILES.get("citizenship_front"),
        citizenship_back   = request.FILES.get("citizenship_back"),
        service_category   = service_category,
        service_title      = request.data.get("service_title", "").strip(),
        experience_years   = int(request.data.get("experience_years", 0) or 0),
        certificate        = request.FILES.get("certificate"),
        work_sample        = request.FILES.get("work_sample"),
        about_yourself     = request.data.get("about_yourself", "").strip(),
        status             = "pending",
    )

    print(f"\n🔔 NEW KARIGAR APPLICATION: {user.username} ({user.phone_number})\n")
    _create_admin_notification(
        type_="new_application",
        title="New Karigar Application",
        message=f"{app.full_name} ({user.phone_number}) submitted a karigar verification application.",
        link="/admin-dashboard",
        ref_user_id=user.id,
    )

    return Response({
        "success":   True,
        "message":   "Application submitted successfully! You will receive an SMS once reviewed.",
        "status":    "pending",
        "app_id":    app.id,
    }, status=201)


@api_view(["GET"])
@permission_classes([AllowAny])
def check_application_status(request):
    """
    GET /api/accounts/karigar-application/status/?user_id=
    Check application status for a given user_id (no auth needed — user is inactive).
    """
    user_id = request.query_params.get("user_id")
    if not user_id:
        return Response({"error": "user_id is required."}, status=400)
    try:
        app = KarigarApplication.objects.get(user_id=user_id)
        return Response({
            "has_application": True,
            "status":          app.status,
            "admin_note":      app.admin_note,
            "submitted_at":    app.submitted_at.strftime("%Y-%m-%d %H:%M"),
        })
    except KarigarApplication.DoesNotExist:
        return Response({"has_application": False, "status": "not_submitted"})


# ── Admin: list applications ───────────────────────────────────────────────────
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def admin_list_applications(request):
    """
    GET /api/accounts/admin/applications/?status=pending&page=
    """
    if not _is_admin(request.user):
        return Response({"error": "Admin access required."}, status=403)

    qs     = KarigarApplication.objects.select_related("user", "service_category")
    status = request.query_params.get("status", "")
    search = request.query_params.get("search", "").strip()

    if status in ("pending", "approved", "rejected"):
        qs = qs.filter(status=status)
    if search:
        qs = qs.filter(
            Q(user__username__icontains=search) |
            Q(full_name__icontains=search) |
            Q(citizenship_number__icontains=search) |
            Q(service_title__icontains=search)
        )

    try:
        page      = max(1, int(request.query_params.get("page", 1)))
        page_size = 15
    except ValueError:
        page = 1

    total = qs.count()
    start = (page - 1) * page_size
    apps  = qs[start: start + page_size]

    return Response({
        "count":   total,
        "page":    page,
        "pages":   (total + page_size - 1) // page_size,
        "results": [_application_data(a, request) for a in apps],
    })


# ── Admin: approve application ────────────────────────────────────────────────
@api_view(["POST"])
@permission_classes([IsAuthenticated])
def admin_approve_application(request, app_id):
    """
    POST /api/accounts/admin/applications/<app_id>/approve/
    Activates the karigar account + marks KarigarProfile as verified + sends SMS.
    """
    if not _is_admin(request.user):
        return Response({"error": "Admin access required."}, status=403)

    try:
        app = KarigarApplication.objects.select_related(
            "user", "service_category"
        ).get(pk=app_id)
    except KarigarApplication.DoesNotExist:
        return Response({"error": "Application not found."}, status=404)

    if app.status == "approved":
        return Response({"error": "Application already approved."}, status=400)

    # Activate user account
    app.user.is_active = True
    app.user.save()

    # Update karigar profile with application details
    try:
        kp = app.user.karigar_profile
    except KarigarProfile.DoesNotExist:
        kp = KarigarProfile.objects.create(user=app.user)

    kp.is_verified      = True
    kp.experience_years = app.experience_years
    kp.district         = app.district
    if app.service_category:
        kp.category = app.service_category
    kp.save()

    # Mark application approved
    app.status      = "approved"
    app.admin_note  = request.data.get("admin_note", "")
    app.reviewed_at = dj_timezone.now()
    app.reviewed_by = request.user
    app.save()

    # Send SMS approval notification
    msg = (
        f"Congratulations {app.full_name}! Your NepalKarigar account has been "
        f"approved. You can now log in and start receiving bookings. "
        f"Welcome to the platform!"
    )
    _send_sms_notification(app.user.phone_number, msg)

    return Response({
        "success":  True,
        "message":  f"Application approved. SMS sent to {app.user.phone_number}.",
        "app":      _application_data(app, request),
    })


# ── Admin: reject application ─────────────────────────────────────────────────
@api_view(["POST"])
@permission_classes([IsAuthenticated])
def admin_reject_application(request, app_id):
    """
    POST /api/accounts/admin/applications/<app_id>/reject/
    Body: { reason: "..." }
    Sends SMS with rejection reason + keeps account inactive.
    """
    if not _is_admin(request.user):
        return Response({"error": "Admin access required."}, status=403)

    try:
        app = KarigarApplication.objects.select_related("user").get(pk=app_id)
    except KarigarApplication.DoesNotExist:
        return Response({"error": "Application not found."}, status=404)

    reason = request.data.get("reason", "Your application did not meet our requirements.")

    app.status      = "rejected"
    app.admin_note  = reason
    app.reviewed_at = dj_timezone.now()
    app.reviewed_by = request.user
    app.save()

    # Send SMS rejection notification
    msg = (
        f"Dear {app.full_name}, your NepalKarigar application has been reviewed. "
        f"Unfortunately it was not approved. Reason: {reason}. "
        f"You may contact support at support@nepalkarigar.com.np for help."
    )
    _send_sms_notification(app.user.phone_number, msg)

    return Response({
        "success": True,
        "message": f"Application rejected. SMS sent to {app.user.phone_number}.",
        "app":     _application_data(app, request),
    })


# ══════════════════════════════════════════════════════════════════════════════
#  ADMIN NOTIFICATIONS
# ══════════════════════════════════════════════════════════════════════════════

def _create_admin_notification(type_, title, message, link="", ref_user_id=None, ref_booking_id=None):
    """Helper to create an admin notification. Called from anywhere in views."""
    AdminNotification.objects.create(
        type=type_,
        title=title,
        message=message,
        link=link or "/admin-dashboard",
        ref_user_id=ref_user_id,
        ref_booking_id=ref_booking_id,
    )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def admin_get_notifications(request):
    """
    GET /api/accounts/admin/notifications/?unread_only=true&page=
    Returns admin notifications (new applications, new users, bookings, etc.)
    """
    if not _is_admin(request.user):
        return Response({"error": "Admin access required."}, status=403)

    qs = AdminNotification.objects.all()
    unread_only = request.query_params.get("unread_only", "") == "true"
    if unread_only:
        qs = qs.filter(is_read=False)

    try:
        page      = max(1, int(request.query_params.get("page", 1)))
        page_size = 20
    except ValueError:
        page = 1

    total   = qs.count()
    unread  = AdminNotification.objects.filter(is_read=False).count()
    start   = (page - 1) * page_size
    notifs  = qs[start: start + page_size]

    def _n(n):
        return {
            "id":             n.id,
            "type":           n.type,
            "title":          n.title,
            "message":        n.message,
            "link":           n.link,
            "is_read":        n.is_read,
            "created_at":     n.created_at.isoformat(),
            "ref_user_id":    n.ref_user_id,
            "ref_booking_id": n.ref_booking_id,
        }

    return Response({
        "count":        total,
        "unread_count": unread,
        "page":         page,
        "pages":        (total + page_size - 1) // page_size,
        "results":      [_n(n) for n in notifs],
    })


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def admin_mark_notifications_read(request):
    """
    POST /api/accounts/admin/notifications/read/
    Body: { ids: [1,2,3] } or {} to mark ALL as read
    """
    if not _is_admin(request.user):
        return Response({"error": "Admin access required."}, status=403)

    ids = request.data.get("ids", [])
    if ids:
        AdminNotification.objects.filter(id__in=ids).update(is_read=True)
    else:
        AdminNotification.objects.filter(is_read=False).update(is_read=True)

    unread = AdminNotification.objects.filter(is_read=False).count()
    return Response({"message": "Marked as read.", "unread_count": unread})


@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def admin_clear_notifications(request):
    """DELETE /api/accounts/admin/notifications/clear/ — delete all read notifications"""
    if not _is_admin(request.user):
        return Response({"error": "Admin access required."}, status=403)
    deleted, _ = AdminNotification.objects.filter(is_read=True).delete()
    return Response({"message": f"Cleared {deleted} read notifications."})


# ══════════════════════════════════════════════════════════════════════════════
#  COMPLAINT SYSTEM
# ══════════════════════════════════════════════════════════════════════════════

def _complaint_data(comp, request=None):
    """Serialise a Complaint for API responses."""
    def img(field):
        return _abs_url(request, field.url) if field else None

    complainant_img = None
    if comp.complainant.profile_image:
        complainant_img = _abs_url(request, comp.complainant.profile_image.url)
    accused_img = None
    if comp.accused.profile_image:
        accused_img = _abs_url(request, comp.accused.profile_image.url)

    return {
        "id":               comp.id,
        # Complainant info
        "complainant_id":       comp.complainant.id,
        "complainant_username": comp.complainant.username,
        "complainant_name":     f"{comp.complainant.first_name} {comp.complainant.last_name}".strip() or comp.complainant.username,
        "complainant_role":     comp.complainant.role,
        "complainant_image":    complainant_img,
        # Accused info
        "accused_id":           comp.accused.id,
        "accused_username":     comp.accused.username,
        "accused_name":         f"{comp.accused.first_name} {comp.accused.last_name}".strip() or comp.accused.username,
        "accused_role":         comp.accused.role,
        "accused_image":        accused_img,
        # Booking reference
        "booking_id":           comp.booking.id if comp.booking else None,
        # Complaint details
        "category":             comp.category,
        "title":                comp.title,
        "description":          comp.description,
        "evidence":             img(comp.evidence),
        # Status & admin response
        "status":               comp.status,
        "admin_response":       comp.admin_response,
        "action_taken":         comp.action_taken,
        "reviewed_by":          comp.reviewed_by.username if comp.reviewed_by else None,
        # Timestamps
        "created_at":           comp.created_at.strftime("%Y-%m-%d %H:%M"),
        "updated_at":           comp.updated_at.strftime("%Y-%m-%d %H:%M"),
        "resolved_at":          comp.resolved_at.strftime("%Y-%m-%d %H:%M") if comp.resolved_at else None,
    }


# ── Submit a complaint ─────────────────────────────────────────────────────────
@api_view(["POST"])
@permission_classes([IsAuthenticated])
def submit_complaint(request):
    """
    POST /api/accounts/complaints/
    Customer or karigar submits a complaint against the other party.
    Supports multipart/form-data (optional evidence image).
    """
    user = request.user
    data = request.data

    accused_id = data.get("accused_id")
    category   = data.get("category", "").strip()
    title      = data.get("title", "").strip()
    description= data.get("description", "").strip()
    booking_id = data.get("booking_id")

    # Validate required fields
    if not accused_id:
        return Response({"error": "accused_id is required."}, status=400)
    if not category:
        return Response({"error": "Category is required."}, status=400)
    if not title:
        return Response({"error": "Title is required."}, status=400)
    if not description or len(description) < 10:
        return Response({"error": "Please provide a detailed description (min 10 characters)."}, status=400)

    # Get accused user
    try:
        accused = User.objects.get(pk=accused_id)
    except User.DoesNotExist:
        return Response({"error": "Accused user not found."}, status=404)

    # Prevent self-complaint
    if accused.id == user.id:
        return Response({"error": "You cannot file a complaint against yourself."}, status=400)

    # Customers can only complain about karigars and vice versa
    valid_pairs = {
        "customer": "karigar",
        "karigar":  "customer",
    }
    user_role   = user.role if not (user.is_staff or user.is_superuser) else None
    if user_role and accused.role not in (valid_pairs.get(user_role, []), "admin"):
        if accused.role == user_role:
            return Response({"error": f"You cannot complain about another {user_role}."}, status=400)

    # Get booking reference (optional)
    booking = None
    if booking_id:
        try:
            booking = Booking.objects.get(pk=booking_id)
            # Verify the booking involves both parties
            if not (
                (booking.user == user and booking.karigar == accused) or
                (booking.karigar == user and booking.user == accused)
            ):
                booking = None  # not related — ignore silently
        except Booking.DoesNotExist:
            pass

    # Create complaint
    comp = Complaint.objects.create(
        complainant  = user,
        accused      = accused,
        booking      = booking,
        category     = category,
        title        = title,
        description  = description,
        evidence     = request.FILES.get("evidence"),
        status       = "pending",
    )

    # Notify admin
    _create_admin_notification(
        type_="report",
        title=f"New Complaint: {comp.get_category_display()}",
        message=(
            f"{user.username} ({user.role}) filed a complaint against "
            f"{accused.username} ({accused.role}): \"{title[:80]}\""
        ),
        link="/admin-dashboard",
        ref_user_id=accused.id,
    )

    return Response(_complaint_data(comp, request), status=201)


# ── List my complaints ─────────────────────────────────────────────────────────
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def list_my_complaints(request):
    """
    GET /api/accounts/complaints/my/
    Returns complaints filed BY the current user.
    """
    comps = Complaint.objects.filter(complainant=request.user).order_by("-created_at")
    return Response([_complaint_data(c, request) for c in comps])


# ── Admin: List all complaints ─────────────────────────────────────────────────
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def admin_list_complaints(request):
    """
    GET /api/accounts/admin/complaints/?status=&search=&page=
    """
    if not _is_admin(request.user):
        return Response({"error": "Admin access required."}, status=403)

    qs     = Complaint.objects.select_related(
                 "complainant", "accused", "booking", "reviewed_by"
             ).order_by("-created_at")

    status = request.query_params.get("status", "").strip()
    search = request.query_params.get("search", "").strip()

    if status in ("pending", "reviewing", "resolved", "dismissed"):
        qs = qs.filter(status=status)
    if search:
        qs = qs.filter(
            Q(complainant__username__icontains=search) |
            Q(accused__username__icontains=search)    |
            Q(title__icontains=search)                |
            Q(description__icontains=search)
        )

    try:
        page      = max(1, int(request.query_params.get("page", 1)))
        page_size = 15
    except ValueError:
        page = 1

    total  = qs.count()
    start  = (page - 1) * page_size
    comps  = qs[start: start + page_size]

    # Counts per status for badges
    counts = {
        "pending":   Complaint.objects.filter(status="pending").count(),
        "reviewing": Complaint.objects.filter(status="reviewing").count(),
        "resolved":  Complaint.objects.filter(status="resolved").count(),
        "dismissed": Complaint.objects.filter(status="dismissed").count(),
        "total":     Complaint.objects.count(),
    }

    return Response({
        "count":   total,
        "page":    page,
        "pages":   (total + page_size - 1) // page_size,
        "counts":  counts,
        "results": [_complaint_data(c, request) for c in comps],
    })


# ── Admin: Respond to a complaint ─────────────────────────────────────────────
@api_view(["POST"])
@permission_classes([IsAuthenticated])
def admin_respond_complaint(request, complaint_id):
    """
    POST /api/accounts/admin/complaints/<id>/respond/
    Body: {
        status:         "reviewing" | "resolved" | "dismissed",
        admin_response: "...",
        action_taken:   "Warning issued" | "Banned" | "Dismissed" | ...
    }
    Sends SMS to complainant with the admin's response.
    """
    if not _is_admin(request.user):
        return Response({"error": "Admin access required."}, status=403)

    try:
        comp = Complaint.objects.select_related("complainant", "accused").get(pk=complaint_id)
    except Complaint.DoesNotExist:
        return Response({"error": "Complaint not found."}, status=404)

    new_status     = request.data.get("status", comp.status)
    admin_response = request.data.get("admin_response", "").strip()
    action_taken   = request.data.get("action_taken", "").strip()

    if new_status not in ("pending", "reviewing", "resolved", "dismissed"):
        return Response({"error": "Invalid status."}, status=400)

    if not admin_response:
        return Response({"error": "Admin response message is required."}, status=400)

    comp.status         = new_status
    comp.admin_response = admin_response
    comp.action_taken   = action_taken
    comp.reviewed_by    = request.user

    if new_status in ("resolved", "dismissed"):
        comp.resolved_at = dj_timezone.now()

    comp.save()

    # Send SMS to complainant
    status_label = {
        "reviewing": "is now under review",
        "resolved":  "has been resolved",
        "dismissed": "has been dismissed",
    }.get(new_status, "has been updated")

    sms_msg = (
        f"Dear {comp.complainant.first_name or comp.complainant.username}, "
        f"your complaint against {comp.accused.username} {status_label}. "
        f"Admin message: {admin_response[:100]}. "
        f"Action taken: {action_taken or 'None'}. "
        f"NepalKarigar Support."
    )
    _send_sms_notification(comp.complainant.phone_number, sms_msg)

    # Also notify the accused user via SMS if action was taken against them
    if action_taken and new_status == "resolved":
        accused_sms = (
            f"Dear {comp.accused.first_name or comp.accused.username}, "
            f"a complaint was filed against you on NepalKarigar. "
            f"Admin decision: {admin_response[:100]}. "
            f"Action: {action_taken}. "
            f"Contact support@nepalkarigar.com.np for queries."
        )
        _send_sms_notification(comp.accused.phone_number, accused_sms)

    # Create notification in the regular notification system for complainant
    # (they'll see it in their notification bell next time they load)
    # We store this as a special "report" type in AdminNotification for audit trail
    _create_admin_notification(
        type_="report",
        title=f"Complaint #{comp.id} Updated",
        message=f"Admin responded to complaint by {comp.complainant.username}: {action_taken or new_status}",
        link="/admin-dashboard",
        ref_user_id=comp.complainant.id,
    )

    return Response({
        "success":  True,
        "message":  f"Response sent. SMS delivered to {comp.complainant.phone_number}.",
        "complaint": _complaint_data(comp, request),
    })


# ── Check if user has complained about a specific booking ─────────────────────
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def check_complaint_status(request):
    """
    GET /api/accounts/complaints/status/?accused_id=&booking_id=
    Check if current user already complained about a user/booking.
    """
    accused_id = request.query_params.get("accused_id")
    booking_id = request.query_params.get("booking_id")

    qs = Complaint.objects.filter(complainant=request.user)
    if accused_id:
        qs = qs.filter(accused_id=accused_id)
    if booking_id:
        qs = qs.filter(booking_id=booking_id)

    comp = qs.first()
    if comp:
        return Response({
            "has_complaint": True,
            "complaint_id":  comp.id,
            "status":        comp.status,
            "admin_response":comp.admin_response,
            "action_taken":  comp.action_taken,
        })
    return Response({"has_complaint": False})


# ══════════════════════════════════════════════════════════════════════════════
#  CONTACT MESSAGES
# ══════════════════════════════════════════════════════════════════════════════

@api_view(["POST"])
@permission_classes([AllowAny])
def submit_contact_message(request):
    """
    POST /api/accounts/contact/
    Anyone (logged in or not) can send a contact message.
    """
    name    = request.data.get("name", "").strip()
    email   = request.data.get("email", "").strip()
    subject = request.data.get("subject", "").strip()
    message = request.data.get("message", "").strip()

    # Validate
    if not name:
        return Response({"error": "Name is required."}, status=400)
    if not email or "@" not in email:
        return Response({"error": "A valid email address is required."}, status=400)
    if not subject:
        return Response({"error": "Subject is required."}, status=400)
    if not message or len(message) < 10:
        return Response({"error": "Message must be at least 10 characters."}, status=400)

    msg = ContactMessage.objects.create(
        name=name, email=email, subject=subject, message=message
    )

    # Notify admin
    _create_admin_notification(
        type_="report",
        title=f"New Contact Message: {subject[:60]}",
        message=f"{name} ({email}) sent a message: \"{message[:80]}{'...' if len(message)>80 else ''}\"",
        link="/admin-dashboard",
    )

    # Print to console for dev awareness
    print(f"\n📧 CONTACT MESSAGE FROM: {name} <{email}>")
    print(f"   Subject : {subject}")
    print(f"   Message : {message[:100]}")
    print()

    return Response({
        "success": True,
        "message": "Your message has been sent! We will get back to you soon.",
        "id":      msg.id,
    }, status=201)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def admin_list_contact_messages(request):
    """
    GET /api/accounts/admin/contact-messages/?unread_only=true&page=
    """
    if not _is_admin(request.user):
        return Response({"error": "Admin access required."}, status=403)

    qs = ContactMessage.objects.all()

    unread_only = request.query_params.get("unread_only", "") == "true"
    if unread_only:
        qs = qs.filter(is_read=False)

    search = request.query_params.get("search", "").strip()
    if search:
        qs = qs.filter(
            Q(name__icontains=search) |
            Q(email__icontains=search) |
            Q(subject__icontains=search) |
            Q(message__icontains=search)
        )

    try:
        page      = max(1, int(request.query_params.get("page", 1)))
        page_size = 15
    except ValueError:
        page = 1

    total = qs.count()
    unread_count = ContactMessage.objects.filter(is_read=False).count()
    start = (page - 1) * page_size
    msgs  = qs[start: start + page_size]

    def _m(m):
        return {
            "id":         m.id,
            "name":       m.name,
            "email":      m.email,
            "subject":    m.subject,
            "message":    m.message,
            "is_read":    m.is_read,
            "replied":    m.replied,
            "created_at": m.created_at.strftime("%Y-%m-%d %H:%M"),
        }

    return Response({
        "count":        total,
        "unread_count": unread_count,
        "page":         page,
        "pages":        (total + page_size - 1) // page_size,
        "results":      [_m(m) for m in msgs],
    })


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def admin_mark_contact_read(request, msg_id):
    """
    POST /api/accounts/admin/contact-messages/<id>/read/
    Mark a contact message as read.
    """
    if not _is_admin(request.user):
        return Response({"error": "Admin access required."}, status=403)
    try:
        msg = ContactMessage.objects.get(pk=msg_id)
    except ContactMessage.DoesNotExist:
        return Response({"error": "Message not found."}, status=404)

    msg.is_read = True
    msg.replied = request.data.get("replied", msg.replied)
    msg.save()
    return Response({"success": True, "is_read": msg.is_read, "replied": msg.replied})


@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def admin_delete_contact_message(request, msg_id):
    """
    DELETE /api/accounts/admin/contact-messages/<id>/delete/
    """
    if not _is_admin(request.user):
        return Response({"error": "Admin access required."}, status=403)
    try:
        msg = ContactMessage.objects.get(pk=msg_id)
        msg.delete()
        return Response({"success": True, "message": "Message deleted."})
    except ContactMessage.DoesNotExist:
        return Response({"error": "Message not found."}, status=404)