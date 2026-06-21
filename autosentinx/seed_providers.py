"""Seed DSL/GPTFuzz provider-variant techniques into the catalog (P5/P6).

Routing techniques to attack providers (technique.provider → provider.get_provider) is wired; this
makes the capability *selectable* by adding catalog techniques that route through the DSL/GPTFuzz
providers. Each variant CLONES a base technique (its strategy/phase_plan/modes) and its objective
mappings, setting `provider` — so the UCB selector can pick it for the same objectives and the runner
drives turns through the DSL transform. Idempotent: skips variants that already exist.
"""
from __future__ import annotations

# (base technique slug, provider, slug suffix, title)
VARIANTS = [
    ("crescendo",    "dsl-phonetic",   "phonetic",   "Crescendo + Hinglish phonetic perturbation"),
    ("crescendo",    "dsl-sandwich",   "sandwich",   "Crescendo + code-switch sandwich"),
    ("actor-attack", "dsl-codeswitch", "codeswitch", "Actor-Attack + Hinglish code-switch"),
    ("crescendo",    "gptfuzz",        "fuzz",       "Crescendo + GPTFuzz mutation lane"),
]


async def seed_provider_variants(session) -> list[str]:
    """Create the DSL/GPTFuzz provider-variant techniques + their objective mappings. Returns the slugs
    created (empty if all already present)."""
    from sqlmodel import select

    from .models import ObjectiveTechniqueMap, Technique

    created: list[str] = []
    for base_slug, provider, suffix, title in VARIANTS:
        new_slug = f"{base_slug}-{suffix}"
        base = (await session.execute(select(Technique).where(Technique.slug == base_slug))).scalars().first()
        if base is None:
            continue
        if (await session.execute(select(Technique).where(Technique.slug == new_slug))).scalars().first():
            continue
        session.add(Technique(
            slug=new_slug, title=title, technique_class=base.technique_class, provider=provider,
            strategy=base.strategy, phase_plan=base.phase_plan, applicable_modes=base.applicable_modes,
            modifiers=base.modifiers, provenance=(base.provenance or "") + "|dsl", status="active",
        ))
        links = (await session.execute(
            select(ObjectiveTechniqueMap).where(ObjectiveTechniqueMap.technique_slug == base_slug))).scalars().all()
        for lk in links:
            session.add(ObjectiveTechniqueMap(objective_slug=lk.objective_slug, technique_slug=new_slug,
                                              modifiers=lk.modifiers))
        created.append(new_slug)
    await session.commit()
    return created
