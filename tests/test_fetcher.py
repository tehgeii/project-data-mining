import pytest
import requests

from zzzgacha import fetcher
from zzzgacha.fetcher import FetchError, build_api_url, fetch_history, parse_gacha_url

GOOD = (
    "https://public-operation-nap-sg.hoyoverse.com/common/gacha_record/api/getGachaLog"
    "?authkey_ver=1&sign_type=2&authkey=SECRET%2Bkey&game_biz=nap_global&lang=id-id&real_gacha_type=1&end_id=5"
)


def test_parse_valid_url_and_overrides():
    host, params = parse_gacha_url("salin ini: " + GOOD + "  ")
    assert host == fetcher.API_HOST_GLOBAL
    assert params["authkey"] == "SECRET+key"
    assert "real_gacha_type" not in params and "end_id" not in params and "lang" not in params
    url = build_api_url(host, params, 2, "0")
    assert "real_gacha_type=2" in url and "lang=en-us" in url and "size=20" in url
    assert url.startswith("https://public-operation-nap-sg.hoyoverse.com/common/gacha_record/api/getGachaLog?")


def test_webview_url_with_fragment():
    host, params = parse_gacha_url(
        "https://gs.hoyoverse.com/nap/event/e20230424gacha/index.html#/log?authkey=abc&game_biz=nap_global"
    )
    assert host == fetcher.API_HOST_GLOBAL and params["authkey"] == "abc"


def test_cn_server():
    host, _ = parse_gacha_url("https://public-operation-nap.mihoyo.com/x/getGachaLog?authkey=a&game_biz=nap_cn")
    assert host == fetcher.API_HOST_CN


@pytest.mark.parametrize(
    "text",
    [
        "",
        "tidak ada url",
        "http://public-operation-nap-sg.hoyoverse.com/getGachaLog?authkey=a",
        "https://evil.com/getGachaLog?authkey=a",
        "https://hoyoverse.com.evil.com/getGachaLog?authkey=a",
        "https://evilhoyoverse.com/getGachaLog?authkey=a",
        "https://public-operation-nap-sg.hoyoverse.com/getGachaLog?foo=1",
        "https://public-operation-hk4e-sg.hoyoverse.com/getGachaLog?authkey=a&game_biz=hk4e_global",
    ],
)
def test_rejected_urls(text):
    with pytest.raises(FetchError):
        parse_gacha_url(text)


def test_disallowed_api_host():
    with pytest.raises(FetchError):
        build_api_url("evil.com", {}, 2, "0")


class FakeResponse:
    def __init__(self, payload, status=200):
        self.payload, self.status_code = payload, status

    def json(self):
        if isinstance(self.payload, Exception):
            raise self.payload
        return self.payload


class FakeSession:
    """Server palsu: tiap real_gacha_type punya daftar item sendiri."""

    def __init__(self, data, fail_types=(), errors=None):
        self.data, self.fail_types, self.errors = data, set(fail_types), list(errors or [])
        self.calls = []

    def get(self, url, timeout):
        from urllib.parse import parse_qs, urlsplit

        assert timeout == fetcher.REQUEST_TIMEOUT
        q = {k: v[0] for k, v in parse_qs(urlsplit(url).query).items()}
        self.calls.append(q)
        if self.errors:
            err = self.errors.pop(0)
            if isinstance(err, Exception):
                raise err
            return err
        gtype = int(q["real_gacha_type"])
        if gtype in self.fail_types:
            return FakeResponse({"retcode": -1, "message": "invalid gacha type"})
        items = self.data.get(gtype, [])  # urut terbaru -> terlama, seperti API asli
        end_id = int(q["end_id"])
        if end_id:
            items = [i for i in items if int(i["id"]) < end_id]
        return FakeResponse({"retcode": 0, "data": {"list": items[: int(q["size"])]}})


def make_items(gtype, n, start):
    return [
        {"id": str(start + n - k), "gacha_type": f"{gtype}001", "rank_type": "2", "name": "B", "uid": "1"}
        for k in range(n)
    ]


def test_fetch_paginates_all_types():
    data = {2: make_items(2, 45, 1000), 3: make_items(3, 20, 5000), 102: make_items(2, 3, 9000)}
    session = FakeSession(data)
    items = fetch_history(GOOD, session=session, sleep=lambda s: None)
    assert len(items) == 45 + 20 + 3
    by_type = {}
    for i in items:
        by_type[i["gacha_type"]] = by_type.get(i["gacha_type"], 0) + 1
    assert by_type == {"2": 45, "3": 20, "102": 3}
    assert all(c["authkey"] == "SECRET+key" for c in session.calls)


def test_rerun_banner_failure_is_skipped_but_main_is_not():
    data = {2: make_items(2, 5, 1000), 3: make_items(3, 5, 2000)}
    items = fetch_history(GOOD, session=FakeSession(data, fail_types={102, 103}), sleep=lambda s: None)
    assert len(items) == 10
    with pytest.raises(FetchError):
        fetch_history(GOOD, session=FakeSession(data, fail_types={3}), sleep=lambda s: None)


@pytest.mark.parametrize("retcode,msg", [(-101, "kedaluwarsa"), (-100, "tidak valid"), (-110, "Terlalu sering"), (-5, "retcode -5")])
def test_retcode_messages(retcode, msg):
    session = FakeSession({}, errors=[FakeResponse({"retcode": retcode})])
    with pytest.raises(FetchError, match=msg):
        fetch_history(GOOD, session=session, sleep=lambda s: None)


def test_retries_network_errors_and_hides_url():
    err = requests.ConnectionError("failed for " + GOOD)
    session = FakeSession({}, errors=[err] * 5)
    with pytest.raises(FetchError) as info:
        fetch_history(GOOD, session=session, sleep=lambda s: None)
    assert "SECRET" not in str(info.value) and "authkey" not in str(info.value)
    assert len(session.calls) == fetcher.MAX_RETRIES


def test_recovers_after_transient_error():
    data = {2: make_items(2, 3, 1000)}
    session = FakeSession(data, errors=[FakeResponse({}, status=503)])
    items = fetch_history(GOOD, session=session, sleep=lambda s: None)
    assert len(items) == 3


def test_non_json_response():
    session = FakeSession({}, errors=[FakeResponse(ValueError("bad"))] * 3)
    with pytest.raises(FetchError, match="bukan JSON"):
        fetch_history(GOOD, session=session, sleep=lambda s: None)


def test_http_error_status():
    session = FakeSession({}, errors=[FakeResponse({}, status=403)])
    with pytest.raises(FetchError, match="403"):
        fetch_history(GOOD, session=session, sleep=lambda s: None)
