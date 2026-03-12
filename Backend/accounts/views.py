import uuid
from datetime import timedelta

from django.contrib.auth import get_user_model, authenticate
from django.utils import timezone as dj_timezone
from django.db.models import Q, Avg

from rest_framework.decorators  import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response    import Response
from rest_framework_simplejwt.tokens import RefreshToken

from .models import (
    PasswordResetToken, ServiceCategory, SubService,
    KarigarProfile, KarigarGallery, Booking, Review
)

User = get_user_model()

MEDIA_BASE = "http://127.0.0.1:8000"


# ══════════════════════════════════════════════════════════════════════════════
#  HELPERS
# ══════════════════════════════════════════════════════════════════════════════

def _tokens(user):
    refresh = RefreshToken.for_user(user)
    return {"refresh": str(refresh), "access": str(refresh.access_token)}


def _abs_url(request, relative_url):
    if not relative_url:
        return None
    if relative_url.startswith("http"):
        return relative_url
    return request.build_absolute_uri(relative_url)


def _user_data(user, request=None):
    image_url = None
    if user.profile_image:
        image_url = (_abs_url(request, user.profile_image.url)
                     if request else user.profile_image.url)
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


def _karigar_data(kp, request=None):
    """Serialize a KarigarProfile to a dict."""
    user = kp.user
    image_url = None
    if user.profile_image:
        image_url = (_abs_url(request, user.profile_image.url)
                     if request else user.profile_image.url)

    gallery = [
        {
            "id":      g.id,
            "image":   _abs_url(request, g.image.url) if g.image else None,
            "caption": g.caption,
        }
        for g in kp.gallery.all()
    ]

    sub_services = [
        {"id": ss.id, "name": ss.name, "base_price": str(ss.base_price or "")}
        for ss in kp.sub_services.filter(is_active=True)
    ]

    return {
        "karigar_profile_id": kp.id,
        "user_id":            user.id,
        "username":           user.username,
        "full_name":          f"{user.first_name} {user.last_name}".strip() or user.username,
        "profile_image":      image_url,
        "bio":                user.bio or "",
        "address":            user.address or "",
        "phone_number":       user.phone_number,
        "category_id":        kp.category.id   if kp.category else None,
        "category_name":      kp.category.name if kp.category else "",
        "sub_services":       sub_services,
        "experience_years":   kp.experience_years,
        "hourly_rate":        str(kp.hourly_rate) if kp.hourly_rate else "",
        "location":           kp.location,
        "district":           kp.district,
        "available":          kp.available,
        "is_verified":        kp.is_verified,
        "total_jobs":         kp.total_jobs,
        "avg_rating":         str(kp.avg_rating),
        "gallery":            gallery,
    }


# ══════════════════════════════════════════════════════════════════════════════
#  SPRINT 1 — AUTH
# ══════════════════════════════════════════════════════════════════════════════

@api_view(["POST"])
def register_user(request):
    data         = request.data
    username     = data.get("username", "").strip()
    phone_number = data.get("phone_number", "").strip()
    email        = data.get("email", "").strip()
    first_name   = data.get("first_name", "").strip()
    last_name    = data.get("last_name", "").strip()
    password     = data.get("password", "")
    role         = data.get("role", "customer")

    if not username:     return Response({"error": "Username is required."}, status=400)
    if not phone_number: return Response({"error": "Phone number is required."}, status=400)
    if not password:     return Response({"error": "Password is required."}, status=400)

    if User.objects.filter(username=username).exists():
        return Response({"error": "Username already taken."}, status=400)
    if User.objects.filter(phone_number=phone_number).exists():
        return Response({"error": "Phone number already registered."}, status=400)
    if email and User.objects.filter(email=email).exists():
        return Response({"error": "Email address already registered."}, status=400)

    user = User.objects.create_user(
        username=username, password=password,
        phone_number=phone_number, email=email,
        first_name=first_name, last_name=last_name, role=role,
    )
    tokens = _tokens(user)
    return Response({**tokens, **_user_data(user, request), "message": "Account created."}, status=201)


