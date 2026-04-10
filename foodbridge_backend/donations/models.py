from django.db import models
from django.conf import settings


class Donation(models.Model):
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="donations"
    )
    food = models.CharField(max_length=255)
    quantity = models.CharField(max_length=100)
    expiry = models.DateTimeField()
    status = models.CharField(max_length=50, default="Pending")
    match_score = models.FloatField(default=0.0)

    points = models.IntegerField(default=0)
    badge = models.CharField(max_length=50, default="Starter")
    co2_saved = models.FloatField(default=0.0)
    meals_saved = models.IntegerField(default=0)

    latitude = models.FloatField(default=-1.2921)
    longitude = models.FloatField(default=36.8219)

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.food} - {self.owner.username}"


class Notification(models.Model):
    ROLE_CHOICES = (
        ("donor", "Donor"),
        ("ngo", "NGO"),
        ("volunteer", "Volunteer"),
        ("admin", "Admin"),
    )

    role = models.CharField(max_length=20, choices=ROLE_CHOICES)
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.role}: {self.message[:40]}"