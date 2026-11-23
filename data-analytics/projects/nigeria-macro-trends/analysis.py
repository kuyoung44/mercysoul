"""Fetch and analyse Nigeria GDP growth and inflation from World Bank WDI."""
import csv
import json
import math
import urllib.request
from pathlib import Path

BASE = "https://api.worldbank.org/v2/country/NGA/indicator"
INDICATORS = {
    "gdp_growth_pct": "NY.GDP.MKTP.KD.ZG",
    "inflation_pct": "FP.CPI.TOTL.ZG",
}
OUT = Path(__file__).parent / "outputs"
DATA = Path(__file__).parent / "data"


def parse_api_payload(payload):
    """Return {year: numeric_value}; ignore missing observations."""
    if not isinstance(payload, list) or len(payload) < 2 or not isinstance(payload[1], list):
        raise ValueError("Unexpected World Bank API response")
    values = {}
    for item in payload[1]:
        year = int(item["date"])
        value = item.get("value")
        if value is not None:
            value = float(value)
            if math.isfinite(value):
                values[year] = value
    return values


def fetch_indicator(indicator):
    url = f"{BASE}/{indicator}?format=json&per_page=100"
    request = urllib.request.Request(url, headers={"User-Agent": "MercySoul-Data-Portfolio/1.0"})
    with urllib.request.urlopen(request, timeout=30) as response:
        return parse_api_payload(json.loads(response.read().decode("utf-8")))


def merge_series(gdp, inflation):
    """Keep years where both indicators have observations."""
    return [
        {"year": year, "gdp_growth_pct": gdp[year], "inflation_pct": inflation[year]}
        for year in sorted(set(gdp) & set(inflation))
    ]


def summarize(rows):
    if not rows:
        raise ValueError("No overlapping observations are available")
    gdp = [row["gdp_growth_pct"] for row in rows]
    inflation = [row["inflation_pct"] for row in rows]
    return {
        "observations": len(rows),
        "first_year": rows[0]["year"],
        "last_year": rows[-1]["year"],
        "average_gdp_growth_pct": sum(gdp) / len(gdp),
        "average_inflation_pct": sum(inflation) / len(inflation),
    }


def main():
    DATA.mkdir(exist_ok=True)
    OUT.mkdir(exist_ok=True)
    gdp = fetch_indicator(INDICATORS["gdp_growth_pct"])
    inflation = fetch_indicator(INDICATORS["inflation_pct"])
    rows = merge_series(gdp, inflation)
    summary = summarize(rows)
    csv_path = DATA / "nigeria_macro_indicators.csv"
    with csv_path.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=["year", "gdp_growth_pct", "inflation_pct"])
        writer.writeheader()
        writer.writerows(rows)
    report = [
        "# Nigeria GDP Growth and Inflation — Results",
        "",
        f"- Matched annual observations: {summary['observations']}",
        f"- Period: {summary['first_year']}–{summary['last_year']}",
        f"- Average annual real GDP growth: {summary['average_gdp_growth_pct']:.2f}%",
        f"- Average annual CPI inflation: {summary['average_inflation_pct']:.2f}%",
        "",
        "These are descriptive averages over years with both indicators available. They do not establish that inflation causes GDP growth changes.",
        "Review the CSV and World Bank indicator metadata before making policy or investment decisions.",
    ]
    (OUT / "summary.md").write_text("\n".join(report) + "\n", encoding="utf-8")
    print("\n".join(report))


if __name__ == "__main__":
    main()
