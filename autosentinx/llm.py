"""LLM seam + GeminiLLM. Open-weight backends drop in behind the same protocol later.

Phase 0 uses this only for a /health smoke check — not in the scan.
"""
from typing import Optional, Protocol

from google import genai
from google.genai import types

from .config import get_settings


class LLM(Protocol):
    async def generate(
        self, prompt: str, *, system: Optional[str] = None, temperature: float = 0.8,
        model: Optional[str] = None,
    ) -> str: ...


class GeminiLLM:
    def __init__(self) -> None:
        s = get_settings()
        if s.google_genai_use_vertexai:
            self._client = genai.Client(
                vertexai=True, project=s.vertex_project_id, location=s.vertex_location
            )
        else:
            self._client = genai.Client(api_key=s.gemini_key)
        self._default_model = s.gemini_attacker_model

    async def generate(self, prompt, *, system=None, temperature=0.8, model=None) -> str:
        cfg = types.GenerateContentConfig(
            temperature=temperature, system_instruction=system
        )
        resp = await self._client.aio.models.generate_content(
            model=model or self._default_model, contents=prompt, config=cfg
        )
        return (resp.text or "").strip()
