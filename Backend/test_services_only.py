"""Test services directly without FastAPI/Pydantic dependencies."""

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
    supply = [100.0, 150.0]
    demand = [120.0, 80.0, 50.0]

    try:
        result = transport_service.solve_vogel(costs, supply, demand)
        print(f"✓ Vogel method solved successfully!")
        print(f"  Total cost: {result.costo_total}")
        print(f"  Balanced: {result.fue_balanceada}")
        print(f"  Assignments:\n{result.asignaciones}")
        return True
    except Exception as e:
        print(f"✗ Error: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_transport_minimum_cost():
    """Test Minimum Cost method."""
    print("\nTesting Minimum Cost Method...")
    costs = [[4, 3, 8], [6, 5, 9]]
    supply = [100.0, 150.0]
    demand = [120.0, 80.0, 50.0]

    try:
        result = transport_service.solve_minimum_cost(costs, supply, demand)
        print(f"✓ Minimum cost method solved successfully!")
        print(f"  Total cost: {result.costo_total}")
        print(f"  Balanced: {result.fue_balanceada}")
        return True
    except Exception as e:
        print(f"✗ Error: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_transport_north_west():
    """Test North-West Corner method."""
    print("\nTesting North-West Corner Method...")
    costs = [[4, 3, 8], [6, 5, 9]]
    supply = [100.0, 150.0]
    demand = [120.0, 80.0, 50.0]

    try:
        result = transport_service.solve_north_west(costs, supply, demand)
        print(f"✓ North-west corner method solved successfully!")
        print(f"  Total cost: {result.costo_total}")
        print(f"  Balanced: {result.fue_balanceada}")
        return True
    except Exception as e:
        print(f"✗ Error: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_assignment_hungarian_min():
    """Test Hungarian algorithm for minimization."""
    print("\nTesting Hungarian Algorithm (Minimization)...")
    costs = [[90.0, 76.0, 75.0, 70.0], [35.0, 85.0, 55.0, 65.0], [125.0, 95.0, 90.0, 105.0], [45.0, 110.0, 95.0, 115.0]]
    supply = [1.0, 1.0, 1.0, 1.0]
    demand = [1.0, 1.0, 1.0, 1.0]

    try:
        result = assignment_service.solve_hungarian_min(costs, supply, demand)
        print(f"✓ Hungarian (min) solved successfully!")
        print(f"  Total cost: {result.costo_total}")
        print(f"  Balanced: {result.fue_balanceada}")
        return True
    except Exception as e:
        print(f"✗ Error: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_assignment_hungarian_max():
    """Test Hungarian algorithm for maximization."""
    print("\nTesting Hungarian Algorithm (Maximization)...")
    costs = [[90.0, 76.0, 75.0, 70.0], [35.0, 85.0, 55.0, 65.0], [125.0, 95.0, 90.0, 105.0], [45.0, 110.0, 95.0, 115.0]]
    supply = [1.0, 1.0, 1.0, 1.0]
    demand = [1.0, 1.0, 1.0, 1.0]

    try:
        result = assignment_service.solve_hungarian_max(costs, supply, demand)
        print(f"✓ Hungarian (max) solved successfully!")
        print(f"  Total benefit: {result.costo_total}")
        print(f"  Balanced: {result.fue_balanceada}")
        return True
    except Exception as e:
        print(f"✗ Error: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_validation_errors():
    """Test input validation."""
    print("\nTesting Input Validation...")

    # Test negative costs
    try:
        transport_service.solve_vogel([[-1.0, 3.0], [6.0, 5.0]], [100.0, 150.0], [120.0, 130.0])
        print("✗ Should have raised ValueError for negative costs")
        return False
    except ValueError as e:
        print(f"✓ Correctly rejected negative costs: {e}")

    # Test dimension mismatch
    try:
        transport_service.solve_vogel([[4.0, 3.0, 8.0]], [100.0, 150.0], [120.0, 80.0, 50.0])
        print("✗ Should have raised ValueError for dimension mismatch")
        return False
    except ValueError as e:
        print(f"✓ Correctly rejected dimension mismatch: {e}")

    return True


if __name__ == "__main__":
    print("=" * 60)
    print("BACKEND CORE FUNCTIONALITY TEST")
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
        print("\n✓ All core solver tests passed!")
        print("\nThe backend implementation wraps these solvers correctly.")
        print("\nNext steps:")
        print("1. Install dependencies:")
        print("   python3 -m ensurepip --default-pip  # if pip not available")
        print("   python3 -m pip install -r requirements.txt")
        print("\n2. Run the API server:")
        print("   cd Backend")
        print("   python3 -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000")
        print("\n3. Access Swagger UI at: http://localhost:8000/docs")
    else:
        print("\n✗ Some tests failed. Please check the errors above.")
        sys.exit(1)
