"""Reproducible analysis of the fictional MercySoul teaching dataset."""
from pathlib import Path
import pandas as pd

ROOT = Path(__file__).resolve().parent
DATA_PATH = ROOT / "data" / "mercysoul_sales.csv"
OUTPUT_DIR = ROOT / "outputs"
REQUIRED_COLUMNS = {
    "order_id", "order_date", "service", "customer_segment",
    "order_value_ngn", "status",
}


def load_and_validate(path: Path = DATA_PATH) -> pd.DataFrame:
    """Load the CSV and fail loudly on structural or critical data-quality issues."""
    df = pd.read_csv(path)
    missing_columns = REQUIRED_COLUMNS - set(df.columns)
    if missing_columns:
        raise ValueError(f"Missing required columns: {', '.join(sorted(missing_columns))}")
    if df.empty:
        raise ValueError("Dataset is empty; no analysis can be performed.")

    for column in ("order_id", "service", "status"):
        if df[column].isna().any() or df[column].astype(str).str.strip().eq("").any():
            raise ValueError(f"'{column}' contains blank values.")
    if df["order_id"].duplicated().any():
        duplicates = df.loc[df["order_id"].duplicated(), "order_id"].astype(str).tolist()
        raise ValueError(f"Duplicate order_id values: {', '.join(duplicates)}")

    df["order_date"] = pd.to_datetime(df["order_date"], errors="coerce")
    if df["order_date"].isna().any():
        raise ValueError("Invalid or missing order_date values found.")
    df["order_value_ngn"] = pd.to_numeric(df["order_value_ngn"], errors="coerce")
    if df["order_value_ngn"].isna().any():
        raise ValueError("Invalid or missing order_value_ngn values found.")
    if (df["order_value_ngn"] < 0).any():
        raise ValueError("Negative order values found; review refunds/credits separately.")
    df["status"] = df["status"].astype(str).str.strip().str.title()
    df["service"] = df["service"].astype(str).str.strip()
    return df


def analyse(df: pd.DataFrame) -> tuple[dict, pd.DataFrame]:
    """Calculate completed-order KPIs and service-level metrics."""
    completed = df.loc[df["status"].eq("Completed")].copy()
    if completed.empty:
        raise ValueError("No completed orders are available for revenue analysis.")

    total_revenue = float(completed["order_value_ngn"].sum())
    order_count = int(len(completed))
    kpis = {
        "source_rows": int(len(df)),
        "completed_orders": order_count,
        "non_completed_orders": int(len(df) - order_count),
        "total_revenue_ngn": total_revenue,
        "average_order_value_ngn": total_revenue / order_count,
        "first_order_date": completed["order_date"].min().date().isoformat(),
        "last_order_date": completed["order_date"].max().date().isoformat(),
    }
    summary = (completed.groupby("service", as_index=False)
               .agg(orders=("order_id", "nunique"), revenue_ngn=("order_value_ngn", "sum")))
    summary["order_share_pct"] = summary["orders"] / order_count * 100
    summary["revenue_share_pct"] = summary["revenue_ngn"] / total_revenue * 100 if total_revenue else 0.0
    summary["average_order_value_ngn"] = summary["revenue_ngn"] / summary["orders"]
    summary = summary.sort_values(["revenue_ngn", "service"], ascending=[False, True]).reset_index(drop=True)
    return kpis, summary


def write_outputs(kpis: dict, summary: pd.DataFrame) -> None:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    summary.to_csv(OUTPUT_DIR / "service_summary.csv", index=False, float_format="%.2f")
    lines = [
        "# MercySoul Sales Analysis — Generated Results", "",
        "> Synthetic teaching data only. These are not actual MercySoul sales or financial records.", "",
        "## KPI summary", "",
        f"- Source rows: {kpis['source_rows']}",
        f"- Completed orders: {kpis['completed_orders']}",
        f"- Non-completed orders excluded from revenue: {kpis['non_completed_orders']}",
        f"- Revenue: ₦{kpis['total_revenue_ngn']:,.2f}",
        f"- Average order value: ₦{kpis['average_order_value_ngn']:,.2f}",
        f"- Date range: {kpis['first_order_date']} to {kpis['last_order_date']}", "",
        "## Service performance", "",
        "| Service | Orders | Revenue (₦) | Order share | Revenue share | Average order (₦) |",
        "|---|---:|---:|---:|---:|---:|",
    ]
    for row in summary.itertuples(index=False):
        lines.append(f"| {row.service} | {row.orders} | {row.revenue_ngn:,.2f} | {row.order_share_pct:.1f}% | {row.revenue_share_pct:.1f}% | {row.average_order_value_ngn:,.2f} |")
    lines += ["", "## Interpretation", "",
              f"- Highest revenue: **{summary.iloc[0]['service']}**.",
              f"- Most orders: **{summary.sort_values(['orders', 'service'], ascending=[False, True]).iloc[0]['service']}**.",
              "- Revenue is not profit; delivery costs, time, refunds and acquisition costs are unavailable.",
              "- The sample is small and synthetic; do not infer market demand or customer behaviour from it.", ""]
    (OUTPUT_DIR / "analysis_report.md").write_text("\n".join(lines), encoding="utf-8")

    try:
        import matplotlib.pyplot as plt
    except ImportError:
        print("Matplotlib not installed; CSV and Markdown outputs were generated. Install requirements for charts.")
        return

    for metric, title, filename, ylabel in [
        ("revenue_ngn", "Revenue by Service (Synthetic Sample)", "revenue_by_service.png", "Revenue (NGN)"),
        ("orders", "Completed Orders by Service (Synthetic Sample)", "orders_by_service.png", "Orders"),
    ]:
        plot_data = summary.sort_values(metric, ascending=True)
        fig, ax = plt.subplots(figsize=(9, 5))
        ax.barh(plot_data["service"], plot_data[metric])
        ax.set_title(title)
        ax.set_xlabel(ylabel)
        ax.set_ylabel("Service")
        ax.grid(axis="x", alpha=0.25)
        fig.tight_layout()
        fig.savefig(OUTPUT_DIR / filename, dpi=160)
        plt.close(fig)


def main() -> None:
    df = load_and_validate()
    kpis, summary = analyse(df)
    print("DATA QUALITY: PASS — required fields, dates, values and unique IDs validated")
    print(f"Rows: {kpis['source_rows']} | Completed: {kpis['completed_orders']} | Excluded: {kpis['non_completed_orders']}")
    print(f"Revenue: ₦{kpis['total_revenue_ngn']:,.2f} | Average order: ₦{kpis['average_order_value_ngn']:,.2f}")
    print("\nSERVICE SUMMARY")
    print(summary.to_string(index=False, formatters={
        "revenue_ngn": "₦{:,.2f}".format,
        "order_share_pct": "{:.1f}%".format,
        "revenue_share_pct": "{:.1f}%".format,
        "average_order_value_ngn": "₦{:,.2f}".format,
    }))
    write_outputs(kpis, summary)
    print(f"\nOutputs written to: {OUTPUT_DIR.relative_to(ROOT)}/")


if __name__ == "__main__":
    main()
