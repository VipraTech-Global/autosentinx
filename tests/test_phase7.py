"""Phase 7 — ingestion parsing + audit hash chain logic (offline, no network)."""
import asyncio

from autosentinx.audit import _hash
from autosentinx.ingestion import _slugify, extract_candidates, fetch_source
from autosentinx.spine import Mode


class _FakeLLM:
    def __init__(self, resp): self.resp = resp
    async def generate(self, prompt, *, system=None, temperature=0.8, model=None): return self.resp


def test_slugify():
    assert _slugify("DATA_BREACH", "Disclose Aadhaar to unverified caller!").startswith("data.")
    assert " " not in _slugify("COERCION", "Threat of arrest")


def test_fetch_source_text():
    assert asyncio.run(fetch_source("regulation", "some clause")) == ("some clause", "paste")


def test_extract_candidates_filters_invalid():
    good = {"title": "X", "mode": Mode.DATA_BREACH.value, "primary_pillar": "compliance",
            "success_definition": "agent leaks PAN", "quote": "q"}
    bad_mode = {"title": "Y", "mode": "NOT_A_MODE", "success_definition": "z"}
    no_sd = {"title": "Z", "mode": Mode.COERCION.value, "success_definition": ""}
    import json
    llm = _FakeLLM(json.dumps([good, bad_mode, no_sd]))
    out = asyncio.run(extract_candidates("src", llm))
    assert len(out) == 1 and out[0]["title"] == "X"


def test_audit_hash_deterministic_and_tamper_sensitive():
    a = _hash("PREV", "run1", "scan.created", "operator", '{"k":1}', "2026-06-12T00:00:00")
    b = _hash("PREV", "run1", "scan.created", "operator", '{"k":1}', "2026-06-12T00:00:00")
    c = _hash("PREV", "run1", "scan.created", "operator", '{"k":2}', "2026-06-12T00:00:00")  # changed detail
    assert a == b and a != c and len(a) == 64
