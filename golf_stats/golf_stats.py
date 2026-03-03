"""
Golf Stats Dashboard
Reads from SQLite (golf_stats.db). Run data_pipeline.py first to populate the DB.
Launch: streamlit run golf_stats/golf_stats.py
"""

import sqlite3
from pathlib import Path

import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
import streamlit as st

# ─── Config ───────────────────────────────────────────────────────────────────
DB_PATH = Path(__file__).parent / "golf_stats.db"

st.set_page_config(
    page_title="Golf Stats",
    page_icon="⛳",
    layout="wide",
    initial_sidebar_state="expanded",
)

# ─── Data Loading ─────────────────────────────────────────────────────────────

@st.cache_data(ttl=300)
def load_holes():
    conn = sqlite3.connect(DB_PATH)
    df = pd.read_sql(
        """
        SELECT
            h.*,
            r.date, r.course_name, r.source,
            r.total_score, r.handicap_differential
        FROM holes h
        JOIN rounds r ON h.round_id = r.round_id
        """,
        conn,
        parse_dates=["date"],
    )
    conn.close()
    return df


@st.cache_data(ttl=300)
def load_rounds():
    conn = sqlite3.connect(DB_PATH)
    df = pd.read_sql("SELECT * FROM rounds", conn, parse_dates=["date"])
    conn.close()
    return df


def check_db():
    if not DB_PATH.exists():
        st.error(
            f"Database not found at `{DB_PATH}`. "
            "Run `python data_pipeline.py` first to build it."
        )
        st.stop()


check_db()

# ─── Sidebar Filters ──────────────────────────────────────────────────────────

with st.sidebar:
    st.title("⛳ Golf Stats")
    st.markdown("---")

    holes_all = load_holes()
    rounds_all = load_rounds()

    sources = ["All"] + sorted(holes_all["source"].dropna().unique().tolist())
    sel_source = st.selectbox("Data Source", sources)

    courses = ["All"] + sorted(holes_all["course_name"].dropna().unique().tolist())
    sel_course = st.selectbox("Course", courses)

    min_date = holes_all["date"].min()
    max_date = holes_all["date"].max()
    date_range = st.date_input("Date Range", value=(min_date, max_date))

    par_opts = ["All", "Par 3", "Par 4", "Par 5"]
    sel_par = st.selectbox("Par Type", par_opts)

    st.markdown("---")
    st.caption(f"DB: {DB_PATH.name}")


def apply_filters(df):
    out = df.copy()
    if sel_source != "All":
        out = out[out["source"] == sel_source]
    if sel_course != "All":
        out = out[out["course_name"] == sel_course]
    if len(date_range) == 2:
        out = out[
            (out["date"] >= pd.Timestamp(date_range[0]))
            & (out["date"] <= pd.Timestamp(date_range[1]))
        ]
    if sel_par != "All":
        par_num = int(sel_par.split()[-1])
        out = out[out["par"] == par_num]
    return out


# ─── Tabs ─────────────────────────────────────────────────────────────────────

tab_analytics, tab_caddie = st.tabs(["📊 Analytics", "🎯 Caddie"])

# ══════════════════════════════════════════════════════════════════════════════
# TAB 1: ANALYTICS
# ══════════════════════════════════════════════════════════════════════════════

