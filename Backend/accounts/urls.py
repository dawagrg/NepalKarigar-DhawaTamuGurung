from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    register_user,
    login_user,
    forgot_password,
    reset_password,
    get_profile,
    update_profile,
    change_password,
)

urlpatterns = [
    # 2.2.1 Auth
    path('register/', register_user),
    path('login/', login_user),
    path('token/refresh/', TokenRefreshView.as_view()),

    # 2.2.2 Forgot / Reset Password
    path('forgot-password/', forgot_password),
    path('reset-password/', reset_password),

    # 2.3 Profile Management
    path('profile/', get_profile),
    path('profile/update/', update_profile),
    path('profile/change-password/', change_password),
]