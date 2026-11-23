"""Verify the Nigeria internet adoption SQL portfolio dataset with Python's stdlib."""
import csv
import sqlite3
from pathlib import Path

ROOT = Path(__file__).resolve().parent
DATA = ROOT / "data" / "nigeria_internet_usage.csv"


def main():
    connection = sqlite3.connect(":memory:")
    connection.executescript((ROOT / "sql" / "schema.sql").read_text(encoding="utf-8"))
    with DATA.open(newline="", encoding="utf-8") as handle:
        rows = [(int(row["year"]), float(row["internet_users_pct"])) for row in csv.DictReader(handle)]
    connection.executemany(
        "INSERT INTO internet_usage (year, internet_users_pct) VALUES (?, ?)", rows
    )

    count, first_year, last_year, first_value, last_value = connection.execute(
        """SELECT COUNT(*), MIN(year), MAX(year),
                  MIN(CASE WHEN year = 2000 THEN internet_users_pct END),
                  MAX(CASE WHEN year = 2024 THEN internet_users_pct END)
           FROM internet_usage"""
    ).fetchone()
    assert (count, first_year, last_year) == (25, 2000, 2024)
    assert first_value == 0.06
    assert last_value == 41.21

    change = connection.execute(
        """SELECT ROUND(
               (SELECT internet_users_pct FROM internet_usage WHERE year = 2024) -
               (SELECT internet_users_pct FROM internet_usage WHERE year = 2000), 2
           )"""
    ).fetchone()[0]
    assert change == 41.15

    largest = connection.execute(
        """WITH trend AS (
               SELECT year, internet_users_pct -
                      LAG(internet_users_pct) OVER (ORDER BY year) AS yoy_change
               FROM internet_usage
           )
           SELECT year, ROUND(yoy_change, 2)
           FROM trend WHERE yoy_change IS NOT NULL
           ORDER BY yoy_change DESC, year LIMIT 1"""
    ).fetchone()
    assert largest == (2022, 3.64)

    # Execute the authored SQL script to confirm its syntax is valid in SQLite.
    connection.executescript((ROOT / "sql" / "analysis.sql").read_text(encoding="utf-8"))
    print("PASS: 25 observations; 2000=0.06%; 2024=41.21%; net change=41.15 pp.")
    print(f"PASS: largest annual rise is {largest[1]} percentage points in {largest[0]}.")
    print("PASS: schema constraints and all authored SQL statements executed.")
    connection.close()


if __name__ == "__main__":
    main()