@api_view(["POST"])
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
                if user: break
            except User.DoesNotExist:
                pass
    if user is None:
        return Response({"error": "Incorrect credentials."}, status=401)

    return Response({**_tokens(user), **_user_data(user, request)})


@api_view(["POST"])
def forgot_password(request):
    identifier = request.data.get("identifier", "").strip()
    if not identifier:
        return Response({"error": "Please provide a phone number or email."}, status=400)
    user = None
    for field in ("phone_number", "email"):
        try:
            user = User.objects.get(**{field: identifier}); break
        except User.DoesNotExist:
            pass
    if not user:
        return Response({"error": "No account found."}, status=404)
    token = PasswordResetToken.objects.create(user=user)
    return Response({"message": "Token generated.", "reset_token": str(token.token)})


@api_view(["POST"])
def reset_password(request):
    token_str        = request.data.get("reset_token", "").strip()
    new_password     = request.data.get("new_password", "")
    confirm_password = request.data.get("confirm_password", "")
    if not token_str:
        return Response({"error": "Reset token is required."}, status=400)
    if new_password != confirm_password:
        return Response({"error": "Passwords do not match."}, status=400)
    if len(new_password) < 8:
        return Response({"error": "Password must be at least 8 characters."}, status=400)
    try:
        token = PasswordResetToken.objects.get(token=token_str, is_used=False)
    except PasswordResetToken.DoesNotExist:
        return Response({"error": "Invalid or already used token."}, status=400)
    if dj_timezone.now() - token.created_at > timedelta(hours=1):
        return Response({"error": "Token has expired."}, status=400)
    token.user.set_password(new_password)
    token.user.save()
    token.is_used = True
    token.save()
    return Response({"message": "Password updated."})


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_profile(request):
    return Response(_user_data(request.user, request))


@api_view(["PATCH"])
@permission_classes([IsAuthenticated])
def update_profile(request):
    user = request.user
    for field in ("first_name", "last_name", "email", "bio", "address"):
        val = request.data.get(field)
        if val is not None:
            setattr(user, field, val)
    phone = request.data.get("phone_number")
    if phone and phone != user.phone_number:
        if User.objects.filter(phone_number=phone).exclude(pk=user.pk).exists():
            return Response({"error": "Phone number already in use."}, status=400)
        user.phone_number = phone
    if "profile_image" in request.FILES:
        user.profile_image = request.FILES["profile_image"]
    user.save()
    return Response(_user_data(user, request))


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
        return Response({"error": "Passwords do not match."}, status=400)
    if len(new_password) < 8:
        return Response({"error": "Password must be at least 8 characters."}, status=400)
    user.set_password(new_password)
    user.save()
    return Response({**_tokens(user), "message": "Password changed."})


# ══════════════════════════════════════════════════════════════════════════════
#  SPRINT 2 — 3.2 SERVICE CATEGORIES & SUB-SERVICES
# ══════════════════════════════════════════════════════════════════════════════

@api_view(["GET"])
@permission_classes([AllowAny])
def list_categories(request):
    """
    GET /api/accounts/categories/
    Returns all active service categories with their sub-services.
    """
    cats = ServiceCategory.objects.filter(is_active=True)
    data = []
    for c in cats:
        subs = list(c.sub_services.filter(is_active=True).values(
            "id", "name", "description", "base_price"
        ))
        # Convert Decimal to string for JSON
        for s in subs:
            s["base_price"] = str(s["base_price"]) if s["base_price"] else ""
        data.append({
            "id":           c.id,
            "name":         c.name,
            "description":  c.description or "",
            "icon":         c.icon or "",
            "sub_services": subs,
            "karigar_count": c.karigars.filter(available=True).count(),
        })
    return Response(data)


@api_view(["GET"])
@permission_classes([AllowAny])
def get_category(request, pk):
    """GET /api/accounts/categories/<pk>/"""
    try:
        c = ServiceCategory.objects.get(pk=pk, is_active=True)
    except ServiceCategory.DoesNotExist:
        return Response({"error": "Category not found."}, status=404)
    subs = list(c.sub_services.filter(is_active=True).values(
        "id", "name", "description", "base_price"
    ))
    for s in subs:
        s["base_price"] = str(s["base_price"]) if s["base_price"] else ""
    return Response({
        "id": c.id, "name": c.name,
        "description": c.description or "",
        "icon": c.icon or "",
        "sub_services": subs,
    })


