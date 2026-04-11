from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView

from .serializers import CustomTokenSerializer, RegisterSerializer

import random
import string
 
from django.core.cache import cache
from django.core.mail import send_mail
from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView
 
from .serializers import CustomTokenSerializer, RegisterSerializer
 
User = get_user_model()
 
OTP_TTL = 600          # seconds (10 minutes)
OTP_CACHE_PREFIX = "foodbridge_otp:"
 
 
def _make_otp() -> str:
    return "".join(random.choices(string.digits, k=6))
 
 
def _cache_key(email: str) -> str:
    return f"{OTP_CACHE_PREFIX}{email.lower()}"
 
 
# ─────────────────────────────────────────────────────────────
# Auth views
# ─────────────────────────────────────────────────────────────
 
class CustomTokenView(TokenObtainPairView):
    serializer_class = CustomTokenSerializer
 
 
# ─────────────────────────────────────────────────────────────
# OTP: send
# ─────────────────────────────────────────────────────────────
 
@api_view(["POST"])
@permission_classes([AllowAny])
def send_otp(request):
    email = request.data.get("email", "").strip().lower()
 
    if not email:
        return Response({"email": "Email is required."}, status=status.HTTP_400_BAD_REQUEST)
 
    # Check email not already taken
    if User.objects.filter(email__iexact=email).exists():
        return Response(
            {"email": "This email address is already registered."},
            status=status.HTTP_409_CONFLICT,
        )
 
    otp = _make_otp()
    cache.set(_cache_key(email), otp, timeout=OTP_TTL)
 
    try:
        send_mail(
            subject="Your FoodBridge verification code",
            message=(
                f"Your one-time verification code is: {otp}\n\n"
                f"It expires in 10 minutes. Do not share it with anyone."
            ),
            from_email=None,          # uses DEFAULT_FROM_EMAIL from settings
            recipient_list=[email],
            fail_silently=False,
        )
    except Exception as exc:
        # Log but don't expose internals to the client
        print(f"[send_otp] Failed to send email to {email}: {exc}")
        return Response(
            {"detail": "Failed to send verification email. Please try again."},
            status=status.HTTP_503_SERVICE_UNAVAILABLE,
        )
 
    return Response({"message": "OTP sent to email."}, status=status.HTTP_200_OK)
 
 
# ─────────────────────────────────────────────────────────────
# Register (now validates OTP first)
# ─────────────────────────────────────────────────────────────
 
class RegisterView(APIView):
    permission_classes = [AllowAny]
 
    def post(self, request):
        otp_provided = request.data.get("otp", "").strip()
        email = request.data.get("email", "").strip().lower()
 
        if not otp_provided:
            return Response(
                {"otp": "Verification code is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )
 
        cached_otp = cache.get(_cache_key(email))
 
        if cached_otp is None:
            return Response(
                {"otp": "Verification code has expired. Please request a new one."},
                status=status.HTTP_400_BAD_REQUEST,
            )
 
        if cached_otp != otp_provided:
            return Response(
                {"otp": "Invalid verification code."},
                status=status.HTTP_400_BAD_REQUEST,
            )
 
        # OTP valid — create user
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            # Invalidate used OTP
            cache.delete(_cache_key(email))
            return Response(
                {"message": "User registered successfully"},
                status=status.HTTP_201_CREATED,
            )
 
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class CustomTokenView(TokenObtainPairView):
    serializer_class = CustomTokenSerializer


class RegisterView(APIView):
    def post(self, request):
        serializer = RegisterSerializer(data=request.data)

        if serializer.is_valid():
            serializer.save()
            return Response(
                {"message": "User registered successfully"},
                status=status.HTTP_201_CREATED,
            )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)