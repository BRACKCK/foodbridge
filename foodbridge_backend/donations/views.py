from django.utils import timezone
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status

from .models import Donation, Notification
from .serializers import DonationSerializer, NotificationSerializer


def calculate_match_score(expiry, quantity, status_value):
    now = timezone.now()
    hours_left = (expiry - now).total_seconds() / 3600 if expiry else 0

    if hours_left <= 6:
        urgency_score = 50
    elif hours_left <= 24:
        urgency_score = 40
    elif hours_left <= 72:
        urgency_score = 25
    else:
        urgency_score = 10

    quantity_str = str(quantity).lower()
    quantity_score = 10
    if any(x in quantity_str for x in ["50", "100", "large", "many", "bulk"]):
        quantity_score = 30
    elif any(x in quantity_str for x in ["20", "25", "30"]):
        quantity_score = 20

    status_score = 20 if status_value == "Pending" else 5

    return urgency_score + quantity_score + status_score


def calculate_points(quantity):
    quantity_str = str(quantity).lower()

    if any(x in quantity_str for x in ["50", "100", "large", "many", "bulk"]):
        return 50
    elif any(x in quantity_str for x in ["20", "25", "30"]):
        return 30
    return 10


def calculate_badge(total_points):
    if total_points >= 300:
        return "Hero"
    elif total_points >= 150:
        return "Champion"
    elif total_points >= 50:
        return "Supporter"
    return "Starter"


def calculate_impact(quantity):
    quantity_str = str(quantity).lower()

    if "kg" in quantity_str:
        try:
            number = float(quantity_str.replace("kg", "").strip())
        except ValueError:
            number = 1
    else:
        try:
            number = float(quantity_str.split()[0])
        except (ValueError, IndexError):
            number = 1

    meals_saved = max(1, int(number * 2))
    co2_saved = round(number * 2.5, 2)

    return meals_saved, co2_saved


@api_view(["GET", "POST"])
def donation_list(request):
    user = request.user

    if request.method == "GET":
        if user.role == "admin":
            donations = Donation.objects.all()
        elif user.role == "donor":
            donations = Donation.objects.filter(owner=user)
        elif user.role == "ngo":
            donations = Donation.objects.all()
        elif user.role == "volunteer":
            donations = Donation.objects.filter(
                status__in=["Accepted", "Collected", "Delivered"]
            )
        else:
            donations = Donation.objects.none()

        donations = donations.order_by("-match_score", "-id")
        serializer = DonationSerializer(donations, many=True)
        return Response(serializer.data)

    if request.method == "POST":
        serializer = DonationSerializer(data=request.data)

        if serializer.is_valid():
            donation = serializer.save(owner=user)

            donation.match_score = calculate_match_score(
                donation.expiry,
                donation.quantity,
                donation.status
            )

            donation.points = calculate_points(donation.quantity)

            meals_saved, co2_saved = calculate_impact(donation.quantity)
            donation.meals_saved = meals_saved
            donation.co2_saved = co2_saved

            existing_total_points = sum(
                d.points for d in Donation.objects.filter(owner=user)
            )
            donor_total_points = existing_total_points + donation.points
            donation.badge = calculate_badge(donor_total_points)

            donation.save()

            Notification.objects.create(
                role="ngo",
                message=f"New donation posted: {donation.food} ({donation.quantity})"
            )

            return Response(
                DonationSerializer(donation).data,
                status=status.HTTP_201_CREATED
            )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["PATCH"])
def update_donation_status(request, donation_id):
    user = request.user

    try:
        donation = Donation.objects.get(id=donation_id)
    except Donation.DoesNotExist:
        return Response(
            {"error": "Donation not found"},
            status=status.HTTP_404_NOT_FOUND
        )

    if user.role == "donor" and donation.owner != user:
        return Response(
            {"error": "Forbidden"},
            status=status.HTTP_403_FORBIDDEN
        )

    new_status = request.data.get("status")
    if not new_status:
        return Response(
            {"error": "Status is required"},
            status=status.HTTP_400_BAD_REQUEST
        )

    donation.status = new_status
    donation.match_score = calculate_match_score(
        donation.expiry,
        donation.quantity,
        donation.status
    )
    donation.save()

    if new_status == "Accepted":
        Notification.objects.create(
            role="volunteer",
            message=f"Donation accepted and ready for pickup: {donation.food}"
        )
        Notification.objects.create(
            role="donor",
            message=f"Your donation was accepted by an NGO: {donation.food}"
        )

    elif new_status == "Collected":
        Notification.objects.create(
            role="donor",
            message=f"Your donation has been collected: {donation.food}"
        )

    elif new_status == "Delivered":
        Notification.objects.create(
            role="donor",
            message=f"Your donation has been delivered successfully: {donation.food}"
        )
        Notification.objects.create(
            role="ngo",
            message=f"Donation delivered successfully: {donation.food}"
        )

    serializer = DonationSerializer(donation)
    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(["GET"])
def notification_list(request):
    role = request.GET.get("role")

    if role:
        notifications = Notification.objects.filter(role=role).order_by("-created_at")
    else:
        notifications = Notification.objects.all().order_by("-created_at")

    serializer = NotificationSerializer(notifications, many=True)
    return Response(serializer.data)


@api_view(["PATCH"])
def mark_notification_read(request, notification_id):
    try:
        notification = Notification.objects.get(id=notification_id)
    except Notification.DoesNotExist:
        return Response(
            {"error": "Notification not found"},
            status=status.HTTP_404_NOT_FOUND
        )

    notification.is_read = True
    notification.save()

    serializer = NotificationSerializer(notification)
    return Response(serializer.data, status=status.HTTP_200_OK)