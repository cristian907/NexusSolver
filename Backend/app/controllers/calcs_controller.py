"""Calculations controller for transport and assignment problems."""

from dataclasses import asdict
from app.schemas.transport import TransportProblemRequest, ResultadoTransporteResponse
from app.schemas.assignment import AssignmentProblemRequest
from app.schemas.combined import SolveRequest, SolveResponse
from app.services.transport_service import TransportService
from app.services.assignment_service import AssignmentService
from app.services.ai_service import AIService


def _convert_resultado_to_response(resultado) -> ResultadoTransporteResponse:
    """Convert ResultadoTransporte dataclass to Pydantic model."""
    return ResultadoTransporteResponse(**asdict(resultado))


class CalcsController:
    """Controller for transport and assignment calculations."""

    def __init__(
        self,
        transport_service: TransportService,
        assignment_service: AssignmentService,
        ai_service: AIService
    ) -> None:
        """Initialize with service instances.

        Args:
            transport_service: TransportService instance.
            assignment_service: AssignmentService instance.
            ai_service: AIService instance.
        """
        self.transport_service = transport_service
        self.assignment_service = assignment_service
        self.ai_service = ai_service

    def solve_transport_minimum_cost(self, request: TransportProblemRequest) -> ResultadoTransporteResponse:
        """Solve transport problem using minimum cost method."""
        resultado = self.transport_service.solve_minimum_cost(
            request.costs, request.supply, request.demand,
            origin_names=request.origin_names,
            destination_names=request.destination_names,
        )
        return _convert_resultado_to_response(resultado)

    def solve_transport_north_west(self, request: TransportProblemRequest) -> ResultadoTransporteResponse:
        """Solve transport problem using north-west corner method."""
        resultado = self.transport_service.solve_north_west(
            request.costs, request.supply, request.demand,
            origin_names=request.origin_names,
            destination_names=request.destination_names,
        )
        return _convert_resultado_to_response(resultado)

    def solve_transport_vogel(self, request: TransportProblemRequest) -> ResultadoTransporteResponse:
        """Solve transport problem using Vogel's approximation method (VAM)."""
        resultado = self.transport_service.solve_vogel(
            request.costs, request.supply, request.demand,
            origin_names=request.origin_names,
            destination_names=request.destination_names,
        )
        return _convert_resultado_to_response(resultado)

    def solve_assignment_hungarian_min(self, request: AssignmentProblemRequest) -> ResultadoTransporteResponse:
        """Solve assignment problem using Hungarian algorithm for minimization."""
        resultado = self.assignment_service.solve_hungarian_min(
            request.costs, request.supply, request.demand,
            origin_names=request.origin_names,
            destination_names=request.destination_names,
        )
        return _convert_resultado_to_response(resultado)

    def solve_assignment_hungarian_max(self, request: AssignmentProblemRequest) -> ResultadoTransporteResponse:
        """Solve assignment problem using Hungarian algorithm for maximization."""
        resultado = self.assignment_service.solve_hungarian_max(
            request.costs, request.supply, request.demand,
            origin_names=request.origin_names,
            destination_names=request.destination_names,
        )
        return _convert_resultado_to_response(resultado)

    def solve_combined(self, request: SolveRequest) -> SolveResponse:
        """Solve combined transport and/or assignment problems with specified methods."""
        results = self.ai_service.solve_combined(
            request.transport_problem,
            request.assignment_problem
        )

        response = SolveResponse()
        if "transport_result" in results:
            response.transport_result = _convert_resultado_to_response(results["transport_result"])
        if "assignment_result" in results:
            response.assignment_result = _convert_resultado_to_response(results["assignment_result"])

        return response
