# donations/serializers.py

from rest_framework import serializers
from .models import Donation, Notification , MoneyDonation


from django.contrib.auth import get_user_model

User = get_user_model()


class NGOSerializer(serializers.ModelSerializer):
    """Lightweight serializer — just enough for the NGO picker dropdown."""
    class Meta:
        model = User
        fields = ["id", "username", "email"]


class MoneyDonationSerializer(serializers.ModelSerializer):
    donor = serializers.ReadOnlyField(source="donor.username")
    ngo_name = serializers.ReadOnlyField(source="ngo.username")

    class Meta:
        model = MoneyDonation
        fields = [
            "id", "donor", "ngo", "ngo_name",
            "amount", "currency", "payment_status",
            "paypal_order_id", "paypal_capture_id",
            "message", "created_at",
        ]
        read_only_fields = [
            "payment_status", "paypal_order_id",
            "paypal_capture_id", "created_at",
        ]


class DonationSerializer(serializers.ModelSerializer):
    owner = serializers.ReadOnlyField(source="owner.username")

    class Meta:
        model = Donation
        fields = "__all__"


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = "__all__"