"""AI analysis controller."""

from app.schemas.ai import AnalyzeRequest, AnalyzeResponse
from app.services.ai_service import AIService
from app.services.transport_service import ResultadoTransporte


class AIController:
    """Controller for AI-powered analysis."""

    def __init__(self, ai_service: AIService):
        """Initialize with an AI service instance.

        Args:
            ai_service: AIService instance.
        """
        self.ai_service = ai_service

    def _convert_response_to_resultado(self, response) -> ResultadoTransporte:
        """Convert Pydantic response model to ResultadoTransporte dataclass."""
        return ResultadoTransporte(
            matriz_costos_original=response.matriz_costos_original,
            matriz_costos_balanceada=response.matriz_costos_balanceada,
            oferta_original=response.oferta_original,
            demanda_original=response.demanda_original,
            oferta_balanceada=response.oferta_balanceada,
            demanda_balanceada=response.demanda_balanceada,
            asignaciones=response.asignaciones,
            costo_total=response.costo_total,
            fue_balanceada=response.fue_balanceada,
            tipo_balanceo=response.tipo_balanceo,
            pasos=response.pasos
        )

    async def analyze_results(self, request: AnalyzeRequest) -> AnalyzeResponse:
        """Generate COO-style operational analysis of optimization results.

        Args:
            request: Contains optional transport_result and/or assignment_result.

        Returns:
            AI-generated analysis.
        """
        transport_result = None
        assignment_result = None

        if request.transport_result:
            transport_result = self._convert_response_to_resultado(request.transport_result)

        if request.assignment_result:
            assignment_result = self._convert_response_to_resultado(request.assignment_result)

        analysis = self.ai_service.analyze_results(
            transport_result, assignment_result,
            transport_origin_names=request.transport_origin_names,
            transport_destination_names=request.transport_destination_names,
            assignment_origin_names=request.assignment_origin_names,
            assignment_destination_names=request.assignment_destination_names,
        )
        return AnalyzeResponse(analysis=analysis)