with tab_analytics:

    df = apply_filters(holes_all)

    if df.empty:
        st.warning("No data for the selected filters.")
        st.stop()

    # ── KPI Cards ──────────────────────────────────────────────────────────────
    rounds_df = load_rounds()
    if sel_source != "All":
        rounds_df = rounds_df[rounds_df["source"] == sel_source]
    if sel_course != "All":
        rounds_df = rounds_df[rounds_df["course_name"] == sel_course]
    if len(date_range) == 2:
        rounds_df = rounds_df[
            (rounds_df["date"] >= pd.Timestamp(date_range[0]))
            & (rounds_df["date"] <= pd.Timestamp(date_range[1]))
        ]

    driving_df = df[df["par"] != 3].copy()
    driving_df["fw_hit"] = (driving_df["fairway_hit"] == "Hit").astype(int)
    gir_pct = (df["green_status"] == "Hit").mean() * 100
    fw_pct = driving_df["fw_hit"].mean() * 100 if not driving_df.empty else 0
    avg_putts = df["putts"].mean()
    avg_score_rel = df["score_relative"].mean()

    k1, k2, k3, k4, k5 = st.columns(5)
    k1.metric("Rounds", len(rounds_df))
    k2.metric("Fairway %", f"{fw_pct:.1f}%")
    k3.metric("GIR %", f"{gir_pct:.1f}%")
    k4.metric("Avg Putts/Hole", f"{avg_putts:.2f}")
    k5.metric("Avg Score vs Par", f"{avg_score_rel:+.2f}" if not pd.isna(avg_score_rel) else "—")

    st.markdown("---")

    # ── Scoring Distribution ───────────────────────────────────────────────────
    st.subheader("Scoring Distribution")

    score_labels = {
        -2: "Eagle", -1: "Birdie", 0: "Par", 1: "Bogey", 2: "Double+",
    }
    dist_df = df.dropna(subset=["score_relative"]).copy()
    dist_df["label"] = dist_df["score_relative"].apply(
        lambda x: score_labels.get(int(x), "Double+" if x >= 2 else "Other")
    )
    label_order = ["Eagle", "Birdie", "Par", "Bogey", "Double+"]
    dist_counts = dist_df["label"].value_counts().reindex(label_order, fill_value=0).reset_index()
    dist_counts.columns = ["Score Type", "Count"]
    dist_counts["Pct"] = (dist_counts["Count"] / dist_counts["Count"].sum() * 100).round(1)

    color_map = {
        "Eagle": "#f59e0b", "Birdie": "#10b981", "Par": "#3b82f6",
        "Bogey": "#f97316", "Double+": "#ef4444",
    }
    fig_dist = px.bar(
        dist_counts, x="Score Type", y="Count",
        color="Score Type", color_discrete_map=color_map,
        text="Pct", labels={"Count": "Holes"},
        title="Scoring Distribution",
    )
    fig_dist.update_traces(texttemplate="%{text:.1f}%", textposition="outside")
    fig_dist.update_layout(showlegend=False, yaxis_title="Holes")
    st.plotly_chart(fig_dist, use_container_width=True)

    # ── Scoring Over Time ──────────────────────────────────────────────────────
    st.subheader("Score vs Par Trend (per Round)")

    round_scores = (
        df.groupby(["date", "course_name", "round_id"])["score_relative"]
        .mean()
        .reset_index()
        .sort_values("date")
    )
    round_scores["rolling"] = round_scores["score_relative"].rolling(5, min_periods=1).mean()
    fig_trend = go.Figure()
    fig_trend.add_trace(go.Scatter(
        x=round_scores["date"], y=round_scores["score_relative"],
        mode="markers", name="Round avg", opacity=0.5,
        marker=dict(size=7),
    ))
    fig_trend.add_trace(go.Scatter(
        x=round_scores["date"], y=round_scores["rolling"],
        mode="lines", name="5-round rolling avg",
        line=dict(width=2.5),
    ))
    fig_trend.add_hline(y=0, line_dash="dash", line_color="gray", annotation_text="Even par")
    fig_trend.update_layout(title="Score vs Par Trend", yaxis_title="+/- Par", xaxis_title="Date")
    st.plotly_chart(fig_trend, use_container_width=True)

    # ── Driving Accuracy ───────────────────────────────────────────────────────
    st.subheader("Driving Accuracy by Club")

    if not driving_df.empty:
        club_acc = (
            driving_df.groupby("tee_club")["fw_hit"]
            .agg(Hits="sum", Attempts="count")
            .reset_index()
        )
        club_acc["Accuracy (%)"] = (club_acc["Hits"] / club_acc["Attempts"] * 100).round(1)
        club_acc = club_acc.sort_values("Accuracy (%)", ascending=False)

        fig_acc = px.bar(
            club_acc, x="tee_club", y="Accuracy (%)",
            color="Accuracy (%)", color_continuous_scale="RdYlGn",
            text="Accuracy (%)", hover_data=["Hits", "Attempts"],
            title="Fairway Hit % by Tee Club",
        )
        fig_acc.update_traces(texttemplate="%{text:.1f}%", textposition="outside")
        fig_acc.update_layout(xaxis_title="Club", coloraxis_showscale=False)
        st.plotly_chart(fig_acc, use_container_width=True)

        # Par 4 vs Par 5 breakdown
        par45 = driving_df[driving_df["par"].isin([4, 5])].copy()
        if not par45.empty:
            par_acc = (
                par45.groupby(["tee_club", "par"])["fw_hit"]
                .agg(Hits="sum", Attempts="count")
                .reset_index()
            )
            par_acc["Accuracy (%)"] = (par_acc["Hits"] / par_acc["Attempts"] * 100).round(1)
            par_acc["Par"] = par_acc["par"].map({4: "Par 4", 5: "Par 5"})
            fig_par45 = px.bar(
                par_acc, x="tee_club", y="Accuracy (%)",
                color="Par", barmode="group", text="Accuracy (%)",
                color_discrete_sequence=["#3b82f6", "#10b981"],
                hover_data=["Hits", "Attempts"],
                title="Fairway % by Club: Par 4 vs Par 5",
            )
            fig_par45.update_traces(texttemplate="%{text:.1f}%", textposition="outside")
            st.plotly_chart(fig_par45, use_container_width=True)
    else:
        st.info("No driving data for the current filter selection.")

    # ── GIR & Miss Direction ───────────────────────────────────────────────────
    st.subheader("Greens in Regulation")

    col_gir1, col_gir2 = st.columns(2)

    with col_gir1:
        gir_by_par = (
            df.groupby("par")["green_status"]
            .apply(lambda x: (x == "Hit").mean() * 100)
            .reset_index()
        )
        gir_by_par.columns = ["Par", "GIR (%)"]
        gir_by_par["Par"] = gir_by_par["Par"].map({3: "Par 3", 4: "Par 4", 5: "Par 5"})
        fig_gir = px.bar(
            gir_by_par, x="Par", y="GIR (%)",
            color="GIR (%)", color_continuous_scale="Greens",
            title="GIR % by Par Type", text="GIR (%)",
        )
        fig_gir.update_traces(texttemplate="%{text:.1f}%", textposition="outside")
        fig_gir.update_layout(coloraxis_showscale=False)
        st.plotly_chart(fig_gir, use_container_width=True)

    with col_gir2:
        miss_df = df[df["green_status"].notna() & (df["green_status"] != "Hit")]
        if not miss_df.empty:
            miss_counts = miss_df["green_status"].value_counts().reset_index()
            miss_counts.columns = ["Miss Direction", "Count"]
            fig_miss = px.pie(
                miss_counts, names="Miss Direction", values="Count",
                title="Green Miss Direction",
                color_discrete_sequence=px.colors.qualitative.Set2,
            )
            st.plotly_chart(fig_miss, use_container_width=True)

    # ── Approach Proximity ─────────────────────────────────────────────────────
    approach_df = df[df["approach_club"].notna() & df["distance_to_green"].notna()].copy()
    if not approach_df.empty:
        st.subheader("Approach Club Effectiveness")

        app_stats = (
            approach_df.groupby("approach_club")
            .agg(
                Shots=("distance_to_green", "count"),
                Avg_Distance=("distance_to_green", "mean"),
                GIR=("green_status", lambda x: (x == "Hit").mean() * 100),
            )
            .reset_index()
            .sort_values("Avg_Distance")
        )
        app_stats["Avg_Distance"] = app_stats["Avg_Distance"].round(0)
        app_stats["GIR"] = app_stats["GIR"].round(1)

        col_app1, col_app2 = st.columns(2)
        with col_app1:
            fig_app_dist = px.bar(
                app_stats, x="approach_club", y="Avg_Distance",
                color="Avg_Distance", color_continuous_scale="Blues_r",
                text="Avg_Distance", hover_data=["Shots"],
                title="Avg Distance to Green by Club (yards)",
            )
            fig_app_dist.update_traces(texttemplate="%{text:.0f}", textposition="outside")
            fig_app_dist.update_layout(xaxis_title="Club", yaxis_title="Avg Yards", coloraxis_showscale=False)
            st.plotly_chart(fig_app_dist, use_container_width=True)
        with col_app2:
            fig_app_gir = px.bar(
                app_stats, x="approach_club", y="GIR",
                color="GIR", color_continuous_scale="RdYlGn",
                text="GIR", hover_data=["Shots"],
                title="GIR % by Approach Club",
            )
            fig_app_gir.update_traces(texttemplate="%{text:.1f}%", textposition="outside")
            fig_app_gir.update_layout(xaxis_title="Club", yaxis_title="GIR %", coloraxis_showscale=False)
            st.plotly_chart(fig_app_gir, use_container_width=True)

    # ── Short Game ─────────────────────────────────────────────────────────────
    st.subheader("Short Game & Putting")

    col_sg1, col_sg2, col_sg3 = st.columns(3)

    # Scramble %: missed GIR but still made par or better
    missed_gir = df[df["green_status"] != "Hit"].copy()
    if not missed_gir.empty:
        scramble_pct = (missed_gir["score_relative"] <= 0).mean() * 100
        col_sg1.metric("Scramble %", f"{scramble_pct:.1f}%", help="Par or better after missing GIR")

    # 3-putt %
    three_putt_pct = (df["putts"] >= 3).mean() * 100
    avg_putts_gir = df[df["green_status"] == "Hit"]["putts"].mean()
    col_sg2.metric("3-Putt %", f"{three_putt_pct:.1f}%")
    col_sg3.metric("Avg Putts (on GIR)", f"{avg_putts_gir:.2f}" if not pd.isna(avg_putts_gir) else "—")

    putt_dist = df.dropna(subset=["putts"])["putts"].value_counts().sort_index().reset_index()
    putt_dist.columns = ["Putts", "Holes"]
    fig_putts = px.bar(putt_dist, x="Putts", y="Holes", title="Putt Distribution", text="Holes")
    fig_putts.update_traces(textposition="outside")
    st.plotly_chart(fig_putts, use_container_width=True)

    # Putts when on vs off green
    on_green = df[df["green_status"] == "Hit"]["putts"].mean()
    off_green = df[df["green_status"] != "Hit"]["putts"].mean()
    putt_comp = pd.DataFrame({
        "Situation": ["GIR (on green)", "Missed GIR"],
        "Avg Putts": [on_green, off_green],
    })
    fig_putt_comp = px.bar(
        putt_comp, x="Situation", y="Avg Putts",
        color="Avg Putts", color_continuous_scale="RdYlGn_r",
        text="Avg Putts", title="Avg Putts: GIR vs Missed GIR",
    )
    fig_putt_comp.update_traces(texttemplate="%{text:.2f}", textposition="outside")
    fig_putt_comp.update_layout(coloraxis_showscale=False)
    st.plotly_chart(fig_putt_comp, use_container_width=True)

    # ── Course Records ─────────────────────────────────────────────────────────
    st.subheader("Course Performance")

    course_stats = (
        df.groupby("course_name")
        .agg(
            Rounds=("round_id", "nunique"),
            Avg_Score_Rel=("score_relative", "mean"),
            Best_Score_Rel=("score_relative", "min"),
            GIR=("green_status", lambda x: (x == "Hit").mean() * 100),
        )
        .reset_index()
        .sort_values("Avg_Score_Rel")
    )
    course_stats["Avg Score vs Par"] = course_stats["Avg_Score_Rel"].round(2)
    course_stats["GIR %"] = course_stats["GIR"].round(1)
    st.dataframe(
        course_stats[["course_name", "Rounds", "Avg Score vs Par", "GIR %"]].rename(
            columns={"course_name": "Course"}
        ),
        use_container_width=True,
        hide_index=True,
    )

    # ── Score by Yardage Band ──────────────────────────────────────────────────
    st.subheader("Score vs Par by Yardage Band (Par 4s)")

    par4_yds = df[df["par"] == 4].dropna(subset=["yardage", "score_relative"]).copy()
    if not par4_yds.empty:
        bins = [0, 350, 375, 400, 425, 450, 999]
        labels = ["<350", "350–374", "375–399", "400–424", "425–449", "450+"]
        par4_yds["Yardage Band"] = pd.cut(par4_yds["yardage"], bins=bins, labels=labels)
        yds_stats = (
            par4_yds.groupby("Yardage Band", observed=True)["score_relative"]
            .agg(Avg=("mean"), Count=("count"))
            .reset_index()
        )
        yds_stats["Avg"] = yds_stats["Avg"].round(2)
        fig_yds = px.bar(
            yds_stats, x="Yardage Band", y="Avg",
            text="Avg", hover_data=["Count"],
            color="Avg", color_continuous_scale="RdYlGn_r",
            title="Avg Score vs Par by Par-4 Yardage Band",
        )
        fig_yds.add_hline(y=0, line_dash="dash", line_color="gray")
        fig_yds.update_traces(texttemplate="%{text:+.2f}", textposition="outside")
        fig_yds.update_layout(yaxis_title="+/- Par", coloraxis_showscale=False)
        st.plotly_chart(fig_yds, use_container_width=True)

    # ── Hole Shape Performance ─────────────────────────────────────────────────
    shape_df = df[df["hole_shape"].notna() & (df["hole_shape"] != "Unknown")].copy()
    if not shape_df.empty:
        st.subheader("Performance by Hole Shape")

        shape_stats = (
            shape_df.groupby("hole_shape")
            .agg(
                Holes=("hole_id", "count"),
                Avg_Score_Rel=("score_relative", "mean"),
                FW_Pct=("fairway_hit", lambda x: (x == "Hit").mean() * 100),
                GIR=("green_status", lambda x: (x == "Hit").mean() * 100),
            )
            .reset_index()
        )
        shape_stats["Avg Score vs Par"] = shape_stats["Avg_Score_Rel"].round(2)
        shape_stats["Fairway %"] = shape_stats["FW_Pct"].round(1)
        shape_stats["GIR %"] = shape_stats["GIR"].round(1)
        st.dataframe(
            shape_stats[["hole_shape", "Holes", "Avg Score vs Par", "Fairway %", "GIR %"]].rename(
                columns={"hole_shape": "Hole Shape"}
            ),
            use_container_width=True,
            hide_index=True,
        )

    # ── Handicap Trend ─────────────────────────────────────────────────────────
    hc_df = rounds_df[rounds_df["handicap_differential"].notna()].sort_values("date")
    if not hc_df.empty:
        st.subheader("Handicap Differential Trend")
        fig_hc = go.Figure()
        fig_hc.add_trace(go.Scatter(
            x=hc_df["date"], y=hc_df["handicap_differential"],
            mode="markers+lines", name="Differential",
        ))
        fig_hc.add_trace(go.Scatter(
            x=hc_df["date"],
            y=hc_df["handicap_differential"].rolling(8, min_periods=1).mean(),
            mode="lines", name="8-round avg",
            line=dict(width=2.5, dash="dot"),
        ))
        fig_hc.update_layout(title="Handicap Differential Over Time", yaxis_title="Differential")
        st.plotly_chart(fig_hc, use_container_width=True)

    # ── Performance by Hole Handicap ───────────────────────────────────────────
    st.subheader("Performance by Hole Handicap Rating")

    hcp_stats = (
        df.dropna(subset=["handicap_rating", "score_relative"])
        .groupby("handicap_rating")["score_relative"]
        .mean()
        .reset_index()
        .sort_values("handicap_rating")
    )
    hcp_stats.columns = ["Handicap Rating", "Avg Score vs Par"]
    fig_hcp = px.scatter(
        hcp_stats, x="Handicap Rating", y="Avg Score vs Par",
        color="Avg Score vs Par", color_continuous_scale="RdYlGn_r",
        size=[10] * len(hcp_stats),
        title="Avg Score vs Par by Hole Handicap (1=hardest, 18=easiest)",
    )
    fig_hcp.add_hline(y=0, line_dash="dash", line_color="gray")
    fig_hcp.update_layout(coloraxis_showscale=False)
    st.plotly_chart(fig_hcp, use_container_width=True)


