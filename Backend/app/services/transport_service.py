"""Transport problem solving service."""

from typing import List, Optional, Tuple
from dataclasses import dataclass, field
import copy

# Core types
Matriz = List[List[float]]
Vector = List[float]


@dataclass
class ResultadoTransporte:
    """Encapsula la salida completa del algoritmo de transporte.

    Attributes:
        matriz_costos_original: Tabla de costos tal como fue proporcionada.
        matriz_costos_balanceada: Tabla de costos después del balanceo (puede
            incluir filas/columnas ficticias).
        oferta_original: Vector de oferta original.
        demanda_original: Vector de demanda original.
        oferta_balanceada: Vector de oferta tras el balanceo.
        demanda_balanceada: Vector de demanda tras el balanceo.
        asignaciones: Matriz con las cantidades asignadas a cada ruta.
        costo_total: Costo total mínimo resultante de la distribución.
        fue_balanceada: Indica si se requirió balanceo.
        tipo_balanceo: Descripción del tipo de balanceo aplicado, si aplica.
        pasos: Lista de cadenas que describen cada paso del algoritmo
            (útil para auditoría y explicación).
    """

    matriz_costos_original: Matriz
    matriz_costos_balanceada: Matriz
    oferta_original: Vector
    demanda_original: Vector
    oferta_balanceada: Vector
    demanda_balanceada: Vector
    asignaciones: Matriz
    costo_total: float
    fue_balanceada: bool
    tipo_balanceo: str
    pasos: List[str] = field(default_factory=list)


def validar_entradas(
    costos: Matriz,
    oferta: Vector,
    demanda: Vector,
) -> None:
    """Valida las entradas del problema de transporte.

    Raises:
        ValueError: Si alguna dimensión es inconsistente, hay valores
            negativos o las listas están vacías.
    """
    if not costos:
        raise ValueError("La matriz de costos no puede estar vacía.")
    if not oferta:
        raise ValueError("El vector de oferta no puede estar vacío.")
    if not demanda:
        raise ValueError("El vector de demanda no puede estar vacío.")

    num_filas = len(costos)
    num_columnas = len(costos[0])

    if num_filas != len(oferta):
        raise ValueError(
            f"La matriz de costos tiene {num_filas} filas, pero el vector "
            f"de oferta tiene {len(oferta)} elementos."
        )
    if num_columnas != len(demanda):
        raise ValueError(
            f"La matriz de costos tiene {num_columnas} columnas, pero el "
            f"vector de demanda tiene {len(demanda)} elementos."
        )

    for i, fila in enumerate(costos):
        if len(fila) != num_columnas:
            raise ValueError(
                f"La fila {i} tiene {len(fila)} columnas; se esperaban "
                f"{num_columnas}."
            )
        for j, costo in enumerate(fila):
            if costo < 0:
                raise ValueError(
                    f"Costo negativo detectado en ({i}, {j}): {costo}."
                )

    for i, s in enumerate(oferta):
        if s < 0:
            raise ValueError(f"Oferta negativa en origen {i}: {s}.")

    for j, d in enumerate(demanda):
        if d < 0:
            raise ValueError(f"Demanda negativa en destino {j}: {d}.")


def balancear(
    costos: Matriz,
    oferta: Vector,
    demanda: Vector,
) -> Tuple[Matriz, Vector, Vector, bool, str]:
    """Balancea la tabla de transporte agregando filas o columnas ficticias.

    Returns:
        Tupla con (costos_balanceados, oferta_balanceada, demanda_balanceada,
        fue_balanceada, tipo_balanceo).
    """
    total_oferta = sum(oferta)
    total_demanda = sum(demanda)

    # Copias profundas para no mutar los datos de entrada
    costos_b: Matriz = copy.deepcopy(costos)
    oferta_b: Vector = list(oferta)
    demanda_b: Vector = list(demanda)

    if total_oferta == total_demanda:
        return costos_b, oferta_b, demanda_b, False, "Ninguno (ya balanceada)"

    if total_oferta > total_demanda:
        diferencia = total_oferta - total_demanda
        # Agregar columna ficticia con costo 0
        for fila in costos_b:
            fila.append(0.0)
        demanda_b.append(diferencia)
        return (
            costos_b,
            oferta_b,
            demanda_b,
            True,
            f"Oferta > Demanda: se agregó destino ficticio con demanda = {diferencia}",
        )

    # total_demanda > total_oferta
    diferencia = total_demanda - total_oferta
    num_columnas = len(costos_b[0])
    costos_b.append([0.0] * num_columnas)
    oferta_b.append(diferencia)
    return (
        costos_b,
        oferta_b,
        demanda_b,
        True,
        f"Demanda > Oferta: se agregó origen ficticio con oferta = {diferencia}",
    )


