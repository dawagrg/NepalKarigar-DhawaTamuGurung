from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.utils.html import format_html
from .models import User, KarigarProfile, Skill, Booking, Review, PasswordResetToken


# ── User Admin ────────────────────────────────────────────────────────────────
@admin.register(User)
class UserAdmin(BaseUserAdmin):
    """
    Full user admin panel.
    Lists all customers and karigars with their role, phone, and photo.
    """
    list_display  = ('username', 'full_name', 'role', 'phone_number', 'email', 'avatar_preview', 'is_active', 'date_joined')
    list_filter   = ('role', 'is_active', 'is_staff', 'date_joined')
    search_fields = ('username', 'email', 'phone_number', 'first_name', 'last_name')
    ordering      = ('-date_joined',)

    # Add our custom fields to the existing change form
    fieldsets = BaseUserAdmin.fieldsets + (
        ('NepalKarigar Profile', {
            'fields': ('role', 'phone_number', 'profile_image', 'bio', 'address')
        }),
    )
    add_fieldsets = BaseUserAdmin.add_fieldsets + (
        ('NepalKarigar Profile', {
            'fields': ('role', 'phone_number', 'email', 'first_name', 'last_name')
        }),
    )

    def full_name(self, obj):
        return f"{obj.first_name} {obj.last_name}".strip() or "—"
    full_name.short_description = 'Name'

    def avatar_preview(self, obj):
        if obj.profile_image:
            return format_html(
                '<img src="{}" style="width:36px;height:36px;border-radius:50%;object-fit:cover;" />',
                obj.profile_image.url
            )
        return "—"
    avatar_preview.short_description = 'Photo'


# ── KarigarProfile Admin ──────────────────────────────────────────────────────
@admin.register(KarigarProfile)
class KarigarProfileAdmin(admin.ModelAdmin):
    list_display  = ('user', 'skill', 'experience_years', 'location', 'available')
    list_filter   = ('skill', 'available')
    search_fields = ('user__username', 'user__phone_number', 'location')


# ── Skill Admin ───────────────────────────────────────────────────────────────
@admin.register(Skill)
class SkillAdmin(admin.ModelAdmin):
    list_display  = ('name',)
    search_fields = ('name',)


# ── Booking Admin ─────────────────────────────────────────────────────────────
@admin.register(Booking)
class BookingAdmin(admin.ModelAdmin):
    list_display  = ('user', 'karigar', 'service', 'date', 'status')
    list_filter   = ('status', 'service', 'date')
    search_fields = ('user__username', 'karigar__username')
    ordering      = ('-date',)


# ── Review Admin ──────────────────────────────────────────────────────────────
@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display  = ('user', 'karigar', 'rating', 'short_comment')
    list_filter   = ('rating',)
    search_fields = ('user__username',)

    def short_comment(self, obj):
        return obj.comment[:60] + ('…' if len(obj.comment) > 60 else '')
    short_comment.short_description = 'Comment'


# ── Password Reset Token Admin ────────────────────────────────────────────────
@admin.register(PasswordResetToken)
class PasswordResetTokenAdmin(admin.ModelAdmin):
    list_display  = ('user', 'token', 'created_at', 'is_used')
    list_filter   = ('is_used',)
    search_fields = ('user__username',)
    ordering      = ('-created_at',)