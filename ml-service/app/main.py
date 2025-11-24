# File: app/main.py
"""
Purpose: FastAPI application entry point.
Configures middleware, logging, routes, and health endpoints.

Features:
- CORS middleware for browser clients
- Structured logging
- Health and metrics endpoints
- OpenAPI documentation
- Error handling middleware
"""

from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import structlog
import logging
import sys
from app.config import settings
from app.routes import smart_shelf, restock
from app.utils.caching import cache_manager

# Configure structured logging
def setup_logging():
    """Configure structlog for JSON logging in production."""
    logging.basicConfig(
        format="%(message)s",
        stream=sys.stdout,
        level=getattr(logging, settings.LOG_LEVEL)
    )
    
    if settings.LOG_FORMAT == "json":
        structlog.configure(
            processors=[
                structlog.stdlib.filter_by_level,
                structlog.stdlib.add_logger_name,
                structlog.stdlib.add_log_level,
                structlog.processors.TimeStamper(fmt="iso"),
                structlog.processors.StackInfoRenderer(),
                structlog.processors.format_exc_info,
                structlog.processors.JSONRenderer()
            ],
            wrapper_class=structlog.stdlib.BoundLogger,
            logger_factory=structlog.stdlib.LoggerFactory(),
            cache_logger_on_first_use=True,
        )
    else:
        structlog.configure(
            processors=[
                structlog.stdlib.filter_by_level,
                structlog.stdlib.add_logger_name,
                structlog.stdlib.add_log_level,
                structlog.processors.TimeStamper(fmt="iso"),
                structlog.dev.ConsoleRenderer()
            ],
            wrapper_class=structlog.stdlib.BoundLogger,
            logger_factory=structlog.stdlib.LoggerFactory(),
        )

setup_logging()
logger = structlog.get_logger()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events."""
    # Startup
    logger.info("application_starting", version=settings.APP_VERSION)
    
    # Check cache availability
    if cache_manager.is_available():
        logger.info("cache_available")
    else:
        logger.warning("cache_unavailable")
    
    yield
    
    # Shutdown
    logger.info("application_shutting_down")


# Create FastAPI app
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="SmartShelf ML Service: At-risk inventory, forecasting, and promotion planning",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Error handling middleware
@app.middleware("http")
async def error_handling_middleware(request: Request, call_next):
    """Log all requests and handle errors gracefully."""
    logger.info("request_received", method=request.method, path=request.url.path)
    
    try:
        response = await call_next(request)
        logger.info("request_completed", status_code=response.status_code)
        return response
    except Exception as e:
        logger.error("request_failed", error=str(e))
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"detail": "Internal server error"}
        )


# Health check endpoint
@app.get("/health")
async def health_check():
    """
    Health check endpoint for load balancers and monitoring.
    
    Returns:
        Status and component health
    """
    cache_healthy = cache_manager.is_available()
    
    return {
        "status": "healthy",
        "version": settings.APP_VERSION,
        "components": {
            "cache": "up" if cache_healthy else "down"
        }
    }


# Metrics endpoint (basic)
@app.get("/metrics")
async def metrics():
    """
    Basic metrics endpoint.
    
    For production, integrate Prometheus client for detailed metrics.
    """
    return {
        "service": settings.APP_NAME,
        "version": settings.APP_VERSION
    }


# Register routers
app.include_router(
    smart_shelf.router,
    prefix=settings.API_V1_PREFIX
)

app.include_router(
    restock.router,
    prefix=settings.API_V1_PREFIX
)


# Root endpoint
@app.get("/")
async def root():
    """Root endpoint with service information."""
    return {
        "service": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "docs": "/docs",
        "health": "/health"
    }
