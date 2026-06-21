"""Seed the PAP + beam-TAP live-lane techniques into the catalog (mirrors seed_providers.py).

Makes the persuasion + adaptive-search capabilities SELECTABLE by cloning a small allowlist of base
techniques into provider variants (setting `provider` so the runner routes turns to PapProvider/TapProvider
and the UCB selector can pick them for the same objectives). Idempotent. Deliberately SMALL (Codex review
I4): the selector's cold arms sort above exploited arms (selection.COLD_BASE=10), so flooding it with every
PAP×base combination would hijack the early budget. Personas are NOT crossed here — the runner already
crosses personas. `unseed_persuasion` removes exactly what was seeded (clean removal / pluggability).
"""
from __future__ import annotations

# (base technique slug, provider name, variant title) — curated collection-relevant levers only.
VARIANTS = [
    ("crescendo",    "pap-authority", "Crescendo + authority-endorsement persuasion"),
    ("crescendo",    "pap-urgency",   "Crescendo + scarcity/urgency persuasion"),
    ("crescendo",    "pap-fear",      "Crescendo + fear/consequence framing"),
    ("actor-attack", "pap-rapport",   "Actor-Attack + liking/rapport persuasion"),
    ("crescendo",    "tap",           "Crescendo + beam-TAP adaptive search"),
]


def variants_for(enable_pap: bool, enable_tap: bool) -> list[tuple]:
    """The subset to seed under the lane flags (flags gate selectability without removing code)."""
    out = []
    for base, provider, title in VARIANTS:
        if provider.startswith("pap-") and not enable_pap:
            continue
        if provider == "tap" and not enable_tap:
            continue
        out.append((base, provider, title))
    return out


async def seed_persuasion(session) -> list[str]:
    """Create the PAP/TAP provider-variant techniques + their objective mappings. Returns slugs created."""
    from sqlmodel import select

    from .config import get_settings
    from .models import ObjectiveTechniqueMap, Technique

    s = get_settings()
    created: list[str] = []
    for base_slug, provider, title in variants_for(s.enable_pap, s.enable_tap):
        new_slug = f"{base_slug}-{provider}"
        base = (await session.execute(select(Technique).where(Technique.slug == base_slug))).scalars().first()
        if base is None:
            continue
        if (await session.execute(select(Technique).where(Technique.slug == new_slug))).scalars().first():
            continue
        session.add(Technique(
            slug=new_slug, title=title, technique_class=base.technique_class, provider=provider,
            strategy=base.strategy, phase_plan=base.phase_plan, applicable_modes=base.applicable_modes,
            modifiers=base.modifiers, provenance=(base.provenance or "") + "|persuasion", status="active",
        ))
        links = (await session.execute(
            select(ObjectiveTechniqueMap).where(ObjectiveTechniqueMap.technique_slug == base_slug))).scalars().all()
        for lk in links:
            session.add(ObjectiveTechniqueMap(objective_slug=lk.objective_slug, technique_slug=new_slug,
                                              modifiers=lk.modifiers))
        created.append(new_slug)
    await session.commit()
    return created


async def unseed_persuasion(session) -> list[str]:
    """Remove exactly the seeded variants + their objective maps (clean removal / pluggability)."""
    from sqlmodel import delete, select

    from .models import ObjectiveTechniqueMap, Technique

    removed: list[str] = []
    for base_slug, provider, _title in VARIANTS:
        new_slug = f"{base_slug}-{provider}"
        if (await session.execute(select(Technique).where(Technique.slug == new_slug))).scalars().first() is None:
            continue
        await session.execute(delete(ObjectiveTechniqueMap).where(
            ObjectiveTechniqueMap.technique_slug == new_slug))
        await session.execute(delete(Technique).where(Technique.slug == new_slug))
        removed.append(new_slug)
    await session.commit()
    return removed
