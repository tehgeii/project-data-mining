import plotly.graph_objects as go
import streamlit as st

from zzzgacha import probability as P
from zzzgacha.config import BANNERS
from zzzgacha.records import current_states, s_history
from zzzgacha.ui import banner_picker, get_annotated, pct

st.title("📊 Statistik Riwayat")

annotated = get_annotated()
if annotated is None:
    st.info("Belum ada riwayat. Import data dulu (bisa juga pakai data contoh).")
    st.page_link("app_pages/import_data.py", label="Ke halaman Import Data", icon="📥")
    st.stop()

key = banner_picker("hist_banner")
banner = BANNERS[key]
data = annotated[annotated["banner"] == key]
if data.empty:
    st.info(f"Tidak ada pull di {banner.label}.")
    st.stop()

uids = sorted(data["uid"].unique())
if len(uids) > 1:
    uid = st.selectbox("Akun (UID)", uids)
    data = data[data["uid"] == uid]

s_rows = data[data["is_s"] == 1]
# 50/50 hanya dihitung untuk S yang didapat saat TIDAK guaranteed, dan bukan
# di segmen pertama (status guaranteed di awal riwayat tidak diketahui).
coin = s_rows[(s_rows["guaranteed"] == 0) & (s_rows["first_segment"] == 0)]
complete = s_rows[s_rows["first_segment"] == 0]

c1, c2 = st.columns(2)
c1.metric("Total pull", f"{len(data):,}")
c2.metric("Jumlah S", f"{len(s_rows)}")
c3, c4 = st.columns(2)
avg_pity = complete["pity"].mean() if len(complete) else None
c3.metric(
    "Rata-rata pity per S",
    f"{avg_pity:.1f}" if avg_pity is not None else "-",
    delta=f"{P.expected_pulls_per_s(banner) - avg_pity:+.1f} vs rata-rata teori" if avg_pity is not None else None,
    help="Hijau = lebih hoki dari rata-rata teori (butuh lebih sedikit pull).",
)
coin_label = "50/50" if key == "agent" else "75/25"
win_label = f"Menang {coin_label}"
c4.metric(win_label, f"{int(coin['featured'].sum())}/{len(coin)}" if len(coin) else "-",
          help=f"Peluang teori {pct(banner.featured_rate, 0)}.")

for state in current_states(data):
    st.info(
        f"Pity sekarang: **{state.pity}** / {banner.hard_pity}"
        + (" · S berikutnya **pasti rate-up**" if state.guaranteed else "")
        + f" · peluang S di pull berikutnya {pct(P.s_chance_at_pity(banner, state.pity + 1), 2)}"
    )

if len(s_rows):
    fig = go.Figure()
    colors = ["#3FB950" if f == 1 else "#F85149" for f in s_rows["featured"]]
    fig.add_trace(go.Bar(x=list(range(1, len(s_rows) + 1)), y=s_rows["pity"], marker_color=colors,
                         customdata=s_rows["name"], hovertemplate="%{customdata}<br>pity %{y}<extra></extra>"))
    fig.add_hline(y=P.expected_pulls_per_s(banner), line_dash="dash", line_color="#C9D1D9", annotation_text="rata-rata teori", annotation_position="bottom left")
    fig.add_hline(y=banner.soft_pity_start, line_dash="dot", line_color="#F5A623", annotation_text="soft pity", annotation_position="top left")
    fig.update_layout(title=f"Pity setiap S (hijau = rate-up, merah = kalah {coin_label})", xaxis_title="S ke-",
                      yaxis_title="Pity", xaxis_dtick=1, height=340, margin=dict(l=10, r=10, t=50, b=10), yaxis_range=[0, banner.hard_pity])
    st.plotly_chart(fig, config={"displayModeBar": False})
    table = s_history(data).rename(
        columns={"time": "Waktu", "banner": "Banner", "name": "Nama", "pity": "Pity", "hasil": "Hasil"}
    )
    table["Banner"] = banner.label.split(" (")[0]
    st.dataframe(table, hide_index=True)

st.caption(
    "Server hanya menyimpan riwayat beberapa bulan terakhir, jadi pity S pertama yang tercatat bisa "
    "tidak lengkap. S pertama itu tidak dihitung di rata-rata pity dan statistik 50/50."
)
