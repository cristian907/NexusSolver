"""Assignment problem schemas."""

from typing import List, Literal, Optional
from pydantic import BaseModel, Field, field_validator


class AssignmentProblemRequest(BaseModel):
    """Request model for assignment problems."""

    costs: List[List[float]] = Field(
        ...,
        description="Cost/benefit matrix (m x n)",
        examples=[[[90, 76, 75, 70], [35, 85, 55, 65], [125, 95, 90, 105], [45, 110, 95, 115]]]
    )
    supply: List[float] = Field(
        ...,
        description="Supply vector (typically all 1s for assignment problems)",
        examples=[[1, 1, 1, 1]]
    )
    demand: List[float] = Field(
        ...,
        description="Demand vector (typically all 1s for assignment problems)",
        examples=[[1, 1, 1, 1]]
    )
    method: Optional[Literal["hungarian-min", "hungarian-max"]] = Field(
        None,
        description="Solving method (used only in /solve endpoint)"
    )
    origin_names: Optional[List[str]] = Field(
        None,
        description="Custom names for agents/origins (length m). Falls back to 'Origen 1', etc."
    )
    destination_names: Optional[List[str]] = Field(
        None,
        description="Custom names for tasks/destinations (length n). Falls back to 'Destino 1', etc."
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
