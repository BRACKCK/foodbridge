from django.urls import path
from .views import (
    donation_list,
    update_donation_status,
    notification_list,
    mark_notification_read,
)

urlpatterns = [
    path("", donation_list, name="donation_list"),
    path("<int:donation_id>/status/", update_donation_status, name="update_donation_status"),
    path("notifications/", notification_list, name="notification_list"),
    path("notifications/<int:notification_id>/read/", mark_notification_read, name="mark_notification_read"),
]