"""AI router configuration."""

from fastapi import APIRouter, HTTPException
from app.schemas.ai import AnalyzeRequest, AnalyzeResponse
from app.services.ai_service import AIService
from app.controllers.ai_controller import AIController


def create_ai_router(ai_service: AIService) -> APIRouter:
    """Create and return the AI router.

    Args:
        ai_service: An instance of AIService.

    Returns:
        APIRouter: The FastAPI router for AI endpoints.
    """
    router = APIRouter(prefix="/api/ai", tags=["ai"])
    controller = AIController(ai_service)

    @router.post("/analyze", response_model=AnalyzeResponse)
    async def analyze_results(request: AnalyzeRequest):
        """Generate COO-style operational analysis of optimization results."""
        try:
            return await controller.analyze_results(request)
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e))
        except RuntimeError as e:
            raise HTTPException(status_code=500, detail=f"AI service error: {str(e)}")
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Internal error: {str(e)}")

    return router
