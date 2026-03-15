from django.urls import path
from . import views

urlpatterns = [

    # ── Auth ──────────────────────────────────────────────────────────────────
    path("register/",              views.register_user,          name="register"),
    path("login/",                 views.login_user,             name="login"),
    path("password-reset/request/",views.forgot_password,        name="forgot_password"),
    path("password-reset/confirm/",views.reset_password,         name="reset_password"),

    # ── Profile ───────────────────────────────────────────────────────────────
    path("profile/",               views.get_profile,            name="profile"),
    path("profile/update/",        views.update_profile,         name="profile_update"),
    path("profile/upload-image/",  views.upload_profile_image,   name="upload_profile_image"),
    path("change-password/",       views.change_password,        name="change_password"),

    # ── Categories & Karigar Search ───────────────────────────────────────────
    path("categories/",            views.list_categories,        name="categories"),
    path("karigars/",              views.list_karigars,          name="karigars"),
    path("karigars/search/",       views.search_karigars,        name="search_karigars"),
    path("karigars/<int:pk>/",     views.karigar_public_profile, name="karigar_profile"),
    path("karigars/<int:karigar_profile_id>/reviews/", views.list_karigar_reviews, name="karigar_reviews"),
    path("categories/<int:category_id>/karigars/", views.list_karigars_by_category, name="karigars_by_category"),

    # ── Karigar Dashboard ─────────────────────────────────────────────────────
    path("karigar-dashboard/",              views.karigar_dashboard,        name="karigar_dashboard"),
    path("karigar-dashboard/update/",       views.update_karigar_dashboard, name="karigar_dashboard_update"),
    path("karigar-dashboard/gallery/upload/", views.upload_gallery_image,   name="gallery_upload"),
    path("karigar-dashboard/gallery/<int:pk>/delete/", views.delete_gallery_image, name="gallery_delete"),

    # ── Bookings ──────────────────────────────────────────────────────────────
    path("bookings/",                  views.create_booking,         name="create_booking"),
    path("bookings/list/",             views.list_bookings,          name="list_bookings"),
    path("bookings/<int:pk>/",         views.booking_detail,         name="booking_detail"),
    path("bookings/<int:pk>/cancel/",  views.cancel_booking,         name="cancel_booking"),
    path("bookings/<int:pk>/respond/", views.respond_booking,        name="respond_booking"),
    path("bookings/<int:pk>/complete/",views.mark_booking_complete,  name="mark_complete"),

    # ── Bargaining ────────────────────────────────────────────────────────────
    path("bookings/<int:pk>/bargain/offer/",   views.bargain_offer,          name="bargain_offer"),
    path("bookings/<int:pk>/bargain/counter/", views.bargain_counter,        name="bargain_counter"),
    path("bookings/<int:pk>/bargain/accept/",  views.bargain_accept_counter, name="bargain_accept"),

    # ── Reviews ───────────────────────────────────────────────────────────────
    path("bookings/<int:booking_id>/review/",     views.submit_review,   name="submit_review"),
    path("bookings/<int:booking_id>/reviewable/", views.check_reviewable,name="check_reviewable"),
    path("reviews/<int:review_id>/",              views.edit_review,     name="edit_review"),
    path("reviews/<int:review_id>/delete/",       views.delete_review,   name="delete_review"),

    # ── Notifications ─────────────────────────────────────────────────────────
    path("notifications/",             views.get_notifications,      name="notifications"),

    # ── Karigar Application ──────────────────────────────────────────────────────
    path("karigar-application/submit/",              views.submit_karigar_application,   name="app_submit"),
    path("karigar-application/status/",              views.check_application_status,     name="app_status"),

    # ── Admin ─────────────────────────────────────────────────────────────────
    path("admin/stats/",                         views.admin_stats,              name="admin_stats"),
    path("admin/users/",                         views.admin_list_users,         name="admin_users"),
    path("admin/users/<int:pk>/toggle-active/",  views.admin_toggle_user_active, name="admin_toggle_user"),
    path("admin/karigars/",                      views.admin_list_karigars,      name="admin_karigars"),
    path("admin/karigars/<int:pk>/verify/",      views.admin_verify_karigar,     name="admin_verify"),
    path("admin/bookings/",                      views.admin_list_bookings,      name="admin_bookings"),

    # ── Admin: Applications ───────────────────────────────────────────────────
    path("admin/applications/",                      views.admin_list_applications,      name="admin_applications"),
    path("admin/applications/<int:app_id>/approve/", views.admin_approve_application,    name="admin_approve_app"),
    path("admin/applications/<int:app_id>/reject/",  views.admin_reject_application,     name="admin_reject_app"),
]