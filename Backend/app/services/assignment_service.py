"""Assignment problem solving service."""

from typing import List, Optional
import copy
from app.services.transport_service import ResultadoTransporte, Matriz, Vector, validar_entradas


def _format_matriz_reduccion(C: Matriz, origenes: List[str], destinos: List[str]) -> str:
    """Genera una representación en texto plano de la matriz de reducción para la bitácora."""
    ancho_col = max(12, max(len(d) for d in destinos) + 2)
    ancho_fila = max(16, max(len(o) for o in origenes) + 2)

    lineas = []
    encabezado = " " * (ancho_fila + 8)
    for d in destinos:
        encabezado += f"{d:>{ancho_col}}"
    lineas.append(encabezado)

    for i, fila in enumerate(C):
        linea = f"      {origenes[i]:>{ancho_fila}}: "
        for val in fila:
            linea += f"{val:>{ancho_col}.1f}"
        lineas.append(linea)

    return "\n".join(lineas)


class AssignmentService:
    """Service for solving assignment problems."""

    def __init__(self) -> None:
        """Initialize AssignmentService."""
        pass

    def solve_hungarian_min(
        self,
        costs: List[List[float]],
        supply: List[float],
        demand: List[float],
        origin_names: Optional[List[str]] = None,
        destination_names: Optional[List[str]] = None,
    ) -> ResultadoTransporte:
        """Solve using Hungarian algorithm for minimization.

        Args:
            costs: Cost matrix.
            supply: Supply vector.
            demand: Demand vector.

        Returns:
            ResultadoTransporte with solution.

        Raises:
            ValueError: If inputs are invalid.
        """
        try:
            return self._solve_hungarian(costs, supply, demand, maximizar=False, origin_names=origin_names, destination_names=destination_names)
        except ValueError as e:
            raise ValueError(f"Invalid input for Hungarian (min) method: {str(e)}") from e
        except Exception as e:
            raise RuntimeError(f"Error solving with Hungarian (min) method: {str(e)}") from e

    def solve_hungarian_max(
        self,
        costs: List[List[float]],
        supply: List[float],
        demand: List[float],
        origin_names: Optional[List[str]] = None,
        destination_names: Optional[List[str]] = None,
    ) -> ResultadoTransporte:
        """Solve using Hungarian algorithm for maximization.

        Args:
            costs: Cost/benefit matrix.
            supply: Supply vector.
            demand: Demand vector.

        Returns:
            ResultadoTransporte with solution.

        Raises:
            ValueError: If inputs are invalid.
        """
        try:
            return self._solve_hungarian(costs, supply, demand, maximizar=True, origin_names=origin_names, destination_names=destination_names)
        except ValueError as e:
            raise ValueError(f"Invalid input for Hungarian (max) method: {str(e)}") from e
        except Exception as e:
            raise RuntimeError(f"Error solving with Hungarian (max) method: {str(e)}") from e

    def _solve_hungarian(
        self,
        costos: Matriz,
        oferta: Vector,
        demanda: Vector,
        maximizar: bool = False,
        origin_names: Optional[List[str]] = None,
        destination_names: Optional[List[str]] = None,
    ) -> ResultadoTransporte:
        """Resuelve el problema de asignación por el Método Húngaro (Kuhn-Munkres)."""
        # 1. Validación inicial básica
        validar_entradas(costos, oferta, demanda)

        costos_orig: Matriz = copy.deepcopy(costos)
        oferta_orig: Vector = list(oferta)
        demanda_orig: Vector = list(demanda)

        m = len(costos)
        n = len(costos[0])
        N = max(m, n)

        pasos: List[str] = []

        # 2. Balanceo para hacer la matriz cuadrada (N x N)
        costos_b = copy.deepcopy(costos)
        if m > n:
            for fila in costos_b:
                fila.extend([0.0] * (m - n))
            fue_balanceada = True
            tipo_balanceo = f"Matriz no cuadrada ({m}x{n}): se agregaron {m - n} destinos ficticios con costo 0 para hacer la matriz cuadrada."
            pasos.append(f"Matriz balanceada por el Método Húngaro: {tipo_balanceo}")
        elif m < n:
            for _ in range(n - m):
                costos_b.append([0.0] * n)
            fue_balanceada = True
            tipo_balanceo = f"Matriz no cuadrada ({m}x{n}): se agregaron {n - m} orígenes ficticios con costo 0 para hacer la matriz cuadrada."
            pasos.append(f"Matriz balanceada por el Método Húngaro: {tipo_balanceo}")
        else:
            fue_balanceada = False
            tipo_balanceo = "Ninguno (ya es cuadrada)"
            pasos.append("La matriz de costos ya era cuadrada; no se requirió balanceo adicional.")

        oferta_b: Vector = [1.0] * N
        demanda_b: Vector = [1.0] * N

        or_b = [(origin_names[x] if origin_names and x < len(origin_names) else f"Origen {x+1}") if x < m else "Ficticio" for x in range(N)]
        de_b = [(destination_names[y] if destination_names and y < len(destination_names) else f"Destino {y+1}") if y < n else "Ficticio" for y in range(N)]

        C = [row[:] for row in costos_b]

        if maximizar:
            pasos.append("\nEl problema es de Maximización.")
            max_val = max(max(row) for row in costos_b)
            pasos.append(f"    - Elemento máximo de la matriz balanceada: {max_val:.1f}")
            pasos.append(f"    - Aplicando transformación de maximización: C'[i][j] = {max_val:.1f} - C[i][j]")
            for i in range(N):
                for j in range(N):
                    C[i][j] = max_val - C[i][j]
            pasos.append(f"    [Matriz después de transformación de maximización]:\n{_format_matriz_reduccion(C, or_b, de_b)}")

        # Paso 1: Restar mínimos de filas
        pasos.append("\nPaso 1: Restar el valor mínimo de cada fila a todos los elementos de esa fila.")
        for i in range(N):
            min_f = min(C[i])
            for j in range(N):
                C[i][j] -= min_f
        pasos.append(f"    [Matriz después de reducción de filas]:\n{_format_matriz_reduccion(C, or_b, de_b)}")

        # Paso 2: Restar mínimos de columnas
        pasos.append("\nPaso 2: Restar el valor mínimo de cada columna a todos los elementos de esa columna.")
        for j in range(N):
            min_c = min(C[i][j] for i in range(N))
            for i in range(N):
                C[i][j] -= min_c
        pasos.append(f"    [Matriz después de reducción de columnas]:\n{_format_matriz_reduccion(C, or_b, de_b)}")

        # Paso 3 & 4: Iterar emparejamiento y ajuste
        iteracion = 0
        match_row = [-1] * N
        match_col = [-1] * N

        while True:
            iteracion += 1
            pasos.append(f"\n--- Iteración Húngara {iteracion} ---")

            for i in range(N):
                for j in range(N):
                    if abs(C[i][j]) < 1e-9:
                        C[i][j] = 0.0

            zeros = [[C[i][j] == 0.0 for j in range(N)] for i in range(N)]
            match_row = [-1] * N
            match_col = [-1] * N

            def dfs(u: int, visited: List[bool]) -> bool:
                for v in range(N):
                    if zeros[u][v] and not visited[v]:
                        visited[v] = True
                        if match_col[v] < 0 or dfs(match_col[v], visited):
                            match_row[u] = v
                            match_col[v] = u
                            return True
                return False

            matching_size = 0
            for i in range(N):
                visited = [False] * N
                if dfs(i, visited):
                    matching_size += 1

            pasos.append(f"  > Tamaño del emparejamiento máximo de ceros: {matching_size} de {N} necesarios.")

            if matching_size == N:
                pasos.append("  ✓ Emparejamiento perfecto encontrado. Asignación óptima completada.")
                break

            visited_rows = [False] * N
            visited_cols = [False] * N
            unmatched_rows = [i for i in range(N) if match_row[i] < 0]

            queue = list(unmatched_rows)
            for r in unmatched_rows:
                visited_rows[r] = True

            while queue:
                u = queue.pop(0)
                for v in range(N):
                    if zeros[u][v] and not visited_cols[v]:
                        visited_cols[v] = True
                        matched_row_idx = match_col[v]
                        if matched_row_idx >= 0 and not visited_rows[matched_row_idx]:
                            visited_rows[matched_row_idx] = True
                            queue.append(matched_row_idx)

            covered_rows = [not visited_rows[i] for i in range(N)]
            covered_cols = [visited_cols[j] for j in range(N)]

            lineas_fil = [or_b[i] for i in range(N) if covered_rows[i]]
            lineas_col = [de_b[j] for j in range(N) if covered_cols[j]]

            pasos.append(
                f"  > Recubrimiento mínimo de ceros realizado con {matching_size} líneas:\n"
                f"    - Filas cubiertas: {', '.join(lineas_fil) if lineas_fil else 'Ninguna'}\n"
                f"    - Columnas cubiertas: {', '.join(lineas_col) if lineas_col else 'Ninguna'}"
            )

            delta = float("inf")
            for i in range(N):
                if not covered_rows[i]:
                    for j in range(N):
                        if not covered_cols[j] and C[i][j] < delta:
                            delta = C[i][j]

            if delta == float("inf") or delta < 1e-9:
                pasos.append("  ⚠ Error matemático: delta es inválido. Deteniendo para evitar bucle.")
                break

            pasos.append(
                f"  > Ajuste de la matriz usando delta = {delta:.1f} (menor valor no cubierto):\n"
                f"    - Restar delta de todas las filas no cubiertas.\n"
                f"    - Sumar delta a todas las columnas cubiertas (creando intersecciones)."
            )

            for i in range(N):
                for j in range(N):
                    if not covered_rows[i] and not covered_cols[j]:
                        C[i][j] -= delta
                    elif covered_rows[i] and covered_cols[j]:
                        C[i][j] += delta

            pasos.append(f"    [Matriz Ajustada]:\n{_format_matriz_reduccion(C, or_b, de_b)}")

            if iteracion >= 100:
                pasos.append("  ⚠ Límite de iteraciones alcanzado en el bucle del Método Húngaro.")
                break

        asignaciones = [[0.0] * N for _ in range(N)]
        for i in range(N):
            if match_row[i] >= 0:
                asignaciones[i][match_row[i]] = 1.0

        costo_total = 0.0
        resumen_asig = []
        for i in range(N):
            col = match_row[i]
            if col >= 0:
                costo_unitario = costos_b[i][col]
                costo_total += costo_unitario
                if i < m and col < n:
                    resumen_asig.append(f"Asignar '{or_b[i]}' a '{de_b[col]}' con costo unitario = {costo_unitario:.1f}")
                else:
                    resumen_asig.append(f"Asignar '{or_b[i]}' a '{de_b[col]}' (Asignación Ficticia) con costo unitario = 0.0")

        pasos.append("\nResumen Final de Asignaciones Óptimas:")
        for res in resumen_asig:
            pasos.append(f"  - {res}")

        if maximizar:
            pasos.append(f"\n★ Beneficio total máximo calculado (Método Húngaro): {costo_total:.2f}")
        else:
            pasos.append(f"\n★ Costo total mínimo calculado (Método Húngaro): {costo_total:.2f}")

        return ResultadoTransporte(
            matriz_costos_original=costos_orig,
            matriz_costos_balanceada=costos_b,
            oferta_original=oferta_orig,
            demanda_original=demanda_orig,
            oferta_balanceada=oferta_b,
            demanda_balanceada=demanda_b,
            asignaciones=asignaciones,
            costo_total=costo_total,
            fue_balanceada=fue_balanceada,
            tipo_balanceo=tipo_balanceo,
            pasos=pasos,
        )
