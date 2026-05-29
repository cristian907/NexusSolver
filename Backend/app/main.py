"""FastAPI main application."""

import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.services.transport_service import TransportService
from app.services.assignment_service import AssignmentService
from app.services.ai_service import AIService
from app.implementations.groq_provider import GroqProvider
from app.routes import create_calcs_router, create_ai_router

# Load environment variables
try:
    from dotenv import load_dotenv, find_dotenv
    load_dotenv(find_dotenv(), override=True)
except ImportError:
    pass

# Instantiate services
transport_service = TransportService()
assignment_service = AssignmentService()
ai_provider = GroqProvider()
ai_service = AIService(ai_provider)

# Create routers
calcs_router = create_calcs_router(transport_service, assignment_service, ai_service)
ai_router = create_ai_router(ai_service)

app = FastAPI(
    title="Transport & Assignment Problem Solver API",
    description=(
        "RESTful API for solving transport and assignment optimization problems using:\n"
        "- Transport methods: Minimum Cost, North-West Corner, Vogel (VAM)\n"
        "- Assignment method: Hungarian Algorithm (min/max)\n"
        "- AI-powered operational analysis via Groq"
    ),
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS configuration
cors_origins = os.getenv(
    "CORS_ORIGINS",
    "http://localhost:3000,http://localhost:5173,http://127.0.0.1:3000,http://127.0.0.1:5173"
)
origins = [origin.strip() for origin in cors_origins.split(",")]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=r"https?://(localhost|127\.0\.0\.1)(:\d+)?",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Exception handlers
@app.exception_handler(ValueError)
async def value_error_handler(request, exc: ValueError):
    """Handle ValueError as 400 Bad Request."""
    return JSONResponse(
        status_code=400,
        content={"detail": str(exc)}
    )


@app.exception_handler(RuntimeError)
async def runtime_error_handler(request, exc: RuntimeError):
    """Handle RuntimeError as 500 Internal Server Error."""
    return JSONResponse(
        status_code=500,
        content={"detail": f"Internal error: {str(exc)}"}
    )


# Include routers
app.include_router(calcs_router)
app.include_router(ai_router)


@app.get("/", tags=["root"])
async def root():
    """Root endpoint with API information."""
    return {
        "message": "Transport & Assignment Problem Solver API",
        "version": "1.0.0",
        "docs": "/docs",
        "endpoints": {
            "transport": [
                "/api/calcs/transport/minimum-cost",
                "/api/calcs/transport/north-west-corner",
                "/api/calcs/transport/vogel"
            ],
            "assignment": [
                "/api/calcs/assignment/hungarian/min",
                "/api/calcs/assignment/hungarian/max"
            ],
            "combined": [
                "/api/calcs/solve"
            ],
            "ai": [
                "/api/ai/analyze"
            ]
        }
    }


@app.get("/health", tags=["health"])
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
