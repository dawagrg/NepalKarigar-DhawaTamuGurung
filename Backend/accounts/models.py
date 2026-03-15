import uuid
from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils import timezone
from django.core.validators import MinValueValidator, MaxValueValidator


# ── User ──────────────────────────────────────────────────────────────────────
class User(AbstractUser):
    ROLE_CHOICES = [
        ('customer', 'Customer'),
        ('karigar',  'Karigar / Worker'),
    ]
    phone_number  = models.CharField(max_length=15, unique=True)
    profile_image = models.ImageField(upload_to='profiles/', null=True, blank=True)
    role          = models.CharField(max_length=20, choices=ROLE_CHOICES, default='customer')
    bio           = models.TextField(blank=True, null=True)
    address       = models.CharField(max_length=255, blank=True, null=True)

    def __str__(self):
        return f"{self.username} ({self.role})"


# ── Password Reset ────────────────────────────────────────────────────────────
class PasswordResetToken(models.Model):
    user       = models.ForeignKey(User, on_delete=models.CASCADE)
    token      = models.UUIDField(default=uuid.uuid4, unique=True)
    created_at = models.DateTimeField(default=timezone.now)
    is_used    = models.BooleanField(default=False)

    def __str__(self):
        return f"Reset token for {self.user.username}"


# ── Sprint 2: Service Categories ──────────────────────────────────────────────
class ServiceCategory(models.Model):
    name        = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True, null=True)
    icon        = models.CharField(max_length=50, blank=True, null=True)
    is_active   = models.BooleanField(default=True)
    created_at  = models.DateTimeField(default=timezone.now)

    class Meta:
        verbose_name_plural = "Service Categories"
        ordering = ['name']

    def __str__(self):
        return self.name


class SubService(models.Model):
    category    = models.ForeignKey(ServiceCategory, on_delete=models.CASCADE,
                                    related_name='sub_services')
    name        = models.CharField(max_length=100)
    description = models.TextField(blank=True, null=True)
    base_price  = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)
    is_active   = models.BooleanField(default=True)

    class Meta:
        ordering = ['name']
        unique_together = ('category', 'name')

    def __str__(self):
        return f"{self.category.name} → {self.name}"


# ── Sprint 2: Karigar Profile ─────────────────────────────────────────────────
class KarigarProfile(models.Model):
    user             = models.OneToOneField(User, on_delete=models.CASCADE,
                                            related_name='karigar_profile')
    category         = models.ForeignKey(ServiceCategory, on_delete=models.SET_NULL,
                                         null=True, blank=True, related_name='karigars')
    sub_services     = models.ManyToManyField(SubService, blank=True, related_name='karigars')
    experience_years = models.PositiveIntegerField(default=0)
    hourly_rate      = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)
    location         = models.CharField(max_length=200, blank=True)
    district         = models.CharField(max_length=100, blank=True)
    available        = models.BooleanField(default=True)
    is_verified      = models.BooleanField(default=False)
    total_jobs       = models.PositiveIntegerField(default=0)
    avg_rating       = models.DecimalField(max_digits=3, decimal_places=2, default=0.00)

    class Meta:
        ordering = ['-avg_rating', '-total_jobs']

    def __str__(self):
        cat = self.category.name if self.category else "No Category"
        return f"{self.user.username} — {cat}"


class KarigarGallery(models.Model):
    karigar  = models.ForeignKey(KarigarProfile, on_delete=models.CASCADE,
                                 related_name='gallery')
    image    = models.ImageField(upload_to='gallery/')
    caption  = models.CharField(max_length=200, blank=True)
    uploaded = models.DateTimeField(default=timezone.now)

    class Meta:
        ordering = ['-uploaded']

    def __str__(self):
        return f"Gallery image for {self.karigar.user.username}"


