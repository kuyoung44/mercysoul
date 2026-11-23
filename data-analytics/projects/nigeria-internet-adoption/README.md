# Nigeria Internet Adoption — SQL Analytics Case Study

**Project 2 | Data Analyst portfolio**  
**Tool:** SQLite SQL  
**Dataset:** World Bank World Development Indicators (WDI), indicator `IT.NET.USER.ZS`  
**Underlying source:** International Telecommunication Union (ITU)  
**Coverage in this project:** Nigeria, 2000–2024

## Business question

How has the share of Nigeria's population using the internet changed over time, and what does the annual pattern show?

## Executive findings

- Internet use rose from **0.06% in 2000** to **41.21% in 2024**.
- This is an increase of **41.15 percentage points** over the period.
- The 2024 value is about **686.8 times** the 2000 value; because the starting base was extremely small, percentage growth should be interpreted cautiously.
- These are descriptive statistics. The data alone cannot explain why adoption changed or whether internet access is affordable, reliable, or evenly distributed.

## Source and attribution

- World Bank indicator page: https://data.worldbank.org/indicator/IT.NET.USER.ZS?locations=NG
- Indicator metadata: https://databank.worldbank.org/metadataglossary/world-development-indicators/series/IT.NET.USER.ZS
- Historical values cross-checked against the published Nigeria series: https://app.indexbox.io/indicators/symbol/individuals-using-the-internet-percent-of-population-nigeria/
- Indicator definition: individuals who used the internet from any location during the previous three months.
- Unit: percent of population; annual observations.
- The World Bank page identifies ITU's World Telecommunication/ICT Indicators Database as the underlying source. The series is published under CC BY 4.0. Attribute the World Bank/ITU when reusing it.
- Values are rounded to two decimal places as displayed in the referenced historical series. The project retains the stated values; it does not interpolate missing years or invent observations.

## Files

- `data/nigeria_internet_usage.csv`: 25 annual observations.
- `sql/schema.sql`: SQLite table definition and constraints.
- `sql/analysis.sql`: SQL queries for trend, year-over-year percentage-point change, summary KPIs, and highest annual increase.
- `verify_sql.py`: reproducible standard-library Python checks for data integrity and expected SQL results.

## Run it

In a SQLite environment, create the table with `sql/schema.sql`, import the CSV into `internet_usage`, then run `sql/analysis.sql`.

For a phone-friendly workflow, use a browser-based SQLite editor that supports CSV import, paste the schema first, import the CSV, and then run the analysis queries. No paid software is required.

Run the automated checks with Python 3:

```bash
python verify_sql.py
```

## SQL skills demonstrated

Table design, primary keys, CHECK constraints, aggregation, window functions (`LAG`), common table expressions, year-over-year analysis, ranking, and data validation.

## Limitations

This is one national indicator over time. It does not measure household access, speed, affordability, digital skills, rural/urban differences, or frequency of use. Internet-use figures are not the same as broadband subscriptions. The 2024 value is the latest year included in this fixed portfolio extract; check the World Bank source for later revisions before using the data for current policy decisions.
