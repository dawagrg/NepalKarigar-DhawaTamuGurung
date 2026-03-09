from django.contrib import admin
from .models import User, KarigarProfile


@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ("id", "username", "email", "user_type", "phone", "location")
    list_filter = ("user_type",)
    search_fields = ("username", "email", "phone")


@admin.register(KarigarProfile)
class KarigarProfileAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "skill", "experience", "hourly_rate", "is_available")
    list_filter = ("skill", "is_available")
    search_fields = ("user__username", "skill")