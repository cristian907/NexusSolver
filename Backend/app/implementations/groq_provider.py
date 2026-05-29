"""Groq AI provider implementation."""

import json
import os
import urllib.request
import urllib.error
from typing import Any, Dict


class GroqProvider:
    """Groq AI provider implementation."""

    def __init__(self, model: str = "llama-3.3-70b-versatile"):
        """Initialize Groq provider.

        Args:
            model: Groq model identifier.
        """
        self.model = model
        self.api_url = "https://api.groq.com/openai/v1/chat/completions"

    def _get_api_key(self) -> str:
        """Get Groq API key from environment."""
        try:
            from dotenv import load_dotenv, find_dotenv
            load_dotenv(find_dotenv(), override=True)
        except ImportError:
            pass

        key = os.environ.get("GROQ_API_KEY")
        if key:
            return key

        # Try loading from .env file manually
        env_paths = [
            os.path.join(os.getcwd(), ".env"),
            os.path.join(os.path.dirname(__file__), "../..", ".env"),
            os.path.join(os.path.dirname(__file__), "../../..", ".env"),
        ]

        for path in env_paths:
            if os.path.isfile(path):
                try:
                    with open(path, "r", encoding="utf-8") as f:
                        for line in f:
                            line = line.strip()
                            if not line or line.startswith("#"):
                                continue
                            if "=" in line:
                                k, v = line.split("=", 1)
                                k = k.strip()
                                v = v.strip()
                                if (v.startswith('"') and v.endswith('"')) or (
                                    v.startswith("'") and v.endswith("'")
                                ):
                                    v = v[1:-1]
                                if k == "GROQ_API_KEY" and v:
                                    os.environ["GROQ_API_KEY"] = v
                                    return v
                except Exception:
                    pass

        raise RuntimeError(
            "GROQ_API_KEY not found. Set it as an environment variable or in a .env file."
        )

    def generate_analysis(
        self,
        prompt: str,
        temperature: float = 0.3,
        max_tokens: int = 1024
    ) -> str:
        """Generate AI analysis using Groq API.

        Args:
            prompt: The user prompt.
            temperature: Sampling temperature.
            max_tokens: Maximum tokens to generate.

        Returns:
            Generated analysis text.

        Raises:
            RuntimeError: If API call fails.
        """
        system_prompt = (
            "Eres un Director de Operaciones (COO) de clase mundial especializado en "
            "optimización logística y cadena de suministro. Analiza los resultados de "
            "problemas de transporte y asignación para interpretar el impacto operacional.\n\n"
            "Identifica y analiza:\n"
            "1. Cuellos de botella operacionales en las rutas/asignaciones\n"
            "2. Riesgos logísticos (dependencias críticas, puntos únicos de fallo)\n"
            "3. Balance de carga de trabajo entre orígenes/destinos\n"
            "4. Eficiencia de costos y oportunidades de optimización\n"
            "5. Recomendaciones estratégicas accionables\n\n"
            "Proporciona un análisis ejecutivo conciso (máximo 3 párrafos) en español."
        )

        payload: Dict[str, Any] = {
            "model": self.model,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": prompt},
            ],
            "temperature": temperature,
            "max_tokens": max_tokens,
        }

        data_bytes = json.dumps(payload).encode("utf-8")
        api_key = self._get_api_key()

        req = urllib.request.Request(
            self.api_url,
            data=data_bytes,
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
                "User-Agent": "Mozilla/5.0",
            },
            method="POST",
        )

        try:
            with urllib.request.urlopen(req, timeout=30) as resp:
                body = resp.read().decode("utf-8")
        except urllib.error.HTTPError as e:
            error_body = e.read().decode("utf-8", errors="replace")
            raise RuntimeError(f"Groq API HTTP error {e.code}: {error_body}") from e
        except urllib.error.URLError as e:
            raise RuntimeError(f"Groq API connection error: {e}") from e

        data: Dict[str, Any] = json.loads(body)

        try:
            return data["choices"][0]["message"]["content"]
        except (KeyError, IndexError) as e:
            raise RuntimeError(
                f"Unexpected Groq API response: {json.dumps(data, indent=2)}"
            ) from e
