from fastapi import FastAPI, APIRouter
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path

# Import route modules
from .routes import children, game

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ.get('DB_NAME', 'betukkereso')]

# Create the main app without a prefix
app = FastAPI(title="Betűkereső API", version="1.0.0")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Original hello world endpoint
@api_router.get("/")
async def root():
    return {"message": "Betűkereső API is running"}

# Include route modules
api_router.include_router(children.router)
api_router.include_router(game.router)

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("startup")
async def startup_db_client():
    logger.info("Starting up Betűkereső API...")
    # Test database connection
    try:
        await db.command("ping")
        logger.info("Database connection successful")
    except Exception as e:
        logger.error(f"Database connection failed: {e}")

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
    logger.info("Database connection closed")