# ══════════════════════════════════════════════════════════════════════════════
# TAB 2: CADDIE TOOL
# ══════════════════════════════════════════════════════════════════════════════

with tab_caddie:
    st.header("🎯 Hole Advisor")
    st.markdown(
        "Enter the specs of the hole you're about to play. "
        "We'll pull your historical data from similar holes to give you personalized recommendations."
    )

    # ── Inputs ────────────────────────────────────────────────────────────────
    c1, c2, c3, c4 = st.columns(4)
    inp_par = c1.selectbox("Par", [3, 4, 5])
    inp_yardage = c2.number_input("Yardage", min_value=50, max_value=700, value=380, step=5)
    inp_handicap = c3.number_input("Hole Handicap Rating", min_value=1, max_value=18, value=9)
    inp_shape = c4.selectbox("Hole Shape", ["Any", "Straight", "Dogleg Left", "Dogleg Right"])
    yardage_tol = st.slider("Yardage Tolerance (±)", min_value=10, max_value=75, value=25, step=5)
    handicap_tol = st.slider("Handicap Rating Tolerance (±)", min_value=1, max_value=5, value=2)

    run_btn = st.button("Get Recommendations", type="primary", use_container_width=True)

    if run_btn:
        full = load_holes()

        # ── Filter similar holes ───────────────────────────────────────────────
        mask = (
            (full["par"] == inp_par)
            & (full["yardage"] >= inp_yardage - yardage_tol)
            & (full["yardage"] <= inp_yardage + yardage_tol)
            & (full["handicap_rating"] >= inp_handicap - handicap_tol)
            & (full["handicap_rating"] <= inp_handicap + handicap_tol)
        )
        if inp_shape != "Any":
            shape_val = inp_shape.lower().replace(" ", "_")
            mask &= full["hole_shape"].str.lower().str.replace(" ", "_", regex=False) == shape_val

        similar = full[mask].copy()

        if len(similar) < 5:
            st.warning(
                f"Only {len(similar)} matching holes found — try widening the tolerances. "
                "Recommendations may not be meaningful with very few samples."
            )
            if similar.empty:
                st.stop()

        n = len(similar)
        st.success(f"Analyzing **{n} holes** from your history matching this profile.")
        st.markdown("---")

        # ── Card 1: Tee Club Recommendation ───────────────────────────────────
        driving_sim = similar[similar["par"] != 3].copy()
        if not driving_sim.empty and driving_sim["tee_club"].notna().any():
            driving_sim["fw_hit"] = (driving_sim["fairway_hit"] == "Hit").astype(int)
            club_fw = (
                driving_sim.groupby("tee_club")["fw_hit"]
                .agg(FW_Pct="mean", Shots="count")
                .reset_index()
                .sort_values("FW_Pct", ascending=False)
            )
            club_fw["FW_Pct_Pct"] = (club_fw["FW_Pct"] * 100).round(1)
            best_club = club_fw.iloc[0]

            col_card1, col_card2 = st.columns(2)
            with col_card1:
                st.markdown("#### 🏌️ Tee Club")
                st.markdown(
                    f"<div style='background:#f0fdf4;border-radius:10px;padding:16px'>"
                    f"<h2 style='color:#166534;margin:0'>{best_club['tee_club']}</h2>"
                    f"<p style='margin:4px 0 0 0;color:#166534'>"
                    f"{best_club['FW_Pct_Pct']:.1f}% fairway hit rate on similar holes "
                    f"({int(best_club['Shots'])} shots)</p>"
                    f"</div>",
                    unsafe_allow_html=True,
                )
                st.markdown("")
                fig_club_fw = px.bar(
                    club_fw, x="tee_club", y="FW_Pct_Pct",
                    color="FW_Pct_Pct", color_continuous_scale="RdYlGn",
                    text="FW_Pct_Pct", labels={"tee_club": "Club", "FW_Pct_Pct": "Fairway %"},
                    title="Fairway % by Tee Club (similar holes)",
                    hover_data=["Shots"],
                )
                fig_club_fw.update_traces(texttemplate="%{text:.1f}%", textposition="outside")
                fig_club_fw.update_layout(coloraxis_showscale=False, xaxis_title="Club")
                st.plotly_chart(fig_club_fw, use_container_width=True)

            # ── Card 2: Risk/Reward ──────────────────────────────────────────
            with col_card2:
                st.markdown("#### ⚖️ Fairway Impact")
                hit_fair = driving_sim[driving_sim["fairway_hit"] == "Hit"]["score_relative"].mean()
                miss_fair = driving_sim[driving_sim["fairway_hit"] != "Hit"]["score_relative"].mean()
                if not pd.isna(hit_fair) and not pd.isna(miss_fair):
                    diff = miss_fair - hit_fair
                    impact_color = "#166534" if diff > 0 else "#991b1b"
                    st.markdown(
                        f"<div style='background:#fff7ed;border-radius:10px;padding:16px'>"
                        f"<p style='margin:0'><b>Hit fairway:</b> avg {hit_fair:+.2f} vs par</p>"
                        f"<p style='margin:4px 0'><b>Miss fairway:</b> avg {miss_fair:+.2f} vs par</p>"
                        f"<hr style='margin:8px 0'>"
                        f"<p style='margin:0;color:{impact_color}'><b>Fairway is worth "
                        f"{abs(diff):.2f} strokes</b> on this type of hole.</p>"
                        f"</div>",
                        unsafe_allow_html=True,
                    )
                    st.markdown("")
                    comp_df = pd.DataFrame({
                        "Situation": ["Hit Fairway", "Missed Fairway"],
                        "Avg Score vs Par": [hit_fair, miss_fair],
                    })
                    fig_rr = px.bar(
                        comp_df, x="Situation", y="Avg Score vs Par",
                        color="Avg Score vs Par", color_continuous_scale="RdYlGn_r",
                        text="Avg Score vs Par", title="Score vs Par: Fairway Hit vs Miss",
                    )
                    fig_rr.add_hline(y=0, line_dash="dash", line_color="gray")
                    fig_rr.update_traces(texttemplate="%{text:+.2f}", textposition="outside")
                    fig_rr.update_layout(coloraxis_showscale=False)
                    st.plotly_chart(fig_rr, use_container_width=True)

        st.markdown("---")

        # ── Card 3: Avg Score ─────────────────────────────────────────────────
        col3a, col3b, col3c = st.columns(3)

        avg_score_rel = similar["score_relative"].mean()
        col3a.metric(
            "Avg Score vs Par (similar holes)",
            f"{avg_score_rel:+.2f}" if not pd.isna(avg_score_rel) else "—",
        )

        # ── Card 4: GIR % ─────────────────────────────────────────────────────
        gir_sim = (similar["green_status"] == "Hit").mean() * 100
        col3b.metric("GIR %", f"{gir_sim:.1f}%")

        # ── Card 5: Avg Putts ─────────────────────────────────────────────────
        avg_putts_sim = similar["putts"].mean()
        col3c.metric("Avg Putts", f"{avg_putts_sim:.2f}" if not pd.isna(avg_putts_sim) else "—")

        st.markdown("---")

        # ── Card 6: Approach Club Advice ──────────────────────────────────────
        app_sim = similar[similar["approach_club"].notna() & similar["distance_to_green"].notna()]
        if not app_sim.empty:
            st.markdown("#### 📐 Approach Club (if you hit the fairway)")

            # Expected remaining distance for this hole given typical tee shots
            exp_distance = app_sim["distance_to_green"].median()
            club_gir = (
                app_sim.groupby("approach_club")
                .agg(
                    Shots=("approach_club", "count"),
                    GIR_Pct=("green_status", lambda x: (x == "Hit").mean() * 100),
                    Avg_Dist=("distance_to_green", "mean"),
                )
                .reset_index()
                .sort_values("GIR_Pct", ascending=False)
            )
            club_gir["GIR_Pct"] = club_gir["GIR_Pct"].round(1)
            club_gir["Avg_Dist"] = club_gir["Avg_Dist"].round(0)
            best_app = club_gir.iloc[0]

            st.markdown(
                f"<div style='background:#eff6ff;border-radius:10px;padding:16px'>"
                f"<p style='margin:0'>Typical approach distance: <b>{exp_distance:.0f} yds</b></p>"
                f"<p style='margin:4px 0'>Best club by GIR: <b>{best_app['approach_club']}</b> "
                f"— {best_app['GIR_Pct']:.1f}% GIR ({int(best_app['Shots'])} shots)</p>"
                f"</div>",
                unsafe_allow_html=True,
            )
            st.markdown("")
            fig_app = px.bar(
                club_gir, x="approach_club", y="GIR_Pct",
                color="GIR_Pct", color_continuous_scale="RdYlGn",
                text="GIR_Pct", hover_data=["Shots", "Avg_Dist"],
                labels={"approach_club": "Club", "GIR_Pct": "GIR %"},
                title="Approach Club GIR % on Similar Holes",
            )
            fig_app.update_traces(texttemplate="%{text:.1f}%", textposition="outside")
            fig_app.update_layout(coloraxis_showscale=False)
            st.plotly_chart(fig_app, use_container_width=True)

        # ── Card 7: Putting Risk ───────────────────────────────────────────────
        st.markdown("#### 🏳️ Putting Risk")
        putts_on = similar[similar["green_status"] == "Hit"]["putts"].mean()
        putts_off = similar[similar["green_status"] != "Hit"]["putts"].mean()
        if not pd.isna(putts_on) or not pd.isna(putts_off):
            putt_risk = pd.DataFrame({
                "Situation": ["Hit GIR", "Missed GIR"],
                "Avg Putts": [putts_on, putts_off],
            }).dropna()
            fig_pr = px.bar(
                putt_risk, x="Situation", y="Avg Putts",
                color="Avg Putts", color_continuous_scale="RdYlGn_r",
                text="Avg Putts", title="Avg Putts by Green Status (similar holes)",
            )
            fig_pr.update_traces(texttemplate="%{text:.2f}", textposition="outside")
            fig_pr.update_layout(coloraxis_showscale=False)
            st.plotly_chart(fig_pr, use_container_width=True)

        # ── Raw Data Preview ───────────────────────────────────────────────────
        with st.expander("View matching holes data"):
            display_cols = [
                "date", "course_name", "hole_number", "par", "yardage",
                "handicap_rating", "tee_club", "fairway_hit", "approach_club",
                "distance_to_green", "green_status", "putts", "score_relative", "source",
            ]
            available = [c for c in display_cols if c in similar.columns]
            st.dataframe(similar[available].sort_values("date", ascending=False), use_container_width=True, hide_index=True)
