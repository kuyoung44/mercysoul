# Data Analytics Portfolio

**Candidate:** Anuoluwapo Adeoye  
**GitHub:** https://github.com/kuyoung44  
**Focus:** Junior Data Analyst | SQL | Python | Business Analysis | Data Quality

## Portfolio overview

This portfolio is a growing record of practical analytical work. Each project states its business question, data source, method, reproducibility steps, findings and limitations. Synthetic practice data is clearly separated from real public data.

## Projects

### 1. MercySoul Sales Analysis — Python and pandas

**Type:** Beginner business analytics case study  
**Data:** 10-row synthetic teaching dataset (not actual MercySoul transactions)  
**Skills:** CSV ingestion, data validation, cleaning, aggregation, KPIs, percentage shares, charts, automated tests and business recommendations.

- [Project guide](README.md)
- [Analysis script](analysis.py)
- [Sample dataset](data/mercysoul_sales.csv)
- [Automated tests](tests/test_analysis.py)

**Key demonstration:** Correctly distinguish the service with the highest order count from the service with the highest revenue. Revenue is not treated as profit.

### 2. Nigeria Internet Adoption — SQL and SQLite

**Type:** Public-data trend analysis  
**Data:** World Bank WDI indicator IT.NET.USER.ZS, underlying source ITU; Nigeria, 2000–2024  
**Skills:** Relational table design, primary keys, CHECK constraints, aggregation, CTEs, window functions, LAG, year-over-year change and data validation.

- [Project guide](projects/nigeria-internet-adoption/README.md)
- [CSV dataset](projects/nigeria-internet-adoption/data/nigeria_internet_usage.csv)
- [SQLite schema](projects/nigeria-internet-adoption/sql/schema.sql)
- [SQL analysis](projects/nigeria-internet-adoption/sql/analysis.sql)
- [Verification script](projects/nigeria-internet-adoption/verify_sql.py)

**Key finding:** The indicator rises from 0.06% in 2000 to 41.21% in 2024, a 41.15 percentage-point increase. This is descriptive; it does not explain causes or measure affordability, quality or distribution.

## Quality and reproducibility

- GitHub Actions runs the Python analysis, three unit tests and the SQL project verification script.
- Source links, units, definitions and limitations are documented.
- The project makes no unsupported claims about professional employment or client results.
- Data quality and analytical validity are treated as part of the work, not optional polish.

## Current development priorities

1. Add a dashboard with clear KPIs and filters.
2. Add a larger public dataset and a deeper SQL case study.
3. Add a project using joins, segmentation and cohort or time-series analysis.
4. Improve visual storytelling and written executive summaries.
5. Practise explaining assumptions, trade-offs and recommendations in interviews.

## Rating note

This is a developing junior-level portfolio, not a guarantee of a 9.9/10 recruiter rating or employment. Any score is provisional and should be based on the visible projects, technical correctness, communication, reproducibility and interview performance.
