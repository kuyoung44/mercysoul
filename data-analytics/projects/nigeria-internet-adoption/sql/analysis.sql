-- Nigeria internet adoption trend, 2000–2024
-- Source: World Bank WDI indicator IT.NET.USER.ZS (underlying source: ITU).
-- Unit: percent of population. Values are rounded to two decimals.

-- 1. Annual values and year-over-year change in percentage points.
WITH trend AS (
    SELECT
        year,
        internet_users_pct,
        LAG(internet_users_pct) OVER (ORDER BY year) AS previous_year_pct
    FROM internet_usage
)
SELECT
    year,
    internet_users_pct,
    ROUND(internet_users_pct - previous_year_pct, 2) AS yoy_change_percentage_points
FROM trend
ORDER BY year;

-- 2. Overall summary for the period.
SELECT
    MIN(year) AS first_year,
    MAX(year) AS last_year,
    COUNT(*) AS observations,
    ROUND(MIN(internet_users_pct), 2) AS starting_value_pct,
    ROUND(MAX(internet_users_pct), 2) AS ending_value_pct,
    ROUND(MAX(internet_users_pct) - MIN(internet_users_pct), 2) AS total_change_percentage_points,
    ROUND(AVG(internet_users_pct), 2) AS period_average_pct
FROM internet_usage;

-- 3. Largest annual increase in percentage points.
WITH trend AS (
    SELECT
        year,
        internet_users_pct - LAG(internet_users_pct) OVER (ORDER BY year) AS yoy_change_pp
    FROM internet_usage
)
SELECT year, ROUND(yoy_change_pp, 2) AS yoy_change_percentage_points
FROM trend
WHERE yoy_change_pp IS NOT NULL
ORDER BY yoy_change_pp DESC, year ASC
LIMIT 1;