# ── Sprint 3: Booking (with bargaining) ───────────────────────────────────────
class Booking(models.Model):
    STATUS_CHOICES = [
        ('pending',    'Pending'),       # customer sent booking request
        ('bargaining', 'Bargaining'),    # negotiation in progress
        ('accepted',   'Accepted'),      # karigar accepted
        ('rejected',   'Rejected'),      # karigar rejected
        ('cancelled',  'Cancelled'),     # customer cancelled
        ('completed',  'Completed'),     # job done
    ]
    BARGAIN_STATUS = [
        ('none',              'None'),
        ('customer_offered',  'Customer Offered'),   # customer sent offer
        ('karigar_countered', 'Karigar Countered'),  # karigar sent counter
        ('agreed',            'Agreed'),             # both agreed on rate
    ]

    user              = models.ForeignKey(User, on_delete=models.CASCADE,
                                          related_name='customer_bookings')
    karigar           = models.ForeignKey(User, on_delete=models.CASCADE,
                                          related_name='worker_bookings')
    sub_service       = models.ForeignKey(SubService, on_delete=models.SET_NULL,
                                          null=True, blank=True)
    address           = models.CharField(max_length=255)
    date              = models.DateField()
    note              = models.TextField(blank=True, null=True,
                                         help_text="Customer note to karigar")
    status            = models.CharField(max_length=20, choices=STATUS_CHOICES,
                                         default='pending')
    # ── Bargaining fields ────────────────────────────────────────────────────
    karigar_rate      = models.DecimalField(max_digits=8, decimal_places=2,
                                            null=True, blank=True,
                                            help_text="Karigar's listed hourly rate at time of booking")
    offered_rate      = models.DecimalField(max_digits=8, decimal_places=2,
                                            null=True, blank=True,
                                            help_text="Customer's offered rate")
    counter_rate      = models.DecimalField(max_digits=8, decimal_places=2,
                                            null=True, blank=True,
                                            help_text="Karigar's counter offer rate")
    final_rate        = models.DecimalField(max_digits=8, decimal_places=2,
                                            null=True, blank=True,
                                            help_text="Final agreed rate")
    bargain_status    = models.CharField(max_length=20, choices=BARGAIN_STATUS,
                                         default='none')
    bargain_message   = models.TextField(blank=True, null=True,
                                         help_text="Latest bargain message")
    # ─────────────────────────────────────────────────────────────────────────
    created_at        = models.DateTimeField(default=timezone.now)
    updated_at        = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.username} → {self.karigar.username} ({self.status})"


# ── Review ────────────────────────────────────────────────────────────────────
class Review(models.Model):
    user       = models.ForeignKey(User, on_delete=models.CASCADE,
                                   related_name='reviews_given')
    karigar    = models.ForeignKey(KarigarProfile, on_delete=models.CASCADE,
                                   related_name='reviews')
    booking    = models.OneToOneField(Booking, on_delete=models.SET_NULL,
                                      null=True, blank=True)
    rating     = models.IntegerField(validators=[MinValueValidator(1), MaxValueValidator(5)])
    comment    = models.TextField()
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.username} → {self.karigar} ({self.rating}★)"


# ── Karigar Application (verification before activation) ──────────────────────
class KarigarApplication(models.Model):
    STATUS_CHOICES = [
        ('pending',  'Pending Review'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    ]

    user               = models.OneToOneField(
                             User, on_delete=models.CASCADE,
                             related_name='karigar_application'
                         )
    # Personal details
    full_name          = models.CharField(max_length=200)
    date_of_birth      = models.DateField()
    age                = models.PositiveIntegerField()
    address            = models.CharField(max_length=300)
    district           = models.CharField(max_length=100)
    # Citizenship
    citizenship_number = models.CharField(max_length=50)
    citizenship_front  = models.ImageField(upload_to='applications/citizenship/')
    citizenship_back   = models.ImageField(upload_to='applications/citizenship/',
                                           null=True, blank=True)
    # Service evidence
    service_category   = models.ForeignKey(
                             'ServiceCategory', on_delete=models.SET_NULL,
                             null=True, blank=True
                         )
    service_title      = models.CharField(max_length=200)
    experience_years   = models.PositiveIntegerField(default=0)
    certificate        = models.ImageField(
                             upload_to='applications/certificates/',
                             null=True, blank=True
                         )
    work_sample        = models.ImageField(
                             upload_to='applications/samples/',
                             null=True, blank=True
                         )
    about_yourself     = models.TextField(blank=True)
    # Admin review
    status             = models.CharField(
                             max_length=20, choices=STATUS_CHOICES, default='pending'
                         )
    admin_note         = models.TextField(blank=True)
    submitted_at       = models.DateTimeField(default=timezone.now)
    reviewed_at        = models.DateTimeField(null=True, blank=True)
    reviewed_by        = models.ForeignKey(
                             User, on_delete=models.SET_NULL,
                             null=True, blank=True,
                             related_name='reviewed_applications'
                         )

    class Meta:
        ordering = ['-submitted_at']

    def __str__(self):
        return f"Application: {self.user.username} — {self.status}"