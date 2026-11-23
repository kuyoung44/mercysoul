# Nigeria Internet Adoption — Interactive Dashboard

This folder contains an interactive, mobile-responsive HTML dashboard for the Nigeria internet-use indicator.

## Open the dashboard

Open `dashboard.html` in a modern browser. It is self-contained: no package installation, API key, or external charting library is required. Use the Start year and End year controls to filter the displayed period; the KPI cards, trend chart, annual-change chart and table update together.

## What it shows

- Latest selected internet-use share (% of population).
- Change across the selected period in percentage points.
- Unweighted average of the annual observations in the selected range.
- Largest year-on-year increase in the selected range.
- Annual trend and annual percentage-point changes.

## Data and definitions

Uses the fixed 2000–2024 portfolio extract in `data/nigeria_internet_usage.csv`, sourced from World Bank World Development Indicators indicator `IT.NET.USER.ZS` (underlying source: ITU). See the main [project README](README.md) for source links, licensing, data definition, methodology and limitations.

The dashboard uses the same rounded values as the CSV. It is descriptive and does not claim causality. The selected-period average is an unweighted mean of annual indicator values.

## Verification

The dashboard logic is plain JavaScript and the data are embedded in the HTML so it can be opened offline. The repository's analytics CI also validates the underlying SQL project and dataset. Check the displayed values against the CSV when making changes.
