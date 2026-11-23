"""Analyse the fictional MercySoul teaching dataset.

Run: python -m pip install pandas && python analysis.py
"""
from pathlib import Path
import pandas as pd

DATA_PATH = Path(__file__).parent / "data" / "mercysoul_sales.csv"

def main():
    df = pd.read_csv(DATA_PATH)
    df["order_date"] = pd.to_datetime(df["order_date"], errors="coerce")
    df["order_value_ngn"] = pd.to_numeric(df["order_value_ngn"], errors="coerce")

    # Basic quality checks
    print("Rows:", len(df))
    print("Missing values by column:\n", df.isna().sum())
    print("Duplicate order IDs:", df["order_id"].duplicated().sum())

    completed = df.loc[df["status"].eq("Completed")].copy()
    total_revenue = completed["order_value_ngn"].sum()
    average_order_value = completed["order_value_ngn"].mean()

    summary = (
        completed.groupby("service", as_index=False)
        .agg(orders=("order_id", "count"),
             revenue_ngn=("order_value_ngn", "sum"))
    )
    summary["order_share_pct"] = summary["orders"] / len(completed) * 100
    summary["revenue_share_pct"] = summary["revenue_ngn"] / total_revenue * 100
    summary = summary.sort_values("revenue_ngn", ascending=False)

    print("\nOverall metrics")
    print(f"Completed orders: {len(completed)}")
    print(f"Revenue: NGN {total_revenue:,.0f}")
    print(f"Average order value: NGN {average_order_value:,.0f}")

    print("\nService performance")
    print(summary.to_string(index=False, formatters={
        "order_share_pct": "{:.1f}%".format,
        "revenue_share_pct": "{:.1f}%".format,
        "revenue_ngn": "{:,.0f}".format,
    }))

    top_revenue = summary.iloc[0]
    top_orders = summary.sort_values("orders", ascending=False).iloc[0]
    print("\nInterpretation")
    print(f"Highest revenue: {top_revenue['service']}")
    print(f"Most orders: {top_orders['service']}")
    print("Reminder: revenue is not profit; costs and delivery time are not included.")

if __name__ == "__main__":
    main()
