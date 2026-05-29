"""Calculations router configuration."""

from fastapi import APIRouter, HTTPException
from app.schemas.transport import TransportProblemRequest, ResultadoTransporteResponse
from app.schemas.assignment import AssignmentProblemRequest
from app.schemas.combined import SolveRequest, SolveResponse
from app.services.transport_service import TransportService
from app.services.assignment_service import AssignmentService
from app.services.ai_service import AIService
from app.controllers.calcs_controller import CalcsController


def create_calcs_router(
    transport_service: TransportService,
    assignment_service: AssignmentService,
    ai_service: AIService
) -> APIRouter:
    """Create and return the calculations router.

    Args:
        transport_service: An instance of TransportService.
        assignment_service: An instance of AssignmentService.
        ai_service: An instance of AIService.

    Returns:
        APIRouter: The FastAPI router for calculations.
    """
    router = APIRouter(prefix="/api/calcs", tags=["calculations"])
    controller = CalcsController(transport_service, assignment_service, ai_service)

    @router.post("/transport/minimum-cost", response_model=ResultadoTransporteResponse)
    async def solve_transport_minimum_cost(request: TransportProblemRequest):
        """Solve transport problem using minimum cost method."""
        try:
            return controller.solve_transport_minimum_cost(request)
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e))
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Internal error: {str(e)}")

    @router.post("/transport/north-west-corner", response_model=ResultadoTransporteResponse)
    async def solve_transport_north_west(request: TransportProblemRequest):
        """Solve transport problem using north-west corner method."""
        try:
            return controller.solve_transport_north_west(request)
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e))
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Internal error: {str(e)}")

    @router.post("/transport/vogel", response_model=ResultadoTransporteResponse)
    async def solve_transport_vogel(request: TransportProblemRequest):
        """Solve transport problem using Vogel's approximation method (VAM)."""
        try:
            return controller.solve_transport_vogel(request)
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e))
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Internal error: {str(e)}")

    @router.post("/assignment/hungarian/min", response_model=ResultadoTransporteResponse)
    async def solve_assignment_hungarian_min(request: AssignmentProblemRequest):
        """Solve assignment problem using Hungarian algorithm for minimization."""
        try:
            return controller.solve_assignment_hungarian_min(request)
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e))
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Internal error: {str(e)}")

    @router.post("/assignment/hungarian/max", response_model=ResultadoTransporteResponse)
    async def solve_assignment_hungarian_max(request: AssignmentProblemRequest):
        """Solve assignment problem using Hungarian algorithm for maximization."""
        try:
            return controller.solve_assignment_hungarian_max(request)
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e))
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Internal error: {str(e)}")

    @router.post("/solve", response_model=SolveResponse)
    async def solve_combined(request: SolveRequest):
        """Solve combined transport and/or assignment problems."""
        try:
            return controller.solve_combined(request)
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e))
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Internal error: {str(e)}")

    return router
