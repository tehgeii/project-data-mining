import json

import pandas as pd
import pytest

from zzzgacha.config import normalize_gacha_type
from zzzgacha.importers import anonymize, parse_json_bytes, to_uigf
from zzzgacha.records import RecordError, annotate, current_states, to_dataframe

_next_id = [1000]


def item(gacha_type=2, rank=2, name="Item B", uid="1"):
    _next_id[0] += 1
    return {"uid": uid, "id": str(_next_id[0]), "gacha_type": str(gacha_type), "rank_type": str(rank),
            "name": name, "item_type": "Agents", "time": "2026-01-01 00:00:00"}


def test_normalize_gacha_type():
    assert normalize_gacha_type(2001) == 2
    assert normalize_gacha_type("3001") == 3
    assert normalize_gacha_type(102) == 102


def test_filters_out_standard_and_bangboo():
    df = to_dataframe([item(1), item(5), item(2), item(3), item(2001)])
    assert sorted(df["gacha_type"].tolist()) == [2, 2, 3]


def test_sorted_and_deduplicated():
    a, b = item(), item()
    df = to_dataframe([b, a, a])
    assert df["id"].tolist() == [int(a["id"]), int(b["id"])]


def test_pity_and_5050_tracking():
    items = [item() for _ in range(9)] + [item(rank=4, name="Grace")]  # kalah 50/50 di pity 10
    items += [item() for _ in range(4)] + [item(rank=4, name="Limited Agent")]  # guaranteed di pity 5
    items += [item() for _ in range(3)]
    df = annotate(to_dataframe(items))
    s = df[df["is_s"] == 1]
    assert s["pity"].tolist() == [10, 5]
    assert s["featured"].tolist() == [0.0, 1.0]
    assert s["guaranteed"].tolist() == [0, 1]
    assert s["first_segment"].tolist() == [1, 0]
    [state] = current_states(df)
    assert state.pity == 3 and state.guaranteed is False and state.s_count == 2


def test_state_right_after_losing_5050():
    df = annotate(to_dataframe([item(), item(rank=4, name="Rina")]))
    [state] = current_states(df)
    assert state.pity == 0 and state.guaranteed is True


def test_pity_is_separate_per_banner_and_account():
    items = [item(2) for _ in range(5)] + [item(3) for _ in range(7)] + [item(2, uid="2") for _ in range(2)]
    states = {(s.banner, s.total_pulls) for s in current_states(annotate(to_dataframe(items)))}
    assert states == {("agent", 5), ("wengine", 7), ("agent", 2)}


def test_no_s_marks_incomplete():
    [state] = current_states(annotate(to_dataframe([item() for _ in range(3)])))
    assert state.may_be_incomplete


def test_over_hard_pity_rejected():
    with pytest.raises(RecordError):
        annotate(to_dataframe([item(3) for _ in range(81)]))


@pytest.mark.parametrize("bad", [[{"id": "x"}], ["string"], [{"gacha_type": "2", "rank_type": "4"}]])
def test_bad_items_rejected(bad):
    with pytest.raises(RecordError):
        to_dataframe(bad)


def test_unknown_rank_rejected():
    with pytest.raises(RecordError):
        to_dataframe([item(rank=9)])


def test_uigf_roundtrip():
    df = to_dataframe([item() for _ in range(5)] + [item(3, rank=4, name="Steel Cushion")])
    parsed = to_dataframe(parse_json_bytes(to_uigf(df)))
    pd.testing.assert_frame_equal(df, parsed)


@pytest.mark.parametrize(
    "payload",
    [
        {"info": {}, "nap": [{"uid": "9", "list": [item()]}]},
        {"retcode": 0, "data": {"list": [item()]}},
        {"uid": "9", "list": [item()]},
        [item()],
    ],
)
def test_supported_json_shapes(payload):
    assert len(to_dataframe(parse_json_bytes(json.dumps(payload).encode()))) == 1


@pytest.mark.parametrize(
    "raw,msg",
    [
        (b"not json", "JSON"),
        (b'{"hk4e": []}', "Genshin"),
        (b'{"foo": 1}', "tidak dikenali"),
        (b'{"nap": {}}', "nap"),
        (b'{"nap": [{"uid": 1}]}', "list"),
    ],
)
def test_invalid_files(raw, msg):
    with pytest.raises(RecordError, match=msg):
        parse_json_bytes(raw)


def test_file_size_limit():
    with pytest.raises(RecordError, match="terlalu besar"):
        parse_json_bytes(b" " * (20 * 1024 * 1024 + 1))


def test_anonymize_removes_identity():
    df = annotate(to_dataframe([item(uid="123456789") for _ in range(3)]))
    anon = anonymize(df)
    assert "uid" not in anon.columns and "name" not in anon.columns and "time" not in anon.columns
    assert "123456789" not in anon.to_csv()
    assert anon["account"].nunique() == 1
