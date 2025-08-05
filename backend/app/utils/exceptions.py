"""Custom exceptions for Virtual Try-On API"""


class VirtualTryOnException(Exception):
    """Base exception for Virtual Try-On API"""
    pass


class ImageProcessingException(VirtualTryOnException):
    """Exception raised during image processing"""
    pass


class ModelException(VirtualTryOnException):
    """Exception raised during AI model operations"""
    pass


class AuthenticationException(VirtualTryOnException):
    """Exception raised during authentication"""
    pass


class ValidationException(VirtualTryOnException):
    """Exception raised during data validation"""
    pass


class RateLimitException(VirtualTryOnException):
    """Exception raised when rate limit is exceeded"""
    pass


class StorageException(VirtualTryOnException):
    """Exception raised during file storage operations"""
    pass