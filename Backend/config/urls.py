from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/accounts/', include('accounts.urls')),
]

# ── Serve uploaded media files in development ─────────────────────────────────
# Without this, profile_image URLs like /media/profiles/photo.jpg return 404.
# In production you would configure nginx/Apache to serve the media folder instead.
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)