def _format_matriz_paso(
    matriz: Matriz,
    origenes: List[str],
    destinos: List[str],
    oferta: Optional[Vector] = None,
    demanda: Optional[Vector] = None,
) -> str:
    """Genera una representación de texto plano de la matriz para incluir en los pasos."""
    destinos_header = list(destinos)
    if oferta is not None:
        destinos_header.append("Oferta")

    ancho_col = max(12, max(len(d) for d in destinos_header) + 2)
    ancho_fila = max(16, max(len(o) for o in origenes) + 2)

    lineas = []
    encabezado = " " * (ancho_fila + 8)
    for d in destinos_header:
        encabezado += f"{d:>{ancho_col}}"
    lineas.append(encabezado)

    # Filas
    for i, fila in enumerate(matriz):
        etiqueta = origenes[i] if i < len(origenes) else f"Ficticio {i+1}"
        linea = f"      {etiqueta:>{ancho_fila}}: "
        for val in fila:
            linea += f"{val:>{ancho_col}.1f}"
        if oferta is not None and i < len(oferta):
            linea += f"{oferta[i]:>{ancho_col}.1f}"
        lineas.append(linea)

    if demanda is not None:
        linea_dem = f"      {'Demanda':>{ancho_fila}}: "
        for val in demanda:
            linea_dem += f"{val:>{ancho_col}.1f}"
        if oferta is not None:
            linea_dem += f"{sum(oferta):>{ancho_col}.1f}"
        lineas.append(linea_dem)

    return "\n".join(lineas)


def _encontrar_celda_minima(
    costos: Matriz,
    oferta: Vector,
    demanda: Vector,
    filas_activas: List[bool],
    columnas_activas: List[bool],
) -> Optional[Tuple[int, int]]:
    """Localiza la celda activa con el costo unitario mínimo."""
    mejor: Optional[Tuple[int, int]] = None
    mejor_costo: float = float("inf")
    mejor_asignacion: float = -1.0

    for i in range(len(costos)):
        if not filas_activas[i]:
            continue
        for j in range(len(costos[0])):
            if not columnas_activas[j]:
                continue

            costo = costos[i][j]
            asignacion_posible = min(oferta[i], demanda[j])

            es_mejor = False
            if costo < mejor_costo:
                es_mejor = True
            elif costo == mejor_costo and asignacion_posible > mejor_asignacion:
                es_mejor = True

            if es_mejor:
                mejor = (i, j)
                mejor_costo = costo
                mejor_asignacion = asignacion_posible

    return mejor


