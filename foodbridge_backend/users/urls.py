# users/urls.py

from django.urls import path
from .views import CustomTokenView, RegisterView, send_otp, profile_view

urlpatterns = [
    path("token/", CustomTokenView.as_view(), name="token"),
    path("register/", RegisterView.as_view(), name="register"),
    path("send-otp/", send_otp, name="send_otp"),
    path("profile/", profile_view, name="profile"),
]