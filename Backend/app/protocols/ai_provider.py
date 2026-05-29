"""AI Provider protocol for abstraction."""

from typing import Protocol


class AIProvider(Protocol):
    """Protocol for AI analysis providers."""

    def generate_analysis(
        self,
        prompt: str,
        temperature: float = 0.3,
        max_tokens: int = 1024
    ) -> str:
        """Generate AI analysis from a prompt.

        Args:
            prompt: The user prompt describing what to analyze.
            temperature: Sampling temperature (0.0 to 1.0).
            max_tokens: Maximum tokens to generate.

        Returns:
            Generated analysis text.

        Raises:
            RuntimeError: If API call fails.
        """
        ...
