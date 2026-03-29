from django.db import models

class Donation(models.Model):
    food = models.CharField(max_length=255)
    quantity = models.CharField(max_length=100)
    expiry = models.DateTimeField()
    status = models.CharField(max_length=50, default="Pending")
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.food