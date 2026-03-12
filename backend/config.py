import os
from dotenv import load_dotenv

# Load .env before any other module reads os.getenv
load_dotenv()

ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
FRONTEND_URL: str = os.getenv("FRONTEND_URL", "http://localhost:3000")

ALPHA: float = float(os.getenv("ALPHA", "0.05"))
POWER: float = float(os.getenv("POWER", "0.80"))
MDE: float = float(os.getenv("MDE", "0.10"))
BASELINE_CONVERSION: float = float(os.getenv("BASELINE_CONVERSION", "0.50"))
