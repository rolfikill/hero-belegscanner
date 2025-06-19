import os
from pathlib import Path
from PIL import Image
import logging
import cv2
import numpy as np
from werkzeug.utils import secure_filename

logger = logging.getLogger(__name__)

class ImageService:
    """Service for image preprocessing and validation"""
    
    def __init__(self, max_size_mb: int = 4):
        self.max_size_bytes = max_size_mb * 1024 * 1024
    
    def validate_image(self, image_path: str) -> bool:
        """
        Validate image file format and size
        
        Args:
            image_path: Path to the image file
            
        Returns:
            True if valid, False otherwise
        """
        try:
            # Check file size
            file_size = os.path.getsize(image_path)
            if file_size > self.max_size_bytes:
                logger.warning(f"Image too large: {file_size} bytes")
                return False
            
            # Check if it's a valid image
            with Image.open(image_path) as img:
                img.verify()
            
            return True
            
        except Exception as e:
            logger.error(f"Image validation failed: {e}")
            return False
    
    def resize_image_if_needed(self, image_path: str, max_size_mb: int = 4) -> str:
        """
        Resize image if it's larger than the specified size
        
        Args:
            image_path: Path to the image file
            max_size_mb: Maximum size in MB
            
        Returns:
            Path to the processed image (original if no resize needed)
        """
        try:
            max_size_bytes = max_size_mb * 1024 * 1024
            file_size = os.path.getsize(image_path)
            
            if file_size <= max_size_bytes:
                return image_path
            
            # Open and resize image
            with Image.open(image_path) as img:
                # Calculate new dimensions while maintaining aspect ratio
                width, height = img.size
                
                # Start with 90% quality and reduce if needed
                quality = 90
                while quality > 10:
                    # Create a copy to test size
                    temp_path = f"{image_path}_temp.jpg"
                    img.save(temp_path, "JPEG", quality=quality, optimize=True)
                    
                    if os.path.getsize(temp_path) <= max_size_bytes:
                        # Replace original with resized version
                        os.replace(temp_path, image_path)
                        logger.info(f"Image resized successfully: {image_path}")
                        return image_path
                    
                    # Clean up temp file and try lower quality
                    os.remove(temp_path)
                    quality -= 10
                
                # If still too large, resize dimensions
                scale_factor = (max_size_bytes / file_size) ** 0.5
                new_width = int(width * scale_factor)
                new_height = int(height * scale_factor)
                
                resized_img = img.resize((new_width, new_height), Image.Resampling.LANCZOS)
                resized_img.save(image_path, "JPEG", quality=85, optimize=True)
                
                logger.info(f"Image resized to {new_width}x{new_height}: {image_path}")
                return image_path
                
        except Exception as e:
            logger.error(f"Error resizing image: {e}")
            return image_path
    
    def get_image_info(self, image_path: str) -> dict:
        """
        Get basic information about an image
        
        Args:
            image_path: Path to the image file
            
        Returns:
            Dictionary with image information
        """
        try:
            with Image.open(image_path) as img:
                return {
                    "width": img.width,
                    "height": img.height,
                    "format": img.format,
                    "mode": img.mode,
                    "size_bytes": os.path.getsize(image_path)
                }
        except Exception as e:
            logger.error(f"Error getting image info: {e}")
            return {}

def process_image(file):
    """
    Process the uploaded image file:
    1. Save the file
    2. Convert to grayscale
    3. Apply adaptive thresholding
    4. Save the processed image
    
    Returns:
        str: Path to the processed image
    """
    # Save original file
    filename = secure_filename(file.filename)
    original_path = os.path.join('uploads', 'original_' + filename)
    file.save(original_path)
    
    # Read the image
    image = cv2.imread(original_path)
    
    # Convert to grayscale
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    
    # Apply adaptive thresholding
    processed = cv2.adaptiveThreshold(
        gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 11, 2
    )
    
    # Save processed image
    processed_path = os.path.join('uploads', 'processed_' + filename)
    cv2.imwrite(processed_path, processed)
    
    # Clean up original file
    os.remove(original_path)
    
    return processed_path 