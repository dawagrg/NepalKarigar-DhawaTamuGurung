from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):

    USER_TYPE_CHOICES = (
        ('customer', 'Customer'),
        ('karigar', 'Karigar'),
    )

    user_type = models.CharField(max_length=10, choices=USER_TYPE_CHOICES)
    phone = models.CharField(max_length=15)
    location = models.CharField(max_length=255)

    def __str__(self):
        return self.username


class KarigarProfile(models.Model):

    user = models.OneToOneField(User, on_delete=models.CASCADE)

    skill = models.CharField(max_length=100)

    experience = models.PositiveIntegerField(
        help_text="Years of experience"
    )

    bio = models.TextField(blank=True)

    hourly_rate = models.DecimalField(
        max_digits=8,
        decimal_places=2
    )

    is_available = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.user.username} - {self.skill}"