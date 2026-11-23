# Nigeria GDP Growth and Inflation — Public Data Analysis

**Project type:** Public macroeconomic time-series analysis  
**Country:** Nigeria (NGA)  
**Tools:** Python 3, standard library, World Bank API, CSV, unittest

## Decision question

How have Nigeria's annual real GDP growth and consumer-price inflation moved over time, and what can a descriptive comparison tell a reader?

## Data sources

The script retrieves two World Development Indicators (WDI) series directly from the World Bank API:

- Real GDP growth (annual %): `NY.GDP.MKTP.KD.ZG`
- Inflation, consumer prices (annual %): `FP.CPI.TOTL.ZG`

API pattern: `https://api.worldbank.org/v2/country/NGA/indicator/{INDICATOR}?format=json&per_page=100`

The dataset is refreshed when the script runs. The project does not invent or hard-code observations. It keeps only years where both indicators have a non-null observation. Consult the World Bank indicator metadata for definitions, revisions and source notes.

## Run

Python 3.10+; no third-party packages required.

```bash
python analysis.py
python -m unittest discover -s tests -v
```

The script writes `data/nigeria_macro_indicators.csv` and `outputs/summary.md`. Internet access is required to retrieve current API data.

## Method

1. Retrieve each indicator independently from the World Bank API.
2. Validate the response structure and omit null/non-finite observations.
3. Join the series on year, retaining only years with both values.
4. Calculate the observation count, period and arithmetic averages.
5. Export the joined annual dataset and a concise results note.

## Interpretation safeguards

- GDP growth is a percentage change in real GDP; CPI inflation is an annual percentage change in consumer prices.
- The two indicators have different meanings and should not be treated as interchangeable.
- Averages depend on the available overlapping years and can hide shocks and structural changes.
- Correlation or co-movement does not prove causation.
- This descriptive exercise does not evaluate policy effectiveness, household cost of living, poverty, employment or investment returns.
- Check API metadata and data revisions before citing results externally.

## Skills demonstrated

API data retrieval, source documentation, missing-value handling, time-series alignment, descriptive statistics, CSV export, reproducible analysis and unit testing.
