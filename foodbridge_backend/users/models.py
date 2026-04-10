from django.contrib.auth.models import AbstractUser
from django.db import models


class CustomUser(AbstractUser):
    ROLE_CHOICES = (
        ("donor", "Donor"),
        ("ngo", "NGO"),
        ("volunteer", "Volunteer"),
        ("admin", "Admin"),
    )

    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default="donor")

    def __str__(self):
        return self.username