# ══════════════════════════════════════════════════════════════════════════════
#  SPRINT 2 — 3.3 SERVICE PROVIDER MANAGEMENT (Karigar Profile CRUD)
# ══════════════════════════════════════════════════════════════════════════════

@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def my_karigar_profile(request):
    """
    GET  /api/accounts/karigar/profile/  — get own karigar profile
    POST /api/accounts/karigar/profile/  — create karigar profile (karigar role only)
    """
    if request.user.role != "karigar":
        return Response({"error": "Only karigar accounts can manage a karigar profile."}, status=403)

    if request.method == "GET":
        try:
            kp = KarigarProfile.objects.get(user=request.user)
            return Response(_karigar_data(kp, request))
        except KarigarProfile.DoesNotExist:
            return Response({"error": "Karigar profile not created yet."}, status=404)

    # POST — create
    if KarigarProfile.objects.filter(user=request.user).exists():
        return Response({"error": "Profile already exists. Use PATCH to update."}, status=400)

    data = request.data
    category_id = data.get("category_id")
    category = None
    if category_id:
        try:
            category = ServiceCategory.objects.get(pk=category_id)
        except ServiceCategory.DoesNotExist:
            return Response({"error": "Category not found."}, status=400)

    kp = KarigarProfile.objects.create(
        user=request.user,
        category=category,
        experience_years=int(data.get("experience_years", 0)),
        hourly_rate=data.get("hourly_rate") or None,
        location=data.get("location", ""),
        district=data.get("district", ""),
        available=data.get("available", True),
    )
    # Attach sub-services
    sub_ids = data.get("sub_service_ids", [])
    if sub_ids:
        kp.sub_services.set(SubService.objects.filter(id__in=sub_ids))

    return Response(_karigar_data(kp, request), status=201)


@api_view(["PATCH"])
@permission_classes([IsAuthenticated])
def update_karigar_profile(request):
    """
    PATCH /api/accounts/karigar/profile/update/
    Update own karigar profile fields.
    """
    if request.user.role != "karigar":
        return Response({"error": "Only karigar accounts can update a karigar profile."}, status=403)
    try:
        kp = KarigarProfile.objects.get(user=request.user)
    except KarigarProfile.DoesNotExist:
        return Response({"error": "Karigar profile not found. Create one first."}, status=404)

    data = request.data

    category_id = data.get("category_id")
    if category_id:
        try:
            kp.category = ServiceCategory.objects.get(pk=category_id)
        except ServiceCategory.DoesNotExist:
            return Response({"error": "Category not found."}, status=400)

    for field in ("experience_years", "hourly_rate", "location", "district", "available"):
        val = data.get(field)
        if val is not None:
            setattr(kp, field, val)

    sub_ids = data.get("sub_service_ids")
    if sub_ids is not None:
        kp.sub_services.set(SubService.objects.filter(id__in=sub_ids))

    kp.save()
    return Response(_karigar_data(kp, request))


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def upload_gallery_image(request):
    """
    POST /api/accounts/karigar/gallery/
    Upload a work portfolio image.
    """
    if request.user.role != "karigar":
        return Response({"error": "Only karigar accounts can upload gallery images."}, status=403)
    try:
        kp = KarigarProfile.objects.get(user=request.user)
    except KarigarProfile.DoesNotExist:
        return Response({"error": "Create a karigar profile first."}, status=404)

    if "image" not in request.FILES:
        return Response({"error": "No image file provided."}, status=400)

    img = KarigarGallery.objects.create(
        karigar=kp,
        image=request.FILES["image"],
        caption=request.data.get("caption", ""),
    )
    return Response({
        "id":      img.id,
        "image":   request.build_absolute_uri(img.image.url),
        "caption": img.caption,
    }, status=201)


@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def delete_gallery_image(request, pk):
    """DELETE /api/accounts/karigar/gallery/<pk>/"""
    try:
        img = KarigarGallery.objects.get(pk=pk, karigar__user=request.user)
    except KarigarGallery.DoesNotExist:
        return Response({"error": "Image not found."}, status=404)
    img.image.delete(save=False)
    img.delete()
    return Response({"message": "Image deleted."})


