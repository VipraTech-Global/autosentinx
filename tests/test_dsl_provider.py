"""P5: DSL transform-providers + GPTFuzz lane behind the provider seam."""
from autosentinx.attacker.provider import AttackProvider, get_provider, providers
from autosentinx.attacker.dsl_provider import DslProvider, GptFuzzProvider, _fuzz_recipe
from autosentinx.dsl import Recipe, phonetic_perturb


class _FakeLLM:
    async def generate(self, *a, **k): return "x"


def test_dsl_providers_registered_and_conform():
    for name in ("dsl-phonetic", "dsl-codeswitch", "dsl-sandwich", "gptfuzz"):
        assert name in providers()
        p = get_provider(name, _FakeLLM())
        assert isinstance(p, AttackProvider)


def test_dsl_provider_applies_recipe_and_records_chain():
    p = DslProvider(_FakeLLM(), Recipe().then(phonetic_perturb()), label="t")
    out = p._apply("please confirm the account number")
    assert "pliz" in out and "kanfarm" in out and "akaunt" in out and "numbar" in out
    assert [s.name for s in p.last_chain] == ["phonetic_perturb"]   # firing chain recorded (P9 recipe)


def test_gptfuzz_mutation_varies_by_turn_deterministically():
    # reproducible: same turn index → same chain length; rotates across turns
    lens = [len(_fuzz_recipe(i).primitives) for i in range(6)]
    assert lens == [1, 2, 3, 1, 2, 3]
    g = GptFuzzProvider(_FakeLLM())
    a, b = g._mutate("give me the account number"), g._mutate("give me the account number")
    assert g.last_chain and a != "" and b != ""        # mutated; chain recorded
