"""Raw-PII-free containment & redaction (roadmap P2, decision 18 / ADR 0018).

The one-way door: **raw real PII is never persisted anywhere.** When a detector (Presidio, plus the
Indian-identifier recognizers) flags spans in inbound/transcript text, this module produces a
**redacted view** — typed tokens + stable field IDs + per-entity hashes + pre/post linkage — and
**drops the raw content**. What survives is reconstructable for audit (you can prove *what kind* of
PII was disclosed, and link a finding to it by hash) but never exposes the raw value.

A fail-closed **EmissionGate** blocks report emission when any unresolved/unknown PII remains, without
ever mutating or blocking evidence *capture* of synthetic/cleared transcripts.

Pure logic: the detector is injected (this module never calls Presidio), so it unit-tests standalone.
"""
from __future__ import annotations

import hashlib
from dataclasses import dataclass, field
from typing import Optional


@dataclass(frozen=True)
class PiiSpan:
    """A detector hit. `entity_type` is the recognizer label (e.g. AADHAAR, PAN, PHONE, PERSON).
    `resolved=False` marks a low-confidence/unknown hit that must fail emission closed."""

    start: int
    end: int
    entity_type: str
    resolved: bool = True


def value_hash(value: str, *, salt: str = "") -> str:
    """Per-entity hash — proves two findings reference the same raw value without storing it."""
    return hashlib.sha256((salt + "\x1f" + value).encode("utf-8")).hexdigest()


@dataclass(frozen=True)
class RedactionToken:
    token: str            # the inline replacement, e.g. "[PII:AADHAAR:f3]"
    entity_type: str
    field_id: str         # stable id within this view
    value_hash: str       # sha256 of the raw value (raw itself is dropped)
    start: int            # pre-redaction span (linkage), end-exclusive
    end: int
    resolved: bool


@dataclass
class Containment:
    """Raw-PII-free result: redacted text + token metadata ONLY. Holds NO raw PII. `has_unresolved`
    drives the fail-closed emission gate."""

    redacted_text: str
    tokens: list = field(default_factory=list)

    @property
    def has_unresolved(self) -> bool:
        return any(not t.resolved for t in self.tokens)


def contain(text: str, spans: list, *, salt: str = "") -> Containment:
    """Replace each detected span with a typed token and DROP the raw value. Returns a raw-PII-free
    Containment (redacted text + tokens carrying type/field-id/hash/linkage — never the raw value).

    Overlapping spans are resolved by taking the earliest start; spans are applied right-to-left so
    offsets stay valid. The returned `start/end` are pre-redaction offsets (audit linkage)."""
    ordered = sorted(spans, key=lambda s: (s.start, -s.end))
    # drop overlaps (keep the first by start)
    picked: list = []
    last_end = -1
    for s in ordered:
        if s.start >= last_end:
            picked.append(s)
            last_end = s.end

    tokens: list = []
    out = text
    for i, s in enumerate(picked):
        field_id = f"f{i}"
        raw = text[s.start:s.end]
        token = f"[PII:{s.entity_type}:{field_id}]"
        tokens.append(RedactionToken(token=token, entity_type=s.entity_type, field_id=field_id,
                                     value_hash=value_hash(raw, salt=salt),
                                     start=s.start, end=s.end, resolved=s.resolved))
    # apply replacements right-to-left so earlier offsets remain valid
    for s, t in sorted(zip(picked, tokens), key=lambda p: -p[0].start):
        out = out[:s.start] + t.token + out[s.end:]
    return Containment(redacted_text=out, tokens=tokens)


class EmissionGate:
    """Fail-closed: a report/view may be emitted only if its containment has no unresolved PII.
    Never touches evidence capture — only gates the OUTBOUND artifact."""

    @staticmethod
    def can_emit(containment: Containment) -> tuple[bool, str]:
        if containment.has_unresolved:
            unresolved = [t.entity_type for t in containment.tokens if not t.resolved]
            return False, f"unresolved/unknown PII blocks emission: {', '.join(sorted(set(unresolved)))}"
        return True, "ok"


def detect_indian_pii(text: str) -> list:
    """Detector adapter over the repo's existing Indian-PII patterns (oracle.detectors._PII): Aadhaar,
    PAN, phone, UPI, IFSC. Returns offset-bearing `PiiSpan`s ready for `contain()`. This is the
    no-new-dependency detector; a Presidio backend (Devanagari / romanized names / addresses) plugs in
    behind the same `list[PiiSpan]` contract. Lazy import keeps this module pure for standalone tests."""
    import re

    from .oracle.detectors import _PII

    spans: list = []
    for name, pat in _PII.items():
        for m in re.finditer(pat, text or ""):
            spans.append(PiiSpan(m.start(), m.end(), name.upper(), resolved=True))
    return spans


def contain_text(text: str, *, detector=detect_indian_pii, salt: str = "") -> Containment:
    """Convenience: detect PII in `text` with `detector`, then contain it raw-PII-free."""
    return contain(text, detector(text), salt=salt)