# ══════════════════════════════════════════════════════════════════════════════
#  SPRINT 2 — 3.4 ADVANCED SEARCH & FILTER
# ══════════════════════════════════════════════════════════════════════════════

@api_view(["GET"])
@permission_classes([AllowAny])
def search_karigars(request):
    """
    GET /api/accounts/karigars/search/
    Query params:
      q          — name / username / bio keyword
      category   — ServiceCategory id
      district   — district name (partial match)
      available  — true/false
      min_rate   — minimum hourly rate (NPR)
      max_rate   — maximum hourly rate (NPR)
      min_rating — minimum avg rating (0-5)
      min_exp    — minimum experience years
      ordering   — rating | jobs | rate_asc | rate_desc | newest
      page       — page number (default 1)
      page_size  — results per page (default 12, max 50)
    """
    qs = KarigarProfile.objects.select_related('user', 'category') \
                               .prefetch_related('sub_services', 'gallery')

    # keyword
    q = request.GET.get("q", "").strip()
    if q:
        qs = qs.filter(
            Q(user__first_name__icontains=q) |
            Q(user__last_name__icontains=q)  |
            Q(user__username__icontains=q)   |
            Q(user__bio__icontains=q)         |
            Q(location__icontains=q)          |
            Q(category__name__icontains=q)
        )

    # category filter
    category = request.GET.get("category")
    if category:
        qs = qs.filter(category_id=category)

    # district filter
    district = request.GET.get("district", "").strip()
    if district:
        qs = qs.filter(district__icontains=district)

    # availability
    available = request.GET.get("available", "").lower()
    if available == "true":
        qs = qs.filter(available=True)
    elif available == "false":
        qs = qs.filter(available=False)

    # rate range
    min_rate = request.GET.get("min_rate")
    max_rate = request.GET.get("max_rate")
    if min_rate:
        qs = qs.filter(hourly_rate__gte=min_rate)
    if max_rate:
        qs = qs.filter(hourly_rate__lte=max_rate)

    # rating
    min_rating = request.GET.get("min_rating")
    if min_rating:
        qs = qs.filter(avg_rating__gte=min_rating)

    # experience
    min_exp = request.GET.get("min_exp")
    if min_exp:
        qs = qs.filter(experience_years__gte=min_exp)

    # ordering
    ordering = request.GET.get("ordering", "rating")
    ORDER_MAP = {
        "rating":    "-avg_rating",
        "jobs":      "-total_jobs",
        "rate_asc":  "hourly_rate",
        "rate_desc": "-hourly_rate",
        "newest":    "-user__date_joined",
    }
    qs = qs.order_by(ORDER_MAP.get(ordering, "-avg_rating"))

    # pagination
    try:
        page      = max(1, int(request.GET.get("page", 1)))
        page_size = min(50, max(1, int(request.GET.get("page_size", 12))))
    except ValueError:
        page, page_size = 1, 12

    total   = qs.count()
    start   = (page - 1) * page_size
    results = qs[start: start + page_size]

    return Response({
        "total":     total,
        "page":      page,
        "page_size": page_size,
        "pages":     (total + page_size - 1) // page_size,
        "results":   [_karigar_data(kp, request) for kp in results],
    })


# ══════════════════════════════════════════════════════════════════════════════
#  SPRINT 2 — 3.5 WORKER PROFILE PAGE (public view)
# ══════════════════════════════════════════════════════════════════════════════

@api_view(["GET"])
@permission_classes([AllowAny])
def karigar_public_profile(request, pk):
    """
    GET /api/accounts/karigars/<pk>/
    Public karigar profile with reviews.
    """
    try:
        kp = KarigarProfile.objects.select_related('user', 'category') \
                                   .prefetch_related('sub_services', 'gallery', 'reviews') \
                                   .get(pk=pk)
    except KarigarProfile.DoesNotExist:
        return Response({"error": "Karigar not found."}, status=404)

    data = _karigar_data(kp, request)

    # Attach reviews
    reviews = kp.reviews.select_related('user').order_by('-created_at')[:20]
    data["reviews"] = [
        {
            "reviewer":   r.user.get_full_name() or r.user.username,
            "avatar":     _abs_url(request, r.user.profile_image.url) if r.user.profile_image else None,
            "rating":     r.rating,
            "comment":    r.comment,
            "date":       r.created_at.strftime("%Y-%m-%d"),
        }
        for r in reviews
    ]
    return Response(data)


