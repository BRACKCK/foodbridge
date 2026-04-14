
import paypalrestsdk
from django.utils import timezone
from datetime import timedelta
from django.conf import settings
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.core.validators import ValidationError
from decimal import Decimal, InvalidOperation

from .models import MoneyDonation
from .serializers import MoneyDonationSerializer, NGOSerializer
from django.contrib.auth import get_user_model

User = get_user_model()


def get_paypal_client():
    """Configure PayPal SDK (consider migrating to new SDK)"""
    paypalrestsdk.configure({
        "mode": settings.PAYPAL_MODE,
        "client_id": settings.PAYPAL_CLIENT_ID,
        "client_secret": settings.PAYPAL_CLIENT_SECRET,
    })
    return paypalrestsdk


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def ngo_list(request):
    """Return all NGOs for dropdown"""
    # Only return active NGOs
    ngos = User.objects.filter(role="ngo", is_active=True)
    serializer = NGOSerializer(ngos, many=True)
    return Response(serializer.data)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def create_paypal_order(request):
    """
    Create PayPal order for money donation
    Body: { ngo_id, amount, currency, message }
    """
    user = request.user
    
    # Validate user is donor
    if user.role not in ['donor', 'admin']:
        return Response(
            {"error": "Only donors can make monetary donations"},
            status=status.HTTP_403_FORBIDDEN
        )
    
    ngo_id = request.data.get("ngo_id")
    amount_str = request.data.get("amount")
    currency = request.data.get("currency", "USD")
    message = request.data.get("message", "").strip()
    
    # Validate NGO
    try:
        ngo = User.objects.get(id=ngo_id, role="ngo", is_active=True)
    except User.DoesNotExist:
        return Response(
            {"error": "NGO not found or inactive."},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Validate amount
    try:
        amount = Decimal(str(amount_str))
        if amount < Decimal('1.00'):
            raise InvalidOperation
        if amount > Decimal('10000.00'):  # Max limit
            return Response(
                {"error": "Maximum donation amount is $10,000."},
                status=status.HTTP_400_BAD_REQUEST
            )
    except (InvalidOperation, TypeError, ValueError):
        return Response(
            {"error": "Invalid amount. Minimum $1.00, maximum $10,000.00."},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Validate message length
    if len(message) > 300:
        return Response(
            {"error": "Message cannot exceed 300 characters."},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    paypal = get_paypal_client()
    
    # Check for existing pending donation to prevent duplicates
    existing_pending = MoneyDonation.objects.filter(
        donor=user,
        payment_status='pending',
        created_at__gte=timezone.now() - timedelta(hours=1)
    ).exists()
    
    if existing_pending:
        return Response(
            {"error": "You have a pending donation. Complete or cancel it first."},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    payment = paypal.Payment({
        "intent": "sale",
        "payer": {"payment_method": "paypal"},
        "redirect_urls": {
            "return_url": f"{settings.FRONTEND_URL}/payment/success",
            "cancel_url": f"{settings.FRONTEND_URL}/payment/cancel",
        },
        "transactions": [{
            "item_list": {
                "items": [{
                    "name": f"Donation to {ngo.username}",
                    "sku": "money_donation",
                    "price": f"{amount:.2f}",
                    "currency": currency,
                    "quantity": 1,
                }]
            },
            "amount": {
                "total": f"{amount:.2f}",
                "currency": currency,
            },
            "description": message or f"Food donation to {ngo.username} via FoodBridge",
        }]
    })
    
    if payment.create():
        # Save pending record
        money_donation = MoneyDonation.objects.create(
            donor=user,
            ngo=ngo,
            amount=amount,
            currency=currency,
            payment_status="pending",
            paypal_order_id=payment.id,
            message=message,
        )
        
        # Extract approval URL
        approval_url = next(
            (link.href for link in payment.links if link.rel == "approval_url"),
            None
        )
        
        return Response({
            "paypal_order_id": payment.id,
            "approval_url": approval_url,
            "donation_id": money_donation.id,
        }, status=status.HTTP_201_CREATED)
    
    # Log error details
    print(f"PayPal error: {payment.error}")
    return Response(
        {"error": "Failed to create PayPal payment. Please try again."},
        status=status.HTTP_400_BAD_REQUEST
    )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def capture_paypal_payment(request):
    """
    Capture/execute PayPal payment after user approval
    Body: { paypal_order_id, payer_id }
    """
    paypal_order_id = request.data.get("paypal_order_id")
    payer_id = request.data.get("payer_id")
    
    if not paypal_order_id or not payer_id:
        return Response(
            {"error": "paypal_order_id and payer_id are required."},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        donation = MoneyDonation.objects.get(
            paypal_order_id=paypal_order_id,
            donor=request.user  # Ensure user owns this donation
        )
    except MoneyDonation.DoesNotExist:
        return Response(
            {"error": "Donation record not found or you don't have permission."},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Check if already completed
    if donation.payment_status == 'completed':
        return Response(
            {"error": "This donation has already been processed."},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    paypal = get_paypal_client()
    
    try:
        payment = paypal.Payment.find(paypal_order_id)
        
        if payment.execute({"payer_id": payer_id}):
            # Extract capture ID
            capture_id = None
            if (payment.transactions and 
                payment.transactions[0].related_resources and
                payment.transactions[0].related_resources[0].sale):
                capture_id = payment.transactions[0].related_resources[0].sale.id
            
            donation.payment_status = "completed"
            donation.paypal_capture_id = capture_id
            donation.save()
            
            # Create notifications
            from .models import Notification
            
            # Notify NGO
            Notification.objects.create(
                user=donation.ngo,
                notification_type='donation_received',
                title='💰 Money Donation Received!',
                message=(
                    f"You've received a donation of ${donation.amount} {donation.currency} "
                    f"from {donation.donor.username}!"
                ),
                related_object_id=donation.id,
                related_object_type='moneydonation'
            )
            
            # Notify donor
            Notification.objects.create(
                user=donation.donor,
                notification_type='donation_successful',
                title='✅ Donation Successful!',
                message=(
                    f"Your donation of ${donation.amount} {donation.currency} "
                    f"to {donation.ngo.username} was successful. Thank you!"
                ),
                related_object_id=donation.id,
                related_object_type='moneydonation'
            )
            
            serializer = MoneyDonationSerializer(donation)
            return Response(serializer.data, status=status.HTTP_200_OK)
        else:
            error_msg = payment.error.get('message', 'Unknown error') if payment.error else 'Payment execution failed'
            raise Exception(error_msg)
            
    except Exception as e:
        donation.payment_status = "failed"
        donation.save()
        
        return Response(
            {"error": f"Payment capture failed: {str(e)}"},
            status=status.HTTP_400_BAD_REQUEST
        )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def my_money_donations(request):
    """Get donor's money donation history"""
    donations = MoneyDonation.objects.filter(
        donor=request.user
    ).select_related('ngo').order_by("-created_at")
    
    serializer = MoneyDonationSerializer(donations, many=True)
    return Response(serializer.data)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def all_money_donations(request):
    """Admin: Get all money donations"""
    if request.user.role != "admin":
        return Response(
            {"error": "Forbidden. Admin access required."},
            status=status.HTTP_403_FORBIDDEN
        )
    
    donations = MoneyDonation.objects.all().select_related(
        'donor', 'ngo'
    ).order_by("-created_at")
    
    serializer = MoneyDonationSerializer(donations, many=True)
    return Response(serializer.data)