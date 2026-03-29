from django.urls import path
from .views import donation_list

urlpatterns = [
    path('donations/', donation_list),
]