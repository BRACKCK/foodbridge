# paypal_client.py
from django.conf import settings
from paypalserversdk.configuration import Environment
from paypalserversdk.http.auth.o_auth_2 import ClientCredentialsAuthCredentials
from paypalserversdk.paypal_serversdk_client import PaypalServersdkClient

def get_paypal_client():
    """Initialize PayPal client with credentials"""
    client = PayPalClient(
        client_credentials_auth=ClientCredentialsAuth(
            o_auth_client_id=settings.PAYPAL_CLIENT_ID,
            o_auth_client_secret=settings.PAYPAL_CLIENT_SECRET,
        ),
        environment="sandbox" if settings.PAYPAL_MODE == "sandbox" else "live",
    )
    return client

def create_paypal_order(amount, currency, ngo_username, message):
    """Create a PayPal order"""
    client = get_paypal_client()
    orders_controller = OrdersController(client)
    
    request_body = {
        "intent": "CAPTURE",
        "purchase_units": [
            {
                "amount": {
                    "currency_code": currency,
                    "value": str(amount),
                },
                "description": message or f"Donation to {ngo_username} via FoodBridge",
                "soft_descriptor": f"FoodBridge-{ngo_username[:10]}",
            }
        ],
        "application_context": {
            "brand_name": "FoodBridge",
            "landing_page": "BILLING",
            "user_action": "PAY_NOW",
            "return_url": f"{settings.FRONTEND_URL}/payment/success",
            "cancel_url": f"{settings.FRONTEND_URL}/payment/cancel",
        }
    }
    
    response = orders_controller.orders_create(request_body)
    return response

def capture_paypal_order(order_id):
    """Capture an approved PayPal order"""
    client = get_paypal_client()
    orders_controller = OrdersController(client)
    
    response = orders_controller.orders_capture(order_id)
    return response