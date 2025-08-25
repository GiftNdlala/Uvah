import random
import string
from datetime import datetime, timedelta
from django.utils import timezone
from django.core.cache import cache
from django.conf import settings
import logging

logger = logging.getLogger(__name__)

class OTPService:
    """
    Service for handling OTP (One-Time Password) operations
    """
    
    @staticmethod
    def generate_otp(length=6):
        """Generate a random OTP of specified length"""
        return ''.join(random.choices(string.digits, k=length))
    
    @staticmethod
    def send_otp(phone_number: str) -> dict:
        """
        Send OTP to phone number
        In production, integrate with SMS service like Twilio
        """
        try:
            # Generate 6-digit OTP
            otp = OTPService.generate_otp(6)
            
            # Set expiration time (10 minutes)
            expires_at = timezone.now() + timedelta(minutes=10)
            
            # Store OTP in cache with expiration
            cache_key = f"otp_{phone_number}"
            cache.set(cache_key, {
                'otp': otp,
                'expires_at': expires_at.isoformat(),
                'attempts': 0
            }, timeout=600)  # 10 minutes
            
            # TODO: Integrate with actual SMS service
            # For development, just log the OTP
            logger.info(f"OTP for {phone_number}: {otp}")
            
            return {
                'success': True,
                'message': 'OTP sent successfully',
                'expires_in_minutes': 10,
                'phone_number': phone_number
            }
            
        except Exception as e:
            logger.error(f"Error sending OTP to {phone_number}: {str(e)}")
            return {
                'success': False,
                'message': 'Failed to send OTP',
                'error': str(e)
            }
    
    @staticmethod
    def verify_otp(phone_number: str, otp: str) -> dict:
        """
        Verify OTP for phone number
        """
        try:
            cache_key = f"otp_{phone_number}"
            cached_data = cache.get(cache_key)
            
            if not cached_data:
                return {
                    'success': False,
                    'message': 'OTP expired or not found'
                }
            
            # Check if OTP has expired
            expires_at = datetime.fromisoformat(cached_data['expires_at'])
            if timezone.now() > expires_at:
                cache.delete(cache_key)
                return {
                    'success': False,
                    'message': 'OTP has expired'
                }
            
            # Check attempts limit (max 3 attempts)
            if cached_data['attempts'] >= 3:
                cache.delete(cache_key)
                return {
                    'success': False,
                    'message': 'Too many failed attempts. Please request a new OTP.'
                }
            
            # Verify OTP
            if cached_data['otp'] == otp:
                # OTP is valid, remove from cache
                cache.delete(cache_key)
                return {
                    'success': True,
                    'message': 'OTP verified successfully'
                }
            else:
                # Increment attempts
                cached_data['attempts'] += 1
                cache.set(cache_key, cached_data, timeout=600)
                
                return {
                    'success': False,
                    'message': f'Invalid OTP. {3 - cached_data["attempts"]} attempts remaining.'
                }
                
        except Exception as e:
            logger.error(f"Error verifying OTP for {phone_number}: {str(e)}")
            return {
                'success': False,
                'message': 'Error verifying OTP',
                'error': str(e)
            }
    
    @staticmethod
    def resend_otp(phone_number: str) -> dict:
        """
        Resend OTP to phone number
        """
        # Check if we can resend (rate limiting)
        rate_limit_key = f"otp_rate_limit_{phone_number}"
        if cache.get(rate_limit_key):
            return {
                'success': False,
                'message': 'Please wait before requesting another OTP'
            }
        
        # Set rate limit (1 minute)
        cache.set(rate_limit_key, True, timeout=60)
        
        return OTPService.send_otp(phone_number)
    
    @staticmethod
    def is_otp_valid(phone_number: str) -> bool:
        """
        Check if OTP is still valid for phone number
        """
        cache_key = f"otp_{phone_number}"
        cached_data = cache.get(cache_key)
        
        if not cached_data:
            return False
        
        expires_at = datetime.fromisoformat(cached_data['expires_at'])
        return timezone.now() <= expires_at

class PhoneVerificationService:
    """
    Service for handling phone number verification
    """
    
    @staticmethod
    def verify_phone_number(phone_number: str) -> bool:
        """
        Basic phone number format validation
        """
        import re
        # South African phone number pattern
        sa_pattern = r'^(\+27|27|0)?[6-8][0-9]{8}$'
        return bool(re.match(sa_pattern, phone_number))
    
    @staticmethod
    def format_phone_number(phone_number: str) -> str:
        """
        Format phone number to international format
        """
        # Remove all non-digit characters
        digits = ''.join(filter(str.isdigit, phone_number))
        
        # Handle South African numbers
        if digits.startswith('27'):
            return f"+{digits}"
        elif digits.startswith('0'):
            return f"+27{digits[1:]}"
        elif digits.startswith('6') or digits.startswith('7') or digits.startswith('8'):
            return f"+27{digits}"
        else:
            return phone_number  # Return as-is if can't determine format
