"""Basic test to verify the backend implementation without running the server."""

import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app.services.transport_service import TransportService
from app.services.assignment_service import AssignmentService

transport_service = TransportService()
assignment_service = AssignmentService()


def test_transport_vogel():
    """Test Vogel method."""
    print("Testing Vogel Method...")
    costs = [[4, 3, 8], [6, 5, 9]]
    supply = [100, 150]
    demand = [120, 80, 50]

    try:
        result = transport_service.solve_vogel(costs, supply, demand)
        print(f"✓ Vogel method solved successfully!")
        print(f"  Total cost: {result.costo_total}")
        print(f"  Balanced: {result.fue_balanceada}")
        return True
    except Exception as e:
        print(f"✗ Error: {e}")
        return False


def test_transport_minimum_cost():
    """Test Minimum Cost method."""
    print("\nTesting Minimum Cost Method...")
    costs = [[4, 3, 8], [6, 5, 9]]
    supply = [100, 150]
    demand = [120, 80, 50]

    try:
        result = transport_service.solve_minimum_cost(costs, supply, demand)
        print(f"✓ Minimum cost method solved successfully!")
        print(f"  Total cost: {result.costo_total}")
        print(f"  Balanced: {result.fue_balanceada}")
        return True
    except Exception as e:
        print(f"✗ Error: {e}")
        return False


def test_transport_north_west():
    """Test North-West Corner method."""
    print("\nTesting North-West Corner Method...")
    costs = [[4, 3, 8], [6, 5, 9]]
    supply = [100, 150]
    demand = [120, 80, 50]

    try:
        result = transport_service.solve_north_west(costs, supply, demand)
        print(f"✓ North-west corner method solved successfully!")
        print(f"  Total cost: {result.costo_total}")
        print(f"  Balanced: {result.fue_balanceada}")
        return True
    except Exception as e:
        print(f"✗ Error: {e}")
        return False


def test_assignment_hungarian_min():
    """Test Hungarian algorithm for minimization."""
    print("\nTesting Hungarian Algorithm (Minimization)...")
    costs = [[90, 76, 75, 70], [35, 85, 55, 65], [125, 95, 90, 105], [45, 110, 95, 115]]
    supply = [1, 1, 1, 1]
    demand = [1, 1, 1, 1]

    try:
        result = assignment_service.solve_hungarian_min(costs, supply, demand)
        print(f"✓ Hungarian (min) solved successfully!")
        print(f"  Total cost: {result.costo_total}")
        print(f"  Balanced: {result.fue_balanceada}")
        return True
    except Exception as e:
        print(f"✗ Error: {e}")
        return False


def test_assignment_hungarian_max():
    """Test Hungarian algorithm for maximization."""
    print("\nTesting Hungarian Algorithm (Maximization)...")
    costs = [[90, 76, 75, 70], [35, 85, 55, 65], [125, 95, 90, 105], [45, 110, 95, 115]]
    supply = [1, 1, 1, 1]
    demand = [1, 1, 1, 1]

    try:
        result = assignment_service.solve_hungarian_max(costs, supply, demand)
        print(f"✓ Hungarian (max) solved successfully!")
        print(f"  Total benefit: {result.costo_total}")
        print(f"  Balanced: {result.fue_balanceada}")
        return True
    except Exception as e:
        print(f"✗ Error: {e}")
        return False


def test_validation_errors():
    """Test input validation."""
    print("\nTesting Input Validation...")

    # Test negative costs
    try:
        transport_service.solve_vogel([[-1, 3], [6, 5]], [100, 150], [120, 130])
        print("✗ Should have raised ValueError for negative costs")
        return False
    except ValueError:
        print("✓ Correctly rejected negative costs")

    # Test dimension mismatch
    try:
        transport_service.solve_vogel([[4, 3, 8]], [100, 150], [120, 80, 50])
        print("✗ Should have raised ValueError for dimension mismatch")
        return False
    except ValueError:
        print("✓ Correctly rejected dimension mismatch")

    return True


if __name__ == "__main__":
    print("=" * 60)
    print("BACKEND IMPLEMENTATION TEST")
    print("=" * 60)

    tests = [
        test_transport_vogel,
        test_transport_minimum_cost,
        test_transport_north_west,
        test_assignment_hungarian_min,
        test_assignment_hungarian_max,
        test_validation_errors,
    ]

    results = []
    for test in tests:
        results.append(test())

    print("\n" + "=" * 60)
    print(f"RESULTS: {sum(results)}/{len(results)} tests passed")
    print("=" * 60)

    if all(results):
        print("\n✓ All tests passed! The backend implementation is working correctly.")
        print("\nTo run the API server, install dependencies and run:")
        print("  python3 -m pip install -r requirements.txt")
        print("  cd Backend")
        print("  python3 -m uvicorn app.main:app --reload")
    else:
        print("\n✗ Some tests failed. Please check the errors above.")
        sys.exit(1)
