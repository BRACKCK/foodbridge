# donations/urls.py

from django.urls import path
from .views import (
    donation_list,
    update_donation_status,
    notification_list,
    mark_notification_read,
    delete_notification,
    delete_all_notifications,
)
from .paypal_views import (
    ngo_list,
    create_paypal_order,
    capture_paypal_payment,
    my_money_donations,
    all_money_donations,
)

urlpatterns = [
    # Food donations
    path("", donation_list, name="donation_list"),
    path("<int:donation_id>/status/", update_donation_status, name="update_donation_status"),

    # Notifications
    path("notifications/", notification_list, name="notification_list"),
    path("notifications/delete-all/", delete_all_notifications, name="delete_all_notifications"),
    path("notifications/<int:notification_id>/read/", mark_notification_read, name="mark_notification_read"),
    path("notifications/<int:notification_id>/delete/", delete_notification, name="delete_notification"),

    # Money donations
    path("ngos/", ngo_list, name="ngo_list"),
    path("money/create/", create_paypal_order, name="create_paypal_order"),
    path("money/capture/", capture_paypal_payment, name="capture_paypal_payment"),
    path("money/mine/", my_money_donations, name="my_money_donations"),
    path("money/all/", all_money_donations, name="all_money_donations"),
]