class TransportService:
    """Service for solving transport problems."""

    def __init__(self) -> None:
        """Initialize TransportService."""
        pass

    def solve_minimum_cost(
        self,
        costs: List[List[float]],
        supply: List[float],
        demand: List[float],
        origin_names: Optional[List[str]] = None,
        destination_names: Optional[List[str]] = None,
    ) -> ResultadoTransporte:
        """Solve transport problem using minimum cost method.

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
            # ── 1. Validación ──
            validar_entradas(costs, supply, demand)

            # Guardar originales
            costos_orig: Matriz = copy.deepcopy(costs)
            oferta_orig: Vector = list(supply)
            demanda_orig: Vector = list(demand)

            # ── 2. Balanceo ──
            costos_b, oferta_b, demanda_b, fue_balanceada, tipo_balanceo = balancear(
                costs, supply, demand
            )

            pasos: List[str] = []
            if fue_balanceada:
                pasos.append(f"Balanceo aplicado: {tipo_balanceo}.")
            else:
                pasos.append("La tabla ya estaba balanceada; no se requirió ajuste.")

            m = len(costos_b)
            n = len(costos_b[0])

            or_b = [(origin_names[x] if origin_names and x < len(origin_names) else f"Origen {x+1}") if x < len(supply) else "Ficticio" for x in range(m)]
            de_b = [(destination_names[y] if destination_names and y < len(destination_names) else f"Destino {y+1}") if y < len(demand) else "Ficticio" for y in range(n)]

            # Vectores de trabajo
            oferta_disp: Vector = list(oferta_b)
            demanda_disp: Vector = list(demanda_b)

            filas_activas: List[bool] = [True] * m
            columnas_activas: List[bool] = [True] * n

            asignaciones: Matriz = [[0.0] * n for _ in range(m)]

            iteracion = 0

            # ── 3. Iteración de asignación ──
            while True:
                celda = _encontrar_celda_minima(
                    costos_b, oferta_disp, demanda_disp, filas_activas, columnas_activas
                )
                if celda is None:
                    break

                i, j = celda
                cantidad = min(oferta_disp[i], demanda_disp[j])
                asignaciones[i][j] = cantidad
                oferta_disp[i] -= cantidad
                demanda_disp[j] -= cantidad

                iteracion += 1
                pasos.append(
                    f"Iteración {iteracion}: Asignar {cantidad} unidades a la celda "
                    f"({i}, {j}) con costo unitario {costos_b[i][j]}. "
                    f"Oferta restante fila {i} = {oferta_disp[i]}, "
                    f"Demanda restante col {j} = {demanda_disp[j]}.\n"
                    f"    [Matriz de Asignaciones Actuales]:\n"
                    f"{_format_matriz_paso(asignaciones, or_b, de_b, oferta_disp, demanda_disp)}"
                )

                # ── Manejo de degeneración ──
                if oferta_disp[i] == 0 and demanda_disp[j] == 0:
                    filas_activas[i] = False
                    pasos.append(
                        f"  ⚠ Degeneración: oferta y demanda agotadas simultáneamente "
                        f"en ({i}, {j}). Se cancela la fila {i}; la columna {j} "
                        f"permanece activa con demanda 0."
                    )
                elif oferta_disp[i] == 0:
                    filas_activas[i] = False
                    pasos.append(f"  Fila {i} agotada → cancelada.")
                elif demanda_disp[j] == 0:
                    columnas_activas[j] = False
                    pasos.append(f"  Columna {j} agotada → cancelada.")

            # ── 4. Costo total ──
            costo_total: float = sum(
                asignaciones[i][j] * costos_b[i][j]
                for i in range(m)
                for j in range(n)
            )

            pasos.append(f"Costo total mínimo calculado: {costo_total}.")

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
        except ValueError as e:
            raise ValueError(f"Invalid input for minimum cost method: {str(e)}") from e
        except Exception as e:
            raise RuntimeError(f"Error solving with minimum cost method: {str(e)}") from e

    def solve_north_west(
        self,
        costs: List[List[float]],
        supply: List[float],
        demand: List[float],
        origin_names: Optional[List[str]] = None,
        destination_names: Optional[List[str]] = None,
    ) -> ResultadoTransporte:
        """Solve transport problem using north-west corner method.

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
            # 1. Validación
            validar_entradas(costs, supply, demand)

            costos_orig: Matriz = copy.deepcopy(costs)
            oferta_orig: Vector = list(supply)
            demanda_orig: Vector = list(demand)

            # 2. Balanceo
            costos_b, oferta_b, demanda_b, fue_balanceada, tipo_balanceo = balancear(
                costs, supply, demand
            )

            pasos: List[str] = []
            if fue_balanceada:
                pasos.append(f"Balanceo aplicado: {tipo_balanceo}.")
            else:
                pasos.append("La tabla ya estaba balanceada; no se requirió ajuste.")

            m = len(costos_b)
            n = len(costos_b[0])

            or_b = [(origin_names[x] if origin_names and x < len(origin_names) else f"Origen {x+1}") if x < len(supply) else "Ficticio" for x in range(m)]
            de_b = [(destination_names[y] if destination_names and y < len(destination_names) else f"Destino {y+1}") if y < len(demand) else "Ficticio" for y in range(n)]

            oferta_disp: Vector = list(oferta_b)
            demanda_disp: Vector = list(demanda_b)

            asignaciones: Matriz = [[0.0] * n for _ in range(m)]

            # 3. Iteración de la Esquina Noroeste
            i, j = 0, 0
            iteracion = 0

            while i < m and j < n:
                cantidad = min(oferta_disp[i], demanda_disp[j])
                asignaciones[i][j] = cantidad
                oferta_disp[i] -= cantidad
                demanda_disp[j] -= cantidad

                iteracion += 1
                pasos.append(
                    f"Iteración {iteracion}: Asignar {cantidad} unidades en la esquina "
                    f"noroeste ({i}, {j}) a costo unitario {costos_b[i][j]}. "
                    f"Oferta restante = {oferta_disp[i]}, Demanda restante = {demanda_disp[j]}.\n"
                    f"    [Matriz de Asignaciones Actuales]:\n"
                    f"{_format_matriz_paso(asignaciones, or_b, de_b, oferta_disp, demanda_disp)}"
                )

                # Manejo de degeneración y avance
                if oferta_disp[i] == 0 and demanda_disp[j] == 0:
                    if i != m - 1 or j != n - 1:
                        pasos.append(
                            f"  ⚠ Degeneración en ({i}, {j}): oferta y demanda agotadas "
                            f"simultáneamente. Se cancela la fila {i} y se avanza a la "
                            f"siguiente; la columna {j} mantiene demanda 0."
                        )
                        i += 1
                    else:
                        break
                elif oferta_disp[i] == 0:
                    pasos.append(f"  Fila {i} agotada → avanzar hacia abajo.")
                    i += 1
                else:
                    pasos.append(f"  Columna {j} agotada → avanzar hacia la derecha.")
                    j += 1

            # 4. Costo total
            costo_total: float = sum(
                asignaciones[r][c] * costos_b[r][c]
                for r in range(m)
                for c in range(n)
            )

            pasos.append(f"Costo total mínimo calculado: {costo_total}.")

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
        except ValueError as e:
            raise ValueError(f"Invalid input for north-west corner method: {str(e)}") from e
        except Exception as e:
            raise RuntimeError(f"Error solving with north-west corner method: {str(e)}") from e

    def solve_vogel(
        self,
        costs: List[List[float]],
        supply: List[float],
        demand: List[float],
        origin_names: Optional[List[str]] = None,
        destination_names: Optional[List[str]] = None,
    ) -> ResultadoTransporte:
        """Solve transport problem using Vogel's approximation method (VAM).

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
            # 1. Validación y Copias
            validar_entradas(costs, supply, demand)
            costos_orig: Matriz = copy.deepcopy(costs)
            oferta_orig: Vector = list(supply)
            demanda_orig: Vector = list(demand)

            # 2. Balanceo
            costos_b, oferta_b, demanda_b, fue_balanceada, tipo_balanceo = balancear(
                costs, supply, demand
            )

            pasos: List[str] = []
            if fue_balanceada:
                pasos.append(f"Balanceo aplicado: {tipo_balanceo}.")
            else:
                pasos.append("La tabla ya estaba balanceada; no se requirió ajuste.")

            m = len(costos_b)
            n = len(costos_b[0])

            or_b = [(origin_names[x] if origin_names and x < len(origin_names) else f"Origen {x+1}") if x < len(supply) else "Ficticio" for x in range(m)]
            de_b = [(destination_names[y] if destination_names and y < len(destination_names) else f"Destino {y+1}") if y < len(demand) else "Ficticio" for y in range(n)]

            oferta_disp: Vector = list(oferta_b)
            demanda_disp: Vector = list(demanda_b)

            filas_activas = [True] * m
            cols_activas = [True] * n
            asignaciones: Matriz = [[0.0] * n for _ in range(m)]

            iteracion = 0

            # 3. Bucle Principal de Vogel
            while True:
                # Verificar si ya terminamos
                if not any(filas_activas) or not any(cols_activas):
                    break

                iteracion += 1
                pasos.append(f"\n--- Iteración {iteracion} ---")

                # A) Calcular Penalizaciones (Diferencias)
                pen_filas = []
                for i in range(m):
                    if filas_activas[i]:
                        c_f = [costos_b[i][j] for j in range(n) if cols_activas[j]]
                        if len(c_f) >= 2:
                            s = sorted(c_f)
                            pen_filas.append((i, s[1] - s[0]))
                        elif len(c_f) == 1:
                            pen_filas.append((i, c_f[0]))
                        else:
                            pen_filas.append((i, -1.0))
                    else:
                        pen_filas.append((i, -1.0))

                pen_cols = []
                for j in range(n):
                    if cols_activas[j]:
                        c_c = [costos_b[i][j] for i in range(m) if filas_activas[i]]
                        if len(c_c) >= 2:
                            s = sorted(c_c)
                            pen_cols.append((j, s[1] - s[0]))
                        elif len(c_c) == 1:
                            pen_cols.append((j, c_c[0]))
                        else:
                            pen_cols.append((j, -1.0))
                    else:
                        pen_cols.append((j, -1.0))

                # Registrar el cálculo de diferencias en la bitácora
                dif_str = []
                for i, p in pen_filas:
                    if p >= 0:
                        dif_str.append(f"F{i}({p})")
                for j, p in pen_cols:
                    if p >= 0:
                        dif_str.append(f"C{j}({p})")

                pasos.append(f"Diferencias calculadas: {', '.join(dif_str)}")

                # B) Buscar la Máxima Diferencia
                max_pen = -1.0
                for _, p in pen_filas:
                    if p > max_pen:
                        max_pen = p
                for _, p in pen_cols:
                    if p > max_pen:
                        max_pen = p

                if max_pen == -1.0:
                    break

                # C) Desempate: seleccionar la línea con la máxima penalización con menor costo unitario
                candidatos = []
                for i, p in pen_filas:
                    if p == max_pen:
                        candidatos.append((True, i))
                for j, p in pen_cols:
                    if p == max_pen:
                        candidatos.append((False, j))

                menor_costo_global = float("inf")
                mejor_celda = (-1, -1)
                mejor_linea_str = ""

                for es_fila, idx in candidatos:
                    min_c = float("inf")
                    celda = (-1, -1)

                    if es_fila:
                        for j in range(n):
                            if cols_activas[j] and costos_b[idx][j] < min_c:
                                min_c = costos_b[idx][j]
                                celda = (idx, j)
                    else:
                        for i in range(m):
                            if filas_activas[i] and costos_b[i][idx] < min_c:
                                min_c = costos_b[i][idx]
                                celda = (i, idx)

                    if min_c < menor_costo_global:
                        menor_costo_global = min_c
                        mejor_celda = celda
                        mejor_linea_str = f"Fila {idx}" if es_fila else f"Columna {idx}"

                i, j = mejor_celda
                if i == -1 or j == -1:
                    break

                pasos.append(f"Máxima diferencia elegida: {max_pen} (en la {mejor_linea_str}).")

                # D) Asignar en la celda de menor costo
                cantidad = min(oferta_disp[i], demanda_disp[j])
                asignaciones[i][j] = cantidad
                oferta_disp[i] -= cantidad
                demanda_disp[j] -= cantidad

                pasos.append(
                    f"  > Asignar {cantidad} unidades a Celda ({i}, {j}) con costo {costos_b[i][j]}."
                )
                pasos.append(
                    f"  > Oferta restante F{i} = {oferta_disp[i]} | Demanda restante C{j} = {demanda_disp[j]}.\n"
                    f"    [Matriz de Asignaciones Actuales]:\n"
                    f"{_format_matriz_paso(asignaciones, or_b, de_b, oferta_disp, demanda_disp)}"
                )

                # E) Cancelar fila o columna (Manejo de Degeneración)
                if oferta_disp[i] == 0 and demanda_disp[j] == 0:
                    filas_activas[i] = False
                    pasos.append(
                        f"  ⚠ Degeneración: Agotamiento simultáneo. Se cancela la Fila {i}; "
                        f"la Columna {j} sigue activa con demanda 0."
                    )
                elif oferta_disp[i] == 0:
                    filas_activas[i] = False
                    pasos.append(f"  > Fila {i} agotada → Cancelada.")
                else:
                    cols_activas[j] = False
                    pasos.append(f"  > Columna {j} agotada → Cancelada.")

            # 4. Cálculo del costo total
            costo_total = sum(
                asignaciones[i][j] * costos_b[i][j]
                for i in range(m)
                for j in range(n)
            )

            pasos.append(f"\n★ Costo total mínimo calculado (VAM): {costo_total}.")

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
        except ValueError as e:
            raise ValueError(f"Invalid input for Vogel method: {str(e)}") from e
        except Exception as e:
            raise RuntimeError(f"Error solving with Vogel method: {str(e)}") from e
