from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from . import views

urlpatterns = [
    # Auth
    path("register/",               views.register_user,    name="register"),
    path("login/",                  views.login_user,       name="login"),
    path("token/refresh/",          TokenRefreshView.as_view(), name="token_refresh"),

    # Password reset
    path("forgot-password/",        views.forgot_password,  name="forgot_password"),
    path("reset-password/",         views.reset_password,   name="reset_password"),

    # Profile
    path("profile/",                views.get_profile,      name="profile"),
    path("profile/update/",         views.update_profile,   name="profile_update"),
    path("profile/change-password/",views.change_password,  name="change_password"),
]