from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.utils.html import format_html
from .models import (
    User, PasswordResetToken,
    ServiceCategory, SubService,
    KarigarProfile, KarigarGallery,
    Booking, Review, KarigarApplication,
    AdminNotification, Complaint,
)


# ── User ──────────────────────────────────────────────────────────────────────
@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display  = ('username', 'full_name', 'role', 'phone_number', 'email', 'avatar_preview', 'is_active', 'date_joined')
    list_filter   = ('role', 'is_active', 'is_staff', 'date_joined')
    search_fields = ('username', 'email', 'phone_number', 'first_name', 'last_name')
    ordering      = ('-date_joined',)
    fieldsets     = BaseUserAdmin.fieldsets + (
        ('NepalKarigar Profile', {'fields': ('role', 'phone_number', 'profile_image', 'bio', 'address')}),
    )
    add_fieldsets = BaseUserAdmin.add_fieldsets + (
        ('NepalKarigar Profile', {'fields': ('role', 'phone_number', 'email', 'first_name', 'last_name')}),
    )

    def full_name(self, obj):
        return f"{obj.first_name} {obj.last_name}".strip() or "—"
    full_name.short_description = 'Name'

    def avatar_preview(self, obj):
        if obj.profile_image:
            return format_html('<img src="{}" style="width:36px;height:36px;border-radius:50%;object-fit:cover;"/>', obj.profile_image.url)
        return "—"
    avatar_preview.short_description = 'Photo'


# ── Password Reset Token ──────────────────────────────────────────────────────
@admin.register(PasswordResetToken)
class PasswordResetTokenAdmin(admin.ModelAdmin):
    list_display  = ('user', 'token', 'created_at', 'is_used')
    list_filter   = ('is_used',)
    search_fields = ('user__username',)
    ordering      = ('-created_at',)


# ── Service Category ──────────────────────────────────────────────────────────
class SubServiceInline(admin.TabularInline):
    model  = SubService
    extra  = 1
    fields = ('name', 'description', 'base_price', 'is_active')

@admin.register(ServiceCategory)
class ServiceCategoryAdmin(admin.ModelAdmin):
    list_display  = ('name', 'icon', 'is_active', 'karigar_count', 'sub_service_count', 'created_at')
    list_filter   = ('is_active',)
    search_fields = ('name',)
    inlines       = [SubServiceInline]

    def karigar_count(self, obj):
        return obj.karigars.count()
    karigar_count.short_description = 'Karigars'

    def sub_service_count(self, obj):
        return obj.sub_services.count()
    sub_service_count.short_description = 'Sub-services'


# ── Sub-service ───────────────────────────────────────────────────────────────
@admin.register(SubService)
class SubServiceAdmin(admin.ModelAdmin):
    list_display  = ('name', 'category', 'base_price', 'is_active')
    list_filter   = ('category', 'is_active')
    search_fields = ('name', 'category__name')


# ── Karigar Profile ───────────────────────────────────────────────────────────
class GalleryInline(admin.TabularInline):
    model  = KarigarGallery
    extra  = 0
    fields = ('image', 'caption')
    readonly_fields = ('image_preview',)

    def image_preview(self, obj):
        if obj.image:
            return format_html('<img src="{}" style="width:60px;height:60px;object-fit:cover;border-radius:6px;"/>', obj.image.url)
        return "—"

@admin.register(KarigarProfile)
class KarigarProfileAdmin(admin.ModelAdmin):
    list_display   = ('user', 'category', 'district', 'hourly_rate', 'experience_years', 'available', 'is_verified', 'avg_rating', 'total_jobs')
    list_filter    = ('category', 'available', 'is_verified', 'district')
    search_fields  = ('user__username', 'user__phone_number', 'location', 'district')
    filter_horizontal = ('sub_services',)
    inlines        = [GalleryInline]
    actions        = ['verify_karigars', 'unverify_karigars']

    def verify_karigars(self, request, queryset):
        queryset.update(is_verified=True)
        self.message_user(request, f"{queryset.count()} karigar(s) verified.")
    verify_karigars.short_description = "✓ Mark selected karigars as verified"

    def unverify_karigars(self, request, queryset):
        queryset.update(is_verified=False)
        self.message_user(request, f"{queryset.count()} karigar(s) unverified.")
    unverify_karigars.short_description = "✗ Remove verification from selected karigars"


# ── Booking ───────────────────────────────────────────────────────────────────
@admin.register(Booking)
class BookingAdmin(admin.ModelAdmin):
    list_display  = ('user', 'karigar', 'sub_service', 'date', 'status',
                     'bargain_status', 'karigar_rate', 'offered_rate', 'counter_rate', 'final_rate', 'created_at')
    list_filter   = ('status', 'bargain_status', 'sub_service__category', 'date')
    search_fields = ('user__username', 'karigar__username')
    ordering      = ('-created_at',)
    readonly_fields = ('created_at', 'updated_at')


# ── Review ────────────────────────────────────────────────────────────────────
@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display  = ('user', 'karigar', 'rating', 'short_comment', 'created_at')
    list_filter   = ('rating',)
    search_fields = ('user__username',)

    def short_comment(self, obj):
        return obj.comment[:60] + ('…' if len(obj.comment) > 60 else '')
    short_comment.short_description = 'Comment'


# ── Karigar Application ───────────────────────────────────────────────────────
@admin.register(KarigarApplication)
class KarigarApplicationAdmin(admin.ModelAdmin):
    list_display   = ('full_name', 'username_display', 'phone_display', 'service_title',
                      'district', 'status', 'submitted_at')
    list_filter    = ('status', 'district', 'service_category')
    search_fields  = ('full_name', 'user__username', 'user__phone_number',
                      'citizenship_number', 'service_title')
    ordering       = ('-submitted_at',)
    readonly_fields = ('submitted_at', 'reviewed_at', 'reviewed_by')

    def username_display(self, obj):
        return obj.user.username
    username_display.short_description = "Username"

    def phone_display(self, obj):
        return obj.user.phone_number
    phone_display.short_description = "Phone"


# ── Admin Notification ────────────────────────────────────────────────────────
@admin.register(AdminNotification)
class AdminNotificationAdmin(admin.ModelAdmin):
    list_display  = ('type', 'title', 'is_read', 'created_at')
    list_filter   = ('type', 'is_read')
    ordering      = ('-created_at',)
    readonly_fields = ('created_at',)


# ── Complaint ─────────────────────────────────────────────────────────────────
@admin.register(Complaint)
class ComplaintAdmin(admin.ModelAdmin):
    list_display  = ('complainant', 'accused', 'category', 'title', 'status', 'created_at')
    list_filter   = ('status', 'category')
    search_fields = ('complainant__username', 'accused__username', 'title')
    ordering      = ('-created_at',)
    readonly_fields = ('created_at', 'updated_at')