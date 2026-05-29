"""AI analysis service."""

from typing import Optional, List
from app.services.transport_service import ResultadoTransporte, Matriz, Vector
from app.protocols.ai_provider import AIProvider
from app.schemas.transport import TransportProblemRequest
from app.schemas.assignment import AssignmentProblemRequest


class AIService:
    """Service for AI-powered analysis."""

    def __init__(self, ai_provider: AIProvider):
        """Initialize with an AI provider.

        Args:
            ai_provider: AI provider implementation.
        """
        self.ai_provider = ai_provider

    def _format_matriz(
        self,
        matriz: Matriz,
        enc_col: Optional[List[str]] = None,
        enc_fila: Optional[List[str]] = None,
    ) -> str:
        """Format a matrix as plain text table."""
        if not matriz:
            return "(vacía)"
        lineas: List[str] = []
        if enc_col:
            pre = "         " if enc_fila else ""
            lineas.append(pre + "  ".join(f"{h:>12}" for h in enc_col))
        for idx, fila in enumerate(matriz):
            pre = f"{enc_fila[idx]:>12} " if enc_fila else ""
            lineas.append(pre + "  ".join(f"{v:>12.1f}" for v in fila))
        return "\n".join(lineas)

    def _format_vector(self, vector: Vector, etiquetas: Optional[List[str]] = None) -> str:
        """Format a vector as readable string."""
        if etiquetas:
            return ", ".join(f"'{e}': {v}" for e, v in zip(etiquetas, vector))
        return ", ".join(str(v) for v in vector)

    def _build_prompt(
        self,
        transport_result: Optional[ResultadoTransporte],
        assignment_result: Optional[ResultadoTransporte],
        transport_origin_names: Optional[List[str]] = None,
        transport_destination_names: Optional[List[str]] = None,
        assignment_origin_names: Optional[List[str]] = None,
        assignment_destination_names: Optional[List[str]] = None,
    ) -> str:
        """Build user prompt from results."""
        sections = []

        if transport_result:
            m_o = len(transport_result.matriz_costos_original)
            n_o = len(transport_result.matriz_costos_original[0])
            m_b = len(transport_result.matriz_costos_balanceada)
            n_b = len(transport_result.matriz_costos_balanceada[0])

            or_o = [transport_origin_names[i] if transport_origin_names and i < len(transport_origin_names) else f"O{i+1}" for i in range(m_o)]
            de_o = [transport_destination_names[j] if transport_destination_names and j < len(transport_destination_names) else f"D{j+1}" for j in range(n_o)]

            or_b = list(or_o)
            if m_b > m_o:
                or_b.append("Origen Ficticio")

            de_b = list(de_o)
            if n_b > n_o:
                de_b.append("Destino Ficticio")

            sections.append("=== PROBLEMA DE TRANSPORTE ===")
            sections.append(f"Orígenes: {m_o} | Destinos: {n_o}")
            sections.append(f"Balanceo: {'Sí — ' + transport_result.tipo_balanceo if transport_result.fue_balanceada else 'No'}")
            sections.append("")
            sections.append("── Tabla de Costos Originales ──")
            sections.append(self._format_matriz(transport_result.matriz_costos_original, de_o, or_o))
            sections.append(f"Oferta original: {self._format_vector(transport_result.oferta_original, or_o)}")
            sections.append(f"Demanda original: {self._format_vector(transport_result.demanda_original, de_o)}")
            sections.append("")
            sections.append("── Matriz de Asignaciones (Solución) ──")
            sections.append(self._format_matriz(transport_result.asignaciones, de_b, or_b))
            sections.append(f"\nCosto Total Mínimo: {transport_result.costo_total:.2f}")
            sections.append("")

        if assignment_result:
            m_o = len(assignment_result.matriz_costos_original)
            n_o = len(assignment_result.matriz_costos_original[0])
            m_b = len(assignment_result.matriz_costos_balanceada)
            n_b = len(assignment_result.matriz_costos_balanceada[0])

            or_o = [assignment_origin_names[i] if assignment_origin_names and i < len(assignment_origin_names) else f"Agente{i+1}" for i in range(m_o)]
            de_o = [assignment_destination_names[j] if assignment_destination_names and j < len(assignment_destination_names) else f"Tarea{j+1}" for j in range(n_o)]

            or_b = list(or_o)
            if m_b > m_o:
                or_b.append("Agente Ficticio")

            de_b = list(de_o)
            if n_b > n_o:
                de_b.append("Tarea Ficticia")

            sections.append("=== PROBLEMA DE ASIGNACIÓN ===")
            sections.append(f"Agentes: {m_o} | Tareas: {n_o}")
            sections.append(f"Balanceo: {'Sí — ' + assignment_result.tipo_balanceo if assignment_result.fue_balanceada else 'No'}")
            sections.append("")
            sections.append("── Matriz de Costos/Beneficios Originales ──")
            sections.append(self._format_matriz(assignment_result.matriz_costos_original, de_o, or_o))
            sections.append("")
            sections.append("── Matriz de Asignaciones (Solución) ──")
            sections.append(self._format_matriz(assignment_result.asignaciones, de_b, or_b))
            sections.append(f"\nCosto/Beneficio Total: {assignment_result.costo_total:.2f}")
            sections.append("")

        return "\n".join(sections)

    def analyze_results(
        self,
        transport_result: Optional[ResultadoTransporte],
        assignment_result: Optional[ResultadoTransporte],
        transport_origin_names: Optional[List[str]] = None,
        transport_destination_names: Optional[List[str]] = None,
        assignment_origin_names: Optional[List[str]] = None,
        assignment_destination_names: Optional[List[str]] = None,
    ) -> str:
        """Generate AI analysis of optimization results.

        Args:
            transport_result: Optional transport problem result.
            assignment_result: Optional assignment problem result.
            transport_origin_names: Custom origin names for transport.
            transport_destination_names: Custom destination names for transport.
            assignment_origin_names: Custom origin/agent names for assignment.
            assignment_destination_names: Custom destination/task names for assignment.

        Returns:
            AI-generated analysis text.

        Raises:
            RuntimeError: If AI API call fails.
        """
        if transport_result is None and assignment_result is None:
            raise ValueError("At least one result must be provided")

        prompt = self._build_prompt(
            transport_result, assignment_result,
            transport_origin_names, transport_destination_names,
            assignment_origin_names, assignment_destination_names,
        )
        return self.ai_provider.generate_analysis(prompt)

    def solve_combined(
        self,
        transport_problem: Optional[TransportProblemRequest],
        assignment_problem: Optional[AssignmentProblemRequest],
    ) -> dict:
        """Solve combined transport and/or assignment problems.

        Args:
            transport_problem: Optional transport problem with method.
            assignment_problem: Optional assignment problem with method.

        Returns:
            Dictionary with transport_result and/or assignment_result.

        Raises:
            ValueError: If invalid method or inputs.
        """
        from app.services.transport_service import TransportService
        from app.services.assignment_service import AssignmentService

        transport_service = TransportService()
        assignment_service = AssignmentService()

        results = {}

        if transport_problem:
            method = transport_problem.method
            if not method:
                raise ValueError("Transport problem must specify a method")

            if method == "minimum-cost":
                results["transport_result"] = transport_service.solve_minimum_cost(
                    transport_problem.costs,
                    transport_problem.supply,
                    transport_problem.demand,
                    origin_names=transport_problem.origin_names,
                    destination_names=transport_problem.destination_names,
                )
            elif method == "north-west-corner":
                results["transport_result"] = transport_service.solve_north_west(
                    transport_problem.costs,
                    transport_problem.supply,
                    transport_problem.demand,
                    origin_names=transport_problem.origin_names,
                    destination_names=transport_problem.destination_names,
                )
            elif method == "vogel":
                results["transport_result"] = transport_service.solve_vogel(
                    transport_problem.costs,
                    transport_problem.supply,
                    transport_problem.demand,
                    origin_names=transport_problem.origin_names,
                    destination_names=transport_problem.destination_names,
                )
            else:
                raise ValueError(f"Invalid transport method: {method}")

        if assignment_problem:
            method = assignment_problem.method
            if not method:
                raise ValueError("Assignment problem must specify a method")

            if method == "hungarian-min":
                results["assignment_result"] = assignment_service.solve_hungarian_min(
                    assignment_problem.costs,
                    assignment_problem.supply,
                    assignment_problem.demand,
                    origin_names=assignment_problem.origin_names,
                    destination_names=assignment_problem.destination_names,
                )
            elif method == "hungarian-max":
                results["assignment_result"] = assignment_service.solve_hungarian_max(
                    assignment_problem.costs,
                    assignment_problem.supply,
                    assignment_problem.demand,
                    origin_names=assignment_problem.origin_names,
                    destination_names=assignment_problem.destination_names,
                )
            else:
                raise ValueError(f"Invalid assignment method: {method}")

        return results
