import stripe
import os
from dotenv import load_dotenv

load_dotenv()

# Initialize Stripe
stripe.api_key = os.getenv("STRIPE_SECRET_KEY")

class PaymentService:
    def __init__(self):
        self.stripe_public_key = os.getenv("STRIPE_PUBLIC_KEY")
    
    def create_payment_intent(self, amount: float, currency: str = "usd", user_id: int = None):
        """Create a Stripe payment intent"""
        try:
            # Convert amount to cents (Stripe uses cents)
            amount_cents = int(amount * 100)
            
            payment_intent = stripe.PaymentIntent.create(
                amount=amount_cents,
                currency=currency,
                metadata={
                    "user_id": str(user_id) if user_id else "",
                    "service": "silence_removal"
                }
            )
            
            return {
                "id": payment_intent.id,
                "client_secret": payment_intent.client_secret,
                "amount": amount,
                "currency": currency
            }
            
        except stripe.error.StripeError as e:
            raise Exception(f"Payment creation failed: {str(e)}")
    
    def confirm_payment(self, payment_intent_id: str):
        """Confirm a payment intent"""
        try:
            payment_intent = stripe.PaymentIntent.retrieve(payment_intent_id)
            return payment_intent.status == "succeeded"
        except stripe.error.StripeError as e:
            raise Exception(f"Payment confirmation failed: {str(e)}")
    
    def get_payment_status(self, payment_intent_id: str):
        """Get payment status"""
        try:
            payment_intent = stripe.PaymentIntent.retrieve(payment_intent_id)
            return payment_intent.status
        except stripe.error.StripeError as e:
            raise Exception(f"Failed to get payment status: {str(e)}")
    
    def calculate_price(self, video_duration: float, use_whisper: bool = False) -> float:
        """Calculate price based on video duration and processing method"""
        if use_whisper:
            # Premium pricing: $0.006 per minute
            return round(video_duration / 60 * 0.006, 2)
        else:
            # Free for videos under 1 minute
            return 0.0 if video_duration <= 60 else None
