from django.urls import path
from .views import CustomTokenView, RegisterView

urlpatterns = [
    path("token/", CustomTokenView.as_view(), name="token"),
    path("register/", RegisterView.as_view(), name="register"),
]