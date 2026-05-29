"""Pydantic schemas for request/response validation."""

from app.schemas.transport import TransportProblemRequest, ResultadoTransporteResponse
from app.schemas.assignment import AssignmentProblemRequest
from app.schemas.combined import SolveRequest, SolveResponse
from app.schemas.ai import AnalyzeRequest, AnalyzeResponse

__all__ = [
    "TransportProblemRequest",
    "AssignmentProblemRequest",
    "ResultadoTransporteResponse",
    "SolveRequest",
    "SolveResponse",
    "AnalyzeRequest",
    "AnalyzeResponse",
]
