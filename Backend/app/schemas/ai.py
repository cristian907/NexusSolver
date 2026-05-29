"""AI analysis schemas."""

from typing import List, Optional
from pydantic import BaseModel, model_validator
from app.schemas.transport import ResultadoTransporteResponse


class AnalyzeRequest(BaseModel):
    """Request for AI analysis endpoint."""

    transport_result: Optional[ResultadoTransporteResponse] = None
    assignment_result: Optional[ResultadoTransporteResponse] = None
    transport_origin_names: Optional[List[str]] = None
    transport_destination_names: Optional[List[str]] = None
    assignment_origin_names: Optional[List[str]] = None
    assignment_destination_names: Optional[List[str]] = None

    @model_validator(mode="after")
    def check_at_least_one_result(self):
        if self.transport_result is None and self.assignment_result is None:
            raise ValueError("At least one result (transport or assignment) must be provided")
        return self


class AnalyzeResponse(BaseModel):
    """Response for AI analysis endpoint."""

    analysis: str
