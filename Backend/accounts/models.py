from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    phone_number = models.CharField(max_length=15, unique=True)
    profile_image = models.ImageField(upload_to="profiles/", null=True, blank=True)

    def __str__(self):
        return self.username


class Skill(models.Model):
    name = models.CharField(max_length=100)

    def __str__(self):
        return self.name


class KarigarProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    skill = models.ForeignKey(Skill, on_delete=models.CASCADE)
    experience_years = models.IntegerField()
    location = models.CharField(max_length=200)
    available = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.user.username} - {self.skill.name}"


class Booking(models.Model):

    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('accepted', 'Accepted'),
        ('rejected', 'Rejected'),
        ('completed', 'Completed'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="customer")
    karigar = models.ForeignKey(User, on_delete=models.CASCADE, related_name="worker")
    service = models.ForeignKey(Skill, on_delete=models.CASCADE)
    address = models.CharField(max_length=255)
    date = models.DateField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending")

    def __str__(self):
        return f"{self.user} -> {self.karigar}"


class Review(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    karigar = models.ForeignKey(KarigarProfile, on_delete=models.CASCADE)
    rating = models.IntegerField()
    comment = models.TextField()

    def __str__(self):
        return f"{self.user} review {self.karigar}"