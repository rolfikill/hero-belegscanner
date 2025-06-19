import os
import base64
import json
import logging
from typing import Dict, Any, Optional
from anthropic import Anthropic
from PIL import Image
from io import BytesIO
import re

logger = logging.getLogger(__name__)

class ClaudeService:
    """Service for interacting with Claude Vision API"""
    
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or os.getenv("ANTHROPIC_API_KEY")
        if not self.api_key:
            raise ValueError("ANTHROPIC_API_KEY environment variable is required")
        
        self.client = Anthropic(api_key=self.api_key)
    
    def encode_image_to_base64(self, image_path: str) -> str:
        """
        Encode image file to base64 string
        
        Args:
            image_path: Path to the image file
            
        Returns:
            Base64 encoded image string
        """
        try:
            with open(image_path, "rb") as image_file:
                return base64.b64encode(image_file.read()).decode('utf-8')
        except Exception as e:
            logger.error(f"Error encoding image to base64: {e}")
            raise
    
    async def parse_document(self, image_path: str) -> Dict[str, Any]:
        """
        Parse document image using Claude Vision API
        
        Args:
            image_path: Path to the document image
            
        Returns:
            Parsed document data as dictionary
        """
        try:
            # Encode image to base64
            base64_image = self.encode_image_to_base64(image_path)
            
            # Structured prompt for better JSON extraction
            prompt = """Analysiere dieses Belegdokument und extrahiere die folgenden Informationen. 
            Antworte AUSSCHLIESSLICH mit einem gültigen JSON-Objekt in diesem Format:

            {
                "haendler": "Name des Händlers/Lieferanten",
                "datum": "DD.MM.YYYY",
                "rechnungsnummer": "Rechnungs-/Belegnummer",
                "dokumenttyp": "invoice/receipt/credit-note/delivery-note/other",
                "betrag": 0.00,
                "mwst_satz": 19
            }

            Wichtige Hinweise:
            - Verwende nur die genannten Feldnamen
            - Datum im Format DD.MM.YYYY
            - Betrag als Zahl ohne Währungssymbol
            - Dokumenttyp: "invoice" für Rechnungen, "receipt" für Kassenbons
            - Wenn ein Feld nicht erkennbar ist, verwende null oder einen leeren String
            - Antworte NUR mit dem JSON, ohne zusätzlichen Text"""
            
            # Call Claude Vision API
            message = self.client.messages.create(
                model="claude-3-5-sonnet-20241022",
                max_tokens=4000,
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "text",
                                "text": prompt
                            },
                            {
                                "type": "image",
                                "source": {
                                    "type": "base64",
                                    "media_type": "image/png",
                                    "data": base64_image
                                }
                            }
                        ]
                    }
                ]
            )
            
            # Extract and parse the response
            response_text = message.content[0].text.strip()
            
            # Try to extract JSON from the response
            json_match = re.search(r'\{.*\}', response_text, re.DOTALL)
            if json_match:
                json_text = json_match.group()
                try:
                    parsed_data = json.loads(json_text)
                    
                    # Add metadata
                    parsed_data["raw_response"] = response_text
                    parsed_data["processing_status"] = "success"
                    
                    logger.info("Document parsed successfully")
                    return parsed_data
                except json.JSONDecodeError as e:
                    logger.error(f"Failed to parse JSON response: {e}")
                    return {
                        "error": "Failed to parse Claude response",
                        "raw_response": response_text,
                        "processing_status": "error"
                    }
            else:
                return {
                    "error": "No valid JSON found in response",
                    "raw_response": response_text,
                    "processing_status": "error"
                }
                
        except Exception as e:
            logger.error(f"Error parsing document with Claude: {e}")
            return {
                "error": str(e),
                "processing_status": "error"
            }
    
    def validate_api_key(self) -> bool:
        """
        Validate the API key by making a simple test call
        
        Returns:
            True if valid, False otherwise
        """
        try:
            # Make a simple test call
            response = self.client.messages.create(
                model="claude-3-5-sonnet-20241022",
                max_tokens=10,
                messages=[{"role": "user", "content": "Hello"}]
            )
            return True
        except Exception as e:
            logger.error(f"API key validation failed: {e}")
            return False

def analyze_document(image_path):
    """
    Analyze a document image using Claude Vision API
    
    Args:
        image_path (str): Path to the image file
        
    Returns:
        dict: Analyzed document information
    """
    try:
        # Get API key
        api_key = os.getenv('ANTHROPIC_API_KEY')
        if not api_key:
            raise ValueError("ANTHROPIC_API_KEY nicht gefunden")
            
        # Initialize Claude client
        client = Anthropic(api_key=api_key)
        
        # Read and encode image
        with Image.open(image_path) as img:
            # Convert to RGB if necessary
            if img.mode != 'RGB':
                img = img.convert('RGB')
            
            # Save to buffer
            buffer = BytesIO()
            img.save(buffer, format="JPEG")
            image_bytes = buffer.getvalue()
            
        # Create base64 encoded image
        base64_image = base64.b64encode(image_bytes).decode('utf-8')
        
        # Structured prompt for better JSON extraction
        prompt = """Analysiere dieses Belegdokument und extrahiere die folgenden Informationen. 
        Antworte AUSSCHLIESSLICH mit einem gültigen JSON-Objekt in diesem Format:

        {
            "haendler": "Name des Händlers/Lieferanten",
            "datum": "DD.MM.YYYY",
            "rechnungsnummer": "Rechnungs-/Belegnummer",
            "dokumenttyp": "invoice/receipt/credit-note/delivery-note/other",
            "betrag": 0.00,
            "mwst_satz": 19
        }

        Wichtige Hinweise:
        - Verwende nur die genannten Feldnamen
        - Datum im Format DD.MM.YYYY
        - Betrag als Zahl ohne Währungssymbol
        - Dokumenttyp: "invoice" für Rechnungen, "receipt" für Kassenbons
        - Wenn ein Feld nicht erkennbar ist, verwende null oder einen leeren String
        - Antworte NUR mit dem JSON, ohne zusätzlichen Text"""
        
        # Create message with image
        message = client.messages.create(
            model="claude-3-5-sonnet-20241022",
            max_tokens=1000,
            messages=[{
                "role": "user",
                "content": [
                    {
                        "type": "image",
                        "source": {
                            "type": "base64",
                            "media_type": "image/jpeg",
                            "data": base64_image
                        }
                    },
                    {
                        "type": "text",
                        "text": prompt
                    }
                ]
            }]
        )
        
        # Extract and parse JSON response
        response_text = message.content[0].text.strip()
        
        # Try to extract JSON from response
        json_match = re.search(r'\{.*\}', response_text, re.DOTALL)
        if json_match:
            json_text = json_match.group()
            try:
                parsed_data = json.loads(json_text)
                return parsed_data
            except json.JSONDecodeError:
                # Fallback: return raw response
                return {"raw_response": response_text}
        else:
            return {"raw_response": response_text}
        
    except Exception as e:
        return {"error": str(e)} 