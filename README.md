# Nexus Solver (Monorepo)

Este proyecto es un solucionador interactivo y profesional para **Problemas de Transporte e Inversión/Asignación**, diseñado con una interfaz moderna y equipado con un **Director de Operaciones virtual de Inteligencia Artificial (Groq/Llama-3)** para emitir conclusiones operacionales e informes estratégicos en tiempo real.

El proyecto está estructurado de manera centralizada en un **Monorepositorio** único que gestiona de forma unificada las dependencias de Python (Backend) y Node.js/pnpm (Frontend).

---

## Características Principales

### 📦 Arquitectura Centralizada (Monorepo)
* **Entorno Virtual Único**: Todo el desarrollo de Python ocurre dentro de un solo entorno virtual en la raíz del proyecto (`venv`).
* **Espacio de Trabajo pnpm**: Las dependencias del Frontend y de ejecución de la raíz se gestionan de manera consolidada en un solo comando mediante `pnpm workspaces`.
* **Variables Unificadas**: Un único archivo `.env` en la raíz controla todas las llaves de API (Groq) y orígenes de CORS.

### 🚚 Módulo de Transporte
* Resuelve problemas logísticos y de cadena de suministro usando algoritmos clásicos de investigación de operaciones:
  * **Costo Mínimo**
  * **Esquina Noroeste**
  * **Aproximación de Vogel (VAM)**
* Soporta problemas balanceados y no balanceados (añade automáticamente orígenes/destinos ficticios).

### 👥 Módulo de Asignación
* Resuelve asignaciones óptimas de agentes a tareas minimizando o maximizando el costo/beneficio mediante el **Algoritmo Húngaro (Kuhn-Munkres)**.
* **Soporte No Cuadrado (Asimétrico)**: Permite ingresar matrices no cuadradas (ej. 3 agentes × 5 tareas), balanceándolas dinámicamente con costo `0` en el Backend de forma automática.
* **Renombrado Dinámico**: Haz clic directamente sobre las etiquetas de filas/columnas en la matriz para cambiar el nombre de los agentes, tareas, orígenes o destinos.
* **Integración Directa de IA y PDF**: Genera y restablece reportes ejecutivos analizados por Groq IA y descarga todo en un reporte PDF profesional en un solo clic.

---

## Requisitos Previos

Asegúrate de contar con:
1. **Python 3.10+**
2. **Node.js 18+** y **pnpm** (`npm i -g pnpm`)

---

## Configuración e Instalación

Sigue estos sencillos pasos para instalar todo el proyecto desde cero:

### 1. Variables de Entorno
Copia la plantilla de ejemplo de la raíz del proyecto y configúrala:
```bash
cp .env.example .env
```
Abre el archivo `.env` recién creado y añade tu clave de API de Groq:
```env
GROQ_API_KEY=tu_clave_de_api_de_groq_aqui
```

### 2. Configurar el Backend (Python)
Desde la raíz del proyecto, crea el entorno virtual e instala los paquetes necesarios:
```bash
# Crear entorno virtual en la raíz
python3 -m venv venv

# Activar el entorno virtual
source venv/bin/activate

# Instalar dependencias
pip install -r requirements.txt
```

### 3. Configurar el Frontend (pnpm)
Desde la raíz del proyecto, instala todas las dependencias del frontend y del monorepositorio con un solo comando:
```bash
pnpm install
```

---

## Ejecución del Proyecto

Para iniciar tanto el **Backend (FastAPI)** como el **Frontend (Vite + React + TS)** concurrentemente, solo debes ejecutar el siguiente comando desde la raíz:

```bash
pnpm dev
```

Este comando levantará automáticamente:
* **Python Backend API** en [http://localhost:8000](http://localhost:8000) (documentación interactiva disponible en [http://localhost:8000/docs](http://localhost:8000/docs)).
* **React Frontend** en [http://localhost:5173](http://localhost:5173) (con hot-reload para desarrollo inmediato).