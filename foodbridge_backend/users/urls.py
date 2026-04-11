import django
from django.urls import path
from .views import CustomTokenView, RegisterView
from .views import CustomTokenView, RegisterView, send_otp

urlpatterns = [
    path("token/", CustomTokenView.as_view(), name="token"),
    path("register/", RegisterView.as_view(), name="register"),
    path("send-otp/", send_otp, name="send_otp"),
]