@api_view(["GET"])
@permission_classes([AllowAny])
def list_karigars_by_category(request, category_id):
    """
    GET /api/accounts/categories/<category_id>/karigars/
    All available karigars for a given category.
    """
    try:
        cat = ServiceCategory.objects.get(pk=category_id, is_active=True)
    except ServiceCategory.DoesNotExist:
        return Response({"error": "Category not found."}, status=404)

    qs = KarigarProfile.objects.filter(category=cat, available=True) \
                               .select_related('user') \
                               .prefetch_related('sub_services', 'gallery') \
                               .order_by('-avg_rating')

    return Response({
        "category": cat.name,
        "total":    qs.count(),
        "results":  [_karigar_data(kp, request) for kp in qs],
    })


# ══════════════════════════════════════════════════════════════════════════════
#  SPRINT 3 — BOOKING, CANCELLATION & BARGAINING
# ══════════════════════════════════════════════════════════════════════════════

def _booking_data(b, request=None):
    """Serialize a Booking to a dict."""
    karigar_img = None
    customer_img = None
    try:
        if b.karigar.profile_image:
            karigar_img = _abs_url(request, b.karigar.profile_image.url)
    except Exception:
        pass
    try:
        if b.user.profile_image:
            customer_img = _abs_url(request, b.user.profile_image.url)
    except Exception:
        pass

    return {
        "id":              b.id,
        "status":          b.status,
        "bargain_status":  b.bargain_status,
        # Customer info
        "customer_id":     b.user.id,
        "customer_name":   f"{b.user.first_name} {b.user.last_name}".strip() or b.user.username,
        "customer_username": b.user.username,
        "customer_image":  customer_img,
        "customer_phone":  b.user.phone_number,
        # Karigar info
        "karigar_id":      b.karigar.id,
        "karigar_name":    f"{b.karigar.first_name} {b.karigar.last_name}".strip() or b.karigar.username,
        "karigar_username": b.karigar.username,
        "karigar_image":   karigar_img,
        "karigar_phone":   b.karigar.phone_number,
        # Service info
        "sub_service_id":  b.sub_service.id   if b.sub_service else None,
        "sub_service_name":b.sub_service.name if b.sub_service else "",
        # Booking details
        "address":         b.address,
        "date":            str(b.date),
        "note":            b.note or "",
        # Rates
        "karigar_rate":    str(b.karigar_rate)  if b.karigar_rate  else "",
        "offered_rate":    str(b.offered_rate)  if b.offered_rate  else "",
        "counter_rate":    str(b.counter_rate)  if b.counter_rate  else "",
        "final_rate":      str(b.final_rate)    if b.final_rate    else "",
        "bargain_message": b.bargain_message or "",
        # Timestamps
        "created_at":      b.created_at.strftime("%Y-%m-%d %H:%M") if b.created_at else "",
        "updated_at":      b.updated_at.strftime("%Y-%m-%d %H:%M") if b.updated_at else "",
    }


# ── 3.1 Create Booking ────────────────────────────────────────────────────────
@api_view(["POST"])
@permission_classes([IsAuthenticated])
def create_booking(request):
    """
    POST /api/accounts/bookings/
    Customer creates a booking request.
    Body: { karigar_user_id, sub_service_id (opt), address, date, note (opt), offered_rate (opt) }
    """
    if request.user.role != "customer":
        return Response({"error": "Only customers can create bookings."}, status=403)

    data = request.data
    karigar_user_id = data.get("karigar_user_id")
    if not karigar_user_id:
        return Response({"error": "karigar_user_id is required."}, status=400)

    try:
        karigar_user = User.objects.get(pk=karigar_user_id, role="karigar")
    except User.DoesNotExist:
        return Response({"error": "Karigar not found."}, status=404)

    address = data.get("address", "").strip()
    date    = data.get("date", "")
    if not address or not date:
        return Response({"error": "address and date are required."}, status=400)

    sub_service = None
    sub_service_id = data.get("sub_service_id")
    if sub_service_id:
        try:
            sub_service = SubService.objects.get(pk=sub_service_id)
        except SubService.DoesNotExist:
            return Response({"error": "Sub-service not found."}, status=400)

    # Get karigar's current hourly rate
    karigar_rate = None
    try:
        kp = KarigarProfile.objects.get(user=karigar_user)
        karigar_rate = kp.hourly_rate
    except KarigarProfile.DoesNotExist:
        pass

    offered_rate   = data.get("offered_rate")
    bargain_status = "none"
    booking_status = "pending"

    # If customer sends an offered rate different from karigar's rate → bargaining
    if offered_rate and karigar_rate:
        try:
            if float(offered_rate) != float(karigar_rate):
                bargain_status = "customer_offered"
                booking_status = "bargaining"
        except (ValueError, TypeError):
            pass

    booking = Booking.objects.create(
        user          = request.user,
        karigar       = karigar_user,
        sub_service   = sub_service,
        address       = address,
        date          = date,
        note          = data.get("note", ""),
        status        = booking_status,
        karigar_rate  = karigar_rate,
        offered_rate  = offered_rate if offered_rate else None,
        bargain_status= bargain_status,
        bargain_message = data.get("bargain_message", ""),
    )
    return Response(_booking_data(booking, request), status=201)


# ── 3.2 List Bookings ─────────────────────────────────────────────────────────
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def list_bookings(request):
    """
    GET /api/accounts/bookings/
    Customer sees their own bookings. Karigar sees bookings assigned to them.
    Query param: status (optional filter)
    """
    status_filter = request.GET.get("status", "")
    if request.user.role == "customer":
        qs = Booking.objects.filter(user=request.user)
    else:
        qs = Booking.objects.filter(karigar=request.user)

    if status_filter:
        qs = qs.filter(status=status_filter)

    qs = qs.select_related("user", "karigar", "sub_service").order_by("-created_at")
    return Response([_booking_data(b, request) for b in qs])


# ── 3.3 Booking Detail ────────────────────────────────────────────────────────
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def booking_detail(request, pk):
    """GET /api/accounts/bookings/<pk>/"""
    try:
        b = Booking.objects.select_related("user", "karigar", "sub_service").get(pk=pk)
    except Booking.DoesNotExist:
        return Response({"error": "Booking not found."}, status=404)

    if b.user != request.user and b.karigar != request.user:
        return Response({"error": "Not authorised."}, status=403)

    return Response(_booking_data(b, request))


# ── 3.4 Cancel Booking (customer only) ───────────────────────────────────────
@api_view(["POST"])
@permission_classes([IsAuthenticated])
def cancel_booking(request, pk):
    """
    POST /api/accounts/bookings/<pk>/cancel/
    Customer cancels a booking. Only allowed if status is pending/bargaining.
    """
    try:
        b = Booking.objects.get(pk=pk, user=request.user)
    except Booking.DoesNotExist:
        return Response({"error": "Booking not found."}, status=404)

    if b.status not in ("pending", "bargaining"):
        return Response({"error": f"Cannot cancel a booking with status '{b.status}'."}, status=400)

    b.status = "cancelled"
    b.save()
    return Response(_booking_data(b, request))


# ── 3.5 Karigar: Accept or Reject ────────────────────────────────────────────
@api_view(["POST"])
@permission_classes([IsAuthenticated])
def respond_booking(request, pk):
    """
    POST /api/accounts/bookings/<pk>/respond/
    Karigar accepts or rejects a booking.
    Body: { action: "accept" | "reject" }
    """
    if request.user.role != "karigar":
        return Response({"error": "Only karigars can respond to bookings."}, status=403)

    try:
        b = Booking.objects.get(pk=pk, karigar=request.user)
    except Booking.DoesNotExist:
        return Response({"error": "Booking not found."}, status=404)

    if b.status not in ("pending", "bargaining"):
        return Response({"error": f"Cannot respond to a booking with status '{b.status}'."}, status=400)

    action = request.data.get("action", "")
    if action == "accept":
        b.status     = "accepted"
        # If a bargaining was ongoing, set final_rate to offered or counter rate
        if b.bargain_status == "customer_offered" and b.offered_rate:
            b.final_rate = b.offered_rate
        elif b.bargain_status == "karigar_countered" and b.counter_rate:
            b.final_rate = b.counter_rate
        else:
            b.final_rate = b.karigar_rate
        b.bargain_status = "agreed"
    elif action == "reject":
        b.status = "rejected"
    else:
        return Response({"error": "action must be 'accept' or 'reject'."}, status=400)

    b.save()
    return Response(_booking_data(b, request))


# ── 3.6 Bargain: Customer makes an offer ────────────────────────────────────
@api_view(["POST"])
@permission_classes([IsAuthenticated])
def bargain_offer(request, pk):
    """
    POST /api/accounts/bookings/<pk>/bargain/offer/
    Customer sends or updates their offered rate.
    Body: { offered_rate, message (opt) }
    """
    try:
        b = Booking.objects.get(pk=pk, user=request.user)
    except Booking.DoesNotExist:
        return Response({"error": "Booking not found."}, status=404)

    if b.status not in ("pending", "bargaining"):
        return Response({"error": "Cannot bargain on this booking."}, status=400)

    offered_rate = request.data.get("offered_rate")
    if not offered_rate:
        return Response({"error": "offered_rate is required."}, status=400)

    try:
        offered_rate = float(offered_rate)
        if offered_rate <= 0:
            raise ValueError
    except (ValueError, TypeError):
        return Response({"error": "offered_rate must be a positive number."}, status=400)

    b.offered_rate    = offered_rate
    b.bargain_status  = "customer_offered"
    b.bargain_message = request.data.get("message", b.bargain_message or "")
    b.status          = "bargaining"
    b.save()
    return Response(_booking_data(b, request))


# ── 3.7 Bargain: Karigar sends counter-offer ─────────────────────────────────
@api_view(["POST"])
@permission_classes([IsAuthenticated])
def bargain_counter(request, pk):
    """
    POST /api/accounts/bookings/<pk>/bargain/counter/
    Karigar sends a counter-offer rate.
    Body: { counter_rate, message (opt) }
    """
    if request.user.role != "karigar":
        return Response({"error": "Only karigars can send counter offers."}, status=403)

    try:
        b = Booking.objects.get(pk=pk, karigar=request.user)
    except Booking.DoesNotExist:
        return Response({"error": "Booking not found."}, status=404)

    if b.status not in ("pending", "bargaining"):
        return Response({"error": "Cannot bargain on this booking."}, status=400)

    counter_rate = request.data.get("counter_rate")
    if not counter_rate:
        return Response({"error": "counter_rate is required."}, status=400)

    try:
        counter_rate = float(counter_rate)
        if counter_rate <= 0:
            raise ValueError
    except (ValueError, TypeError):
        return Response({"error": "counter_rate must be a positive number."}, status=400)

    b.counter_rate    = counter_rate
    b.bargain_status  = "karigar_countered"
    b.bargain_message = request.data.get("message", b.bargain_message or "")
    b.status          = "bargaining"
    b.save()
    return Response(_booking_data(b, request))


# ── 3.8 Bargain: Customer accepts karigar counter ────────────────────────────
@api_view(["POST"])
@permission_classes([IsAuthenticated])
def bargain_accept_counter(request, pk):
    """
    POST /api/accounts/bookings/<pk>/bargain/accept/
    Customer accepts karigar's counter-offer → booking moves to accepted.
    """
    try:
        b = Booking.objects.get(pk=pk, user=request.user)
    except Booking.DoesNotExist:
        return Response({"error": "Booking not found."}, status=404)

    if b.bargain_status != "karigar_countered":
        return Response({"error": "No counter offer to accept."}, status=400)

    b.final_rate     = b.counter_rate
    b.bargain_status = "agreed"
    b.status         = "accepted"
    b.save()
    return Response(_booking_data(b, request))