from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from . import views

urlpatterns = [

    # ── Sprint 1: Auth ────────────────────────────────────────────────────────
    path("register/",                views.register_user,          name="register"),
    path("login/",                   views.login_user,             name="login"),
    path("token/refresh/",           TokenRefreshView.as_view(),   name="token_refresh"),
    path("forgot-password/",         views.forgot_password,        name="forgot_password"),
    path("reset-password/",          views.reset_password,         name="reset_password"),

    # ── Sprint 1: Profile ─────────────────────────────────────────────────────
    path("profile/",                 views.get_profile,            name="profile"),
    path("profile/update/",          views.update_profile,         name="profile_update"),
    path("profile/change-password/", views.change_password,        name="change_password"),

    # ── Sprint 2: Service Categories ──────────────────────────────────────────
    path("categories/",              views.list_categories,        name="categories"),
    path("categories/<int:pk>/",     views.get_category,           name="category_detail"),
    path("categories/<int:category_id>/karigars/",
                                     views.list_karigars_by_category,
                                     name="karigars_by_category"),

    # ── Sprint 2: Karigar Profile Management ─────────────────────────────────
    path("karigar/profile/",         views.my_karigar_profile,     name="my_karigar_profile"),
    path("karigar/profile/update/",  views.update_karigar_profile, name="karigar_profile_update"),
    path("karigar/gallery/",         views.upload_gallery_image,   name="gallery_upload"),
    path("karigar/gallery/<int:pk>/",views.delete_gallery_image,   name="gallery_delete"),

    # ── Sprint 2: Search & Public Profile ────────────────────────────────────
    path("karigars/search/",         views.search_karigars,        name="karigars_search"),
    path("karigars/<int:pk>/",       views.karigar_public_profile, name="karigar_public"),

    # ── Sprint 3: Booking ─────────────────────────────────────────────────────
    path("bookings/",                views.create_booking,         name="booking_create"),
    path("bookings/list/",           views.list_bookings,          name="booking_list"),
    path("bookings/<int:pk>/",       views.booking_detail,         name="booking_detail"),
    path("bookings/<int:pk>/cancel/",views.cancel_booking,         name="booking_cancel"),
    path("bookings/<int:pk>/respond/",views.respond_booking,       name="booking_respond"),

    # ── Sprint 3: Bargaining ──────────────────────────────────────────────────
    path("bookings/<int:pk>/bargain/offer/",
                                     views.bargain_offer,          name="bargain_offer"),
    path("bookings/<int:pk>/bargain/counter/",
                                     views.bargain_counter,        name="bargain_counter"),
    path("bookings/<int:pk>/bargain/accept/",
                                     views.bargain_accept_counter, name="bargain_accept"),
]