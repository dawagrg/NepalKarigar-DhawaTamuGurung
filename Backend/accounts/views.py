from django.contrib.auth        import authenticate
from django.db.models           import Q, Avg
from django.utils               import timezone as dj_timezone
from rest_framework.decorators  import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response    import Response
from rest_framework_simplejwt.tokens import RefreshToken

from .models import (
    User, PasswordResetToken, ServiceCategory, SubService,
    KarigarProfile, KarigarGallery, Booking, Review,
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
    return {
        "user_id":       user.id,
        "username":      user.username,
        "first_name":    user.first_name,
        "last_name":     user.last_name,
        "email":         user.email,
        "phone_number":  user.phone_number,
        "role":          user.role,
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
        "customer_name":    f"{b.user.first_name} {b.user.last_name}".strip() or b.user.username,
        "customer_username":b.user.username,
        "customer_image":   cust_img,
        "karigar_name":     f"{b.karigar.first_name} {b.karigar.last_name}".strip() or b.karigar.username,
        "karigar_username": b.karigar.username,
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

    return Response({**_tokens(user), **_user_data(user, request)}, status=201)


@api_view(["POST"])
@permission_classes([AllowAny])
def login_user(request):
    identifier = request.data.get("username", "").strip()
    password   = request.data.get("password", "")
    if not identifier or not password:
        return Response({"error": "Phone/email and password are required."}, status=400)

    user = authenticate(username=identifier, password=password)
    if user is None:
        for field in ("phone_number", "email"):
            try:
                obj = User.objects.get(**{field: identifier})
                user = authenticate(username=obj.username, password=password)
                if user:
                    break
            except User.DoesNotExist:
                pass
    if user is None:
        return Response({"error": "Incorrect credentials."}, status=401)
    if not user.is_active:
        return Response({"error": "Your account has been suspended. Please contact support."}, status=403)

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
    current = request.data.get("current_password", "")
    new_pw  = request.data.get("new_password", "")
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
        category=cat, available=True
    ).select_related("user", "category")
    return Response([_karigar_data(kp, request) for kp in kps])


@api_view(["GET"])
@permission_classes([AllowAny])
def list_karigars(request):
    return Response(
        [_karigar_data(kp, request)
         for kp in KarigarProfile.objects.select_related("user", "category").all()]
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
    qs = KarigarProfile.objects.select_related("user", "category").prefetch_related("sub_services")

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
    b.save(update_fields=["status", "updated_at"])
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
    b.bargain_status= "accepted"
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
        return Response(
            {"error": f"Only accepted bookings can be completed. Current status: {booking.status}."},
            status=400
        )

    booking.status = "completed"
    booking.save(update_fields=["status", "updated_at"])

    try:
        kp = KarigarProfile.objects.get(user=request.user)
        _recalc_karigar_stats(kp)
    except KarigarProfile.DoesNotExist:
        pass

    return Response(_booking_data(booking, request))


# ══════════════════════════════════════════════════════════════════════════════
#  SPRINT 4 — ADMIN DASHBOARD
# ══════════════════════════════════════════════════════════════════════════════

def _is_admin(user):
    return user.is_staff or user.is_superuser


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def admin_stats(request):
    if not _is_admin(request.user):
        return Response({"error": "Admin access required."}, status=403)

    total_users     = User.objects.count()
    total_customers = User.objects.filter(role="customer").count()
    total_karigars  = User.objects.filter(role="karigar").count()
    verified_kgs    = KarigarProfile.objects.filter(is_verified=True).count()
    unverified_kgs  = KarigarProfile.objects.filter(is_verified=False).count()
    available_kgs   = KarigarProfile.objects.filter(available=True).count()

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
            "new_this_week": new_users_week,
        },
        "karigars": {
            "verified":   verified_kgs,
            "unverified": unverified_kgs,
            "available":  available_kgs,
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

    qs     = User.objects.all().order_by("-date_joined")
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
        return {
            "id":                 u.id,
            "username":           u.username,
            "full_name":          f"{u.first_name} {u.last_name}".strip() or u.username,
            "email":              u.email,
            "phone_number":       u.phone_number,
            "role":               u.role,
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
    user.is_active = not user.is_active
    user.save()
    return Response({
        "id":        user.id,
        "username":  user.username,
        "is_active": user.is_active,
        "message":   "User activated." if user.is_active else "User banned.",
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
    reviews = Review.objects.filter(karigar=kp.user)
    count   = reviews.count()
    if count > 0:
        total = sum(r.rating for r in reviews)
        kp.avg_rating = round(total / count, 2)
    else:
        kp.avg_rating = 0.00
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
        return Response({"error": "Only customers can submit reviews."}, status=403)

    try:
        booking = Booking.objects.get(pk=booking_id, user=request.user)
    except Booking.DoesNotExist:
        return Response({"error": "Booking not found."}, status=404)

    if booking.status != "completed":
        return Response({"error": "You can only review completed bookings."}, status=400)

    if Review.objects.filter(booking=booking).exists():
        return Response({"error": "You have already reviewed this booking."}, status=400)

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

    review = Review.objects.create(
        user=request.user,
        karigar=booking.karigar,
        booking=booking,
        rating=rating,
        comment=comment,
    )

    try:
        kp = KarigarProfile.objects.get(user=booking.karigar)
        _recalc_karigar_stats(kp)
    except KarigarProfile.DoesNotExist:
        pass

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

    try:
        kp = KarigarProfile.objects.get(user=review.karigar)
        _recalc_karigar_stats(kp)
    except KarigarProfile.DoesNotExist:
        pass

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

    karigar = review.karigar
    review.delete()

    try:
        kp = KarigarProfile.objects.get(user=karigar)
        _recalc_karigar_stats(kp)
    except KarigarProfile.DoesNotExist:
        pass

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
    else:
        bookings = Booking.objects.filter(karigar=user, updated_at__gte=cutoff).order_by("-updated_at")[:20]
        for b in bookings:
            cname = f"{b.user.first_name} {b.user.last_name}".strip() or b.user.username
            if b.status == "pending" and b.bargain_status == "none":
                notifs.append({"id": f"b{b.id}_new",       "type": "info",    "msg": f"New booking request from {cname}.", "booking_id": b.id, "ts": b.updated_at.isoformat()})
            elif b.bargain_status == "customer_offered":
                notifs.append({"id": f"b{b.id}_offer",     "type": "bargain", "msg": f"{cname} sent a rate offer.", "booking_id": b.id, "ts": b.updated_at.isoformat()})
            elif b.status == "cancelled":
                notifs.append({"id": f"b{b.id}_cancelled", "type": "error",   "msg": f"{cname} cancelled their booking.", "booking_id": b.id, "ts": b.updated_at.isoformat()})

    return Response({"count": len(notifs), "results": notifs})