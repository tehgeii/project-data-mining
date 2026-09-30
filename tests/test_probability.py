import numpy as np
import pytest

from zzzgacha import probability as P
from zzzgacha.config import AGENT, BANNERS, WENGINE
from zzzgacha.simulate import simulate_banner


@pytest.mark.parametrize("banner", BANNERS.values(), ids=lambda b: b.key)
def test_consolidated_rate_matches_official(banner):
    assert P.expected_pulls_per_s(banner) == pytest.approx(1 / banner.consolidated_rate, rel=1e-9)


@pytest.mark.parametrize("banner", BANNERS.values(), ids=lambda b: b.key)
def test_hazard_shape(banner):
    h = P.hazard(banner)
    assert len(h) == banner.hard_pity
    assert h[-1] == 1.0
    assert np.all(h[: banner.soft_pity_start - 1] == banner.base_rate)
    assert np.all(np.diff(h) >= 0)  # tidak pernah turun
    assert np.all((h > 0) & (h <= 1))


@pytest.mark.parametrize("pity", [0, 30, 73, 89])
def test_next_s_distribution_sums_to_one(pity):
    dist = P.next_s_distribution(AGENT, pity)
    assert dist.sum() == pytest.approx(1.0)
    assert len(dist) == AGENT.hard_pity - pity


def test_featured_cdf_reaches_one_at_worst_case():
    for banner in BANNERS.values():
        for guaranteed in (False, True):
            worst = P.worst_case_pulls_for_featured(banner, 0, guaranteed)
            cdf = P.featured_cdf(banner, 0, guaranteed, worst)
            assert cdf[-1] == pytest.approx(1.0)
            assert cdf[-2] < 1.0
            assert np.all(np.diff(cdf) >= -1e-12)


def test_guaranteed_equals_any_s():
    # Kalau sudah guaranteed, S pertama pasti rate-up.
    any_s = np.cumsum(P.next_s_distribution(WENGINE, 20))
    cdf = P.featured_cdf(WENGINE, 20, True, len(any_s))
    np.testing.assert_allclose(cdf, any_s)


def test_expected_featured_pulls_formula():
    # E[rate-up] = E[S] * (1 + (1 - w)) dari pity 0 tanpa guaranteed.
    for banner in BANNERS.values():
        e = P.expected_pulls_per_s(banner)
        expected = e * (2 - banner.featured_rate)
        assert P.expected_pulls_for_featured(banner, 0, False) == pytest.approx(expected)


def test_markov_matches_monte_carlo():
    rng = np.random.default_rng(0)
    sim = simulate_banner(AGENT, 400_000, rng)
    rate = sim["is_s"].mean()
    assert rate == pytest.approx(AGENT.consolidated_rate, rel=0.03)
    s = sim["featured"][~np.isnan(sim["featured"])]
    # proporsi S rate-up total = 1 / (2 - w)
    assert s.mean() == pytest.approx(1 / (2 - AGENT.featured_rate), abs=0.02)


def test_pulls_for_confidence_monotonic():
    a = P.pulls_for_confidence(AGENT, 0, False, 0.5)
    b = P.pulls_for_confidence(AGENT, 0, False, 0.9)
    assert 1 <= a < b <= 180
    assert P.pulls_for_confidence(AGENT, 89, True, 1.0) == 1


@pytest.mark.parametrize("bad", [-1, 90, 1000])
def test_invalid_pity_rejected(bad):
    with pytest.raises(ValueError):
        P.next_s_distribution(AGENT, bad)


def test_non_integer_pity_rejected():
    with pytest.raises(TypeError):
        P.featured_cdf(AGENT, 1.5, False, 10)
    with pytest.raises(TypeError):
        P.featured_cdf(AGENT, True, False, 10)


def test_polychrome_conversion():
    assert P.polychrome_to_pulls(1600, 3) == 13
    assert P.polychrome_to_pulls(159) == 0
    with pytest.raises(ValueError):
        P.polychrome_to_pulls(-1)
