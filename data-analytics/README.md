# MercySoul Sales Analysis — Data Analyst Portfolio Project

**Author:** Anuoluwapo Adeoye  
**Portfolio:** [GitHub](https://github.com/kuyoung44)  
**Project type:** Beginner business analytics case study  
**Tools:** Python, pandas, Matplotlib, CSV, unittest

## Executive summary

This project demonstrates a reproducible workflow for validating a small sales dataset, calculating business KPIs, comparing service performance, and generating charts and a written report. The supplied dataset is deliberately synthetic: it is a learning example, not MercySoul's actual sales, customers, or financial performance.

**Sample result:** 10 completed orders generated ₦215,000 in recorded sample revenue. Website Design has the highest revenue (₦100,000; 46.5%), while AI Artwork has the most orders (5; 50%). These are descriptive findings about this sample only.

## Business questions

1. How much sample revenue was recorded from completed orders?
2. Which service contributes the most sample revenue?
3. Which service has the highest order count?
4. What data-quality checks are necessary before trusting the summary?

## Repository structure

```text
data-analytics/
├── data/mercysoul_sales.csv
├── tests/test_analysis.py
├── analysis.py
├── requirements.txt
└── README.md
```

Running the analysis creates an `outputs/` folder containing a service summary CSV, a Markdown report, and two PNG charts.

## Reproduce

Python 3.10 or newer is recommended.

```bash
python -m pip install -r requirements.txt
python analysis.py
python -m unittest discover -s tests -v
```

## Data dictionary

| Field | Meaning |
|---|---|
| `order_id` | Fictional unique order identifier |
| `order_date` | Sample order date (October 2026) |
| `service` | Service category |
| `customer_segment` | Fictional customer segment |
| `order_value_ngn` | Recorded sample order value in Nigerian naira |
| `status` | Order status; only `Completed` rows contribute to revenue |

## Method

- Validate required columns, blank critical fields, unique order IDs, parseable dates, numeric order values, and non-negative amounts.
- Standardise order status and service labels for grouping.
- Exclude non-completed orders from completed-order revenue metrics.
- Calculate total revenue, completed-order count, average order value, service order count, order share, revenue share, and average order value by service.
- Export reproducible tables and charts; test key KPIs and data-quality failure cases.

## Findings

| Service | Orders | Revenue | Order share | Revenue share |
|---|---:|---:|---:|---:|
| Website Design | 2 | ₦100,000 | 20.0% | 46.5% |
| Chatbot | 1 | ₦50,000 | 10.0% | 23.3% |
| Automation | 2 | ₦40,000 | 20.0% | 18.6% |
| AI Artwork | 5 | ₦25,000 | 50.0% | 11.6% |

The figures show why order volume and revenue should be analysed separately. A high order count does not necessarily mean the highest revenue contribution.

## Business recommendations and what to measure next

1. Investigate delivery hours, direct costs, revisions and customer acquisition costs before comparing service profitability.
2. Explore why AI Artwork has the largest sample order count; use real lead and repeat-purchase data before investing in bundles.
3. Track qualified leads, conversion rate, revenue, gross margin, delivery time, refunds, satisfaction and repeat purchase rate.
4. Collect a larger time series before making pricing, hiring or marketing decisions.

## Limitations and ethics

- All 10 rows are fictional and intentionally small.
- No costs, refunds, lead funnel, acquisition channel, delivery hours or customer outcomes are provided.
- Revenue is not profit; no causal claims or market-demand conclusions are justified.
- No personal customer information is included.

## Skills demonstrated

Data ingestion, validation, cleaning, aggregation, KPI calculation, percentage denominators, data visualisation, automated testing, documentation, and business interpretation.
