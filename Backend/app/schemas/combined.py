"""Combined solver schemas."""

from typing import Optional
from pydantic import BaseModel, model_validator
from app.schemas.transport import TransportProblemRequest, ResultadoTransporteResponse
from app.schemas.assignment import AssignmentProblemRequest


class SolveRequest(BaseModel):
    """Request for combined solver endpoint."""

    transport_problem: Optional[TransportProblemRequest] = None
    assignment_problem: Optional[AssignmentProblemRequest] = None

    @model_validator(mode="after")
    def check_at_least_one_problem(self):
        if self.transport_problem is None and self.assignment_problem is None:
            raise ValueError("At least one problem (transport or assignment) must be provided")
        return self


class SolveResponse(BaseModel):
    """Response for combined solver endpoint."""

    transport_result: Optional[ResultadoTransporteResponse] = None
    assignment_result: Optional[ResultadoTransporteResponse] = None
