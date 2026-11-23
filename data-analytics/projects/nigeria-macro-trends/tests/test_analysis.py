import unittest
from analysis import merge_series, parse_api_payload, summarize


class MacroAnalysisTests(unittest.TestCase):
    def test_parse_api_payload_skips_missing(self):
        payload = [{}, [
            {"date": "2020", "value": 1.5},
            {"date": "2019", "value": None},
            {"date": "2021", "value": -2.0},
        ]]
        self.assertEqual(parse_api_payload(payload), {2020: 1.5, 2021: -2.0})

    def test_merge_uses_only_common_years_and_sorts(self):
        rows = merge_series({2021: 2.0, 2020: 1.0}, {2020: 5.0, 2022: 6.0, 2021: 4.0})
        self.assertEqual(rows, [
            {"year": 2020, "gdp_growth_pct": 1.0, "inflation_pct": 5.0},
            {"year": 2021, "gdp_growth_pct": 2.0, "inflation_pct": 4.0},
        ])

    def test_summary(self):
        result = summarize([
            {"year": 2020, "gdp_growth_pct": 1.0, "inflation_pct": 3.0},
            {"year": 2021, "gdp_growth_pct": 3.0, "inflation_pct": 5.0},
        ])
        self.assertEqual(result["observations"], 2)
        self.assertEqual(result["first_year"], 2020)
        self.assertEqual(result["last_year"], 2021)
        self.assertEqual(result["average_gdp_growth_pct"], 2.0)
        self.assertEqual(result["average_inflation_pct"], 4.0)

    def test_empty_summary_rejected(self):
        with self.assertRaises(ValueError):
            summarize([])


if __name__ == "__main__":
    unittest.main()
