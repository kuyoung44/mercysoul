import unittest
from pathlib import Path
import pandas as pd
from analysis import analyse, load_and_validate

ROOT = Path(__file__).resolve().parents[1]


class SalesAnalysisTests(unittest.TestCase):
    def test_sample_kpis_and_service_rankings(self):
        df = load_and_validate(ROOT / "data" / "mercysoul_sales.csv")
        kpis, summary = analyse(df)
        self.assertEqual(kpis["source_rows"], 10)
        self.assertEqual(kpis["completed_orders"], 10)
        self.assertEqual(kpis["total_revenue_ngn"], 215000)
        self.assertEqual(kpis["average_order_value_ngn"], 21500)
        self.assertEqual(summary.iloc[0]["service"], "Website Design")
        self.assertEqual(summary.sort_values("orders", ascending=False).iloc[0]["service"], "AI Artwork")
        self.assertAlmostEqual(summary["revenue_share_pct"].sum(), 100.0)
        self.assertAlmostEqual(summary["order_share_pct"].sum(), 100.0)

    def test_duplicate_ids_are_rejected(self):
        df = pd.read_csv(ROOT / "data" / "mercysoul_sales.csv")
        df.loc[1, "order_id"] = df.loc[0, "order_id"]
        tmp = ROOT / "tests" / "_duplicate_fixture.csv"
        try:
            df.to_csv(tmp, index=False)
            with self.assertRaisesRegex(ValueError, "Duplicate order_id"):
                load_and_validate(tmp)
        finally:
            tmp.unlink(missing_ok=True)

    def test_negative_values_are_rejected(self):
        df = pd.read_csv(ROOT / "data" / "mercysoul_sales.csv")
        df.loc[0, "order_value_ngn"] = -100
        tmp = ROOT / "tests" / "_negative_fixture.csv"
        try:
            df.to_csv(tmp, index=False)
            with self.assertRaisesRegex(ValueError, "Negative order values"):
                load_and_validate(tmp)
        finally:
            tmp.unlink(missing_ok=True)


if __name__ == "__main__":
    unittest.main()
