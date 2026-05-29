"""Transport problem schemas."""

from typing import List, Literal, Optional
from pydantic import BaseModel, Field, field_validator


class TransportProblemRequest(BaseModel):
    """Request model for transport problems."""

    costs: List[List[float]] = Field(
        ...,
        description="Cost matrix (m x n)",
        examples=[[[4, 3, 8], [6, 5, 9], [7, 6, 4]]]
    )
    supply: List[float] = Field(
        ...,
        description="Supply vector (length m)",
        examples=[[100, 150, 200]]
    )
    demand: List[float] = Field(
        ...,
        description="Demand vector (length n)",
        examples=[[120, 180, 150]]
    )
    method: Optional[Literal["minimum-cost", "north-west-corner", "vogel"]] = Field(
        None,
        description="Solving method (used only in /solve endpoint)"
    )
    origin_names: Optional[List[str]] = Field(
        None,
        description="Custom names for origins (length m). Falls back to 'Origen 1', 'Origen 2', etc."
    )
    destination_names: Optional[List[str]] = Field(
        None,
        description="Custom names for destinations (length n). Falls back to 'Destino 1', 'Destino 2', etc."
    )

    @field_validator("costs")
    @classmethod
    def validate_costs(cls, v: List[List[float]]) -> List[List[float]]:
        if not v:
            raise ValueError("Cost matrix cannot be empty")

        if not all(v):
            raise ValueError("Cost matrix cannot contain empty rows")

        # Check rectangular
        n_cols = len(v[0])
        if not all(len(row) == n_cols for row in v):
            raise ValueError("Cost matrix must be rectangular")

        # Check non-negative
        for i, row in enumerate(v):
            for j, cost in enumerate(row):
                if cost < 0:
                    raise ValueError(f"Cost at ({i}, {j}) is negative: {cost}")

        return v

    @field_validator("supply", "demand")
    @classmethod
    def validate_non_negative_vector(cls, v: List[float]) -> List[float]:
        if not v:
            raise ValueError("Vector cannot be empty")

        for i, val in enumerate(v):
            if val < 0:
                raise ValueError(f"Value at index {i} is negative: {val}")

        return v

    def model_post_init(self, __context) -> None:
        """Validate dimensions after all fields are set."""
        if len(self.costs) != len(self.supply):
            raise ValueError(
                f"Cost matrix has {len(self.costs)} rows but supply vector has {len(self.supply)} elements"
            )

        if len(self.costs[0]) != len(self.demand):
            raise ValueError(
                f"Cost matrix has {len(self.costs[0])} columns but demand vector has {len(self.demand)} elements"
            )


class ResultadoTransporteResponse(BaseModel):
    """Response model mirroring ResultadoTransporte from app.services.transport_service."""

    matriz_costos_original: List[List[float]]
    matriz_costos_balanceada: List[List[float]]
    oferta_original: List[float]
    demanda_original: List[float]
    oferta_balanceada: List[float]
    demanda_balanceada: List[float]
    asignaciones: List[List[float]]
    costo_total: float
    fue_balanceada: bool
    tipo_balanceo: str
    pasos: List[str]

    class Config:
        json_schema_extra = {
            "example": {
                "matriz_costos_original": [[4, 3, 8], [6, 5, 9]],
                "matriz_costos_balanceada": [[4, 3, 8], [6, 5, 9]],
                "oferta_original": [100, 150],
                "demanda_original": [120, 80, 50],
                "oferta_balanceada": [100, 150],
                "demanda_balanceada": [120, 80, 50],
                "asignaciones": [[100, 0, 0], [20, 80, 50]],
                "costo_total": 1190.0,
                "fue_balanceada": False,
                "tipo_balanceo": "Ninguno (ya balanceada)",
                "pasos": ["Paso 1...", "Paso 2..."]
            }
        }
