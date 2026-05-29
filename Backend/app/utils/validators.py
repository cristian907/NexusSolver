"""Custom validation utilities."""

from typing import List


def validate_rectangular_matrix(matrix: List[List[float]]) -> bool:
    """Check if a matrix is rectangular.

    Args:
        matrix: Matrix to validate.

    Returns:
        True if rectangular, False otherwise.
    """
    if not matrix:
        return False

    n_cols = len(matrix[0])
    return all(len(row) == n_cols for row in matrix)


def validate_non_negative_matrix(matrix: List[List[float]]) -> bool:
    """Check if all matrix values are non-negative.

    Args:
        matrix: Matrix to validate.

    Returns:
        True if all values are non-negative, False otherwise.
    """
    return all(val >= 0 for row in matrix for val in row)


def validate_non_negative_vector(vector: List[float]) -> bool:
    """Check if all vector values are non-negative.

    Args:
        vector: Vector to validate.

    Returns:
        True if all values are non-negative, False otherwise.
    """
    return all(val >= 0 for val in vector)
