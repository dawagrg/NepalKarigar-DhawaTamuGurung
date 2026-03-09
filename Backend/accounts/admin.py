# from django.contrib import admin
# from .models import User, KarigarProfile, Skill, Booking, Review

# admin.site.register(User)
# admin.site.register(KarigarProfile)
# admin.site.register(Skill)
# admin.site.register(Booking)
# admin.site.register(Review)

from django.contrib import admin
from .models import User, KarigarProfile, Skill, Booking, Review


@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ('username', 'phone_number', 'is_staff')


@admin.register(KarigarProfile)
class KarigarAdmin(admin.ModelAdmin):
    list_display = ('user', 'skill', 'experience_years', 'location', 'available')


@admin.register(Skill)
class SkillAdmin(admin.ModelAdmin):
    list_display = ('name',)


@admin.register(Booking)
class BookingAdmin(admin.ModelAdmin):
    list_display = ('user', 'karigar', 'service', 'date', 'status')


@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display = ('user', 'karigar', 'rating')