"""LLM seam + provider factory — swap providers/models purely via env.

`make_llm(model, provider)` returns an `LLM` for the configured provider:
  - gemini            : Gemini Developer API (api key)
  - vertex            : Gemini on Google Cloud (Vertex AI)
  - anthropic-vertex  : Claude on Google Cloud (Vertex AI / Model Garden)
  - anthropic         : Claude on Anthropic's direct API (api key)
  - openai-compat     : a self-hosted open model behind an OpenAI-compatible API
                        (vLLM / TGI / Ollama / LM Studio) — set OPENAI_BASE_URL (+ OPENAI_API_KEY).
                        aliases: openai, self-hosted, vllm, ollama
Provider is taken from LLM_PROVIDER, or inferred from the model name (claude* → anthropic-vertex).
Callers never change when the model/provider changes — only env does. The attacker, the classifier,
and each judge in the panel each resolve their own (provider, model) independently from env.
"""
from typing import Optional, Protocol

from .config import get_settings


class LLM(Protocol):
    async def generate(
        self, prompt: str, *, system: Optional[str] = None, temperature: float = 0.8,
        model: Optional[str] = None,
    ) -> str: ...


class GeminiLLM:
    """Gemini via google-genai — Developer API or Vertex."""

    def __init__(self, model: str, *, vertex: bool = False) -> None:
        from google import genai

        s = get_settings()
        if vertex:
            self._client = genai.Client(
                vertexai=True, project=s.vertex_project_id, location=s.vertex_location or "global"
            )
        else:
            self._client = genai.Client(api_key=s.gemini_key)
        self.model = model

    async def generate(self, prompt, *, system=None, temperature=0.8, model=None) -> str:
        from google.genai import types

        cfg = types.GenerateContentConfig(temperature=temperature, system_instruction=system)
        resp = await self._client.aio.models.generate_content(
            model=model or self.model, contents=prompt, config=cfg
        )
        return (resp.text or "").strip()


class AnthropicLLM:
    """Claude via the anthropic SDK — Vertex (Google Cloud) or the direct API."""

    def __init__(self, model: str, *, vertex: bool = True) -> None:
        s = get_settings()
        if vertex:
            from anthropic import AsyncAnthropicVertex

            self._client = AsyncAnthropicVertex(
                project_id=s.vertex_project_id, region=s.anthropic_vertex_region
            )
        else:
            from anthropic import AsyncAnthropic

            self._client = AsyncAnthropic(api_key=s.anthropic_api_key)
        self.model = model

    async def generate(self, prompt, *, system=None, temperature=0.8, model=None) -> str:
        from anthropic import NOT_GIVEN

        msg = await self._client.messages.create(
            model=model or self.model, max_tokens=2048, temperature=temperature,
            system=system or NOT_GIVEN,
            messages=[{"role": "user", "content": prompt}],
        )
        return "".join(b.text for b in msg.content if getattr(b, "type", None) == "text").strip()


class OpenAICompatLLM:
    """Any OpenAI-compatible chat endpoint — a self-hosted open model (vLLM / TGI / Ollama / LM Studio).

    Point OPENAI_BASE_URL at the server (e.g. http://localhost:8000/v1) and set the model to whatever
    the endpoint serves (e.g. 'meta-llama/Llama-3.1-70B-Instruct'). OPENAI_API_KEY is optional for most
    self-hosted servers (vLLM accepts any token) but required for hosted gateways.
    """

    def __init__(self, model: str) -> None:
        from openai import AsyncOpenAI

        s = get_settings()
        if not s.openai_base_url:
            raise ValueError("openai-compat provider needs OPENAI_BASE_URL (the self-hosted endpoint)")
        self._client = AsyncOpenAI(
            base_url=s.openai_base_url, api_key=s.openai_api_key or "EMPTY"
        )
        self.model = model

    async def generate(self, prompt, *, system=None, temperature=0.8, model=None) -> str:
        messages = []
        if system:
            messages.append({"role": "system", "content": system})
        messages.append({"role": "user", "content": prompt})
        resp = await self._client.chat.completions.create(
            model=model or self.model, temperature=temperature, messages=messages, max_tokens=2048,
        )
        return (resp.choices[0].message.content or "").strip()


def _infer_provider(model: str) -> str:
    m = (model or "").lower()
    if m.startswith("claude") or "anthropic" in m:
        return "anthropic-vertex"
    return "gemini"


def make_llm(model: Optional[str] = None, provider: Optional[str] = None) -> LLM:
    s = get_settings()
    model = model or s.llm_attacker_model
    provider = (provider or s.llm_provider or "").strip().lower() or _infer_provider(model)
    if provider == "gemini":
        return GeminiLLM(model, vertex=False)
    if provider == "vertex":
        return GeminiLLM(model, vertex=True)
    if provider == "anthropic-vertex":
        return AnthropicLLM(model, vertex=True)
    if provider == "anthropic":
        return AnthropicLLM(model, vertex=False)
    if provider in ("openai-compat", "openai", "self-hosted", "vllm", "ollama"):
        return OpenAICompatLLM(model)
    raise ValueError(f"unknown LLM provider: {provider!r} (set LLM_PROVIDER)")
