# MercySoul Sales Analysis — First Data Analyst Project

**Author:** Anuoluwapo Adeoye  
**Portfolio:** [github.com/kuyoung44](https://github.com/kuyoung44)  
**Project type:** Beginner business analytics case study  
**Tools:** Python, pandas, CSV, Matplotlib (optional)

## Important data note

This is a **small synthetic teaching dataset**, created for portfolio practice. It is not MercySoul's actual customer, transaction, or financial record. It contains 10 fictional orders totalling ₦215,000. Do not present these figures as real business performance.

## Business question

Which MercySoul service contributes the most revenue, which is most frequently ordered, and what should a small digital-services business investigate next?

## Dataset

`data/mercysoul_sales.csv` contains 10 fictional completed orders across four services. Fields:

- `order_id`: fictional order identifier
- `order_date`: sample date in October 2026
- `service`: service category
- `customer_segment`: fictional segment
- `order_value_ngn`: order value in Nigerian naira
- `status`: order status

## How to reproduce

Requires Python 3.10+ and pandas.

```bash
python -m pip install pandas
python analysis.py
```

## Findings from this sample

- Total revenue: **₦215,000**
- Completed orders: **10**
- Average order value: **₦21,500**
- Highest-revenue service: **Website Design (₦100,000; 46.5% of revenue)**
- Most frequently ordered service: **AI Artwork (5 orders; 50% of orders)**

Revenue and order frequency answer different questions. Artwork is most frequent in this sample, while Website Design contributes the most revenue.

## Business recommendations

1. Investigate the time and cost required to deliver website projects before deciding whether they are the most profitable service. Revenue alone is not profit.
2. Review why AI Artwork attracts more orders; test bundles or repeat-purchase offers.
3. Track leads, conversion rate, delivery cost, customer satisfaction and repeat orders in a real business dataset.
4. Collect more observations before making long-term pricing or staffing decisions.

## Limitations

This sample is intentionally tiny and synthetic. It cannot establish market demand, customer behaviour, profitability, seasonality, or statistically reliable trends. Findings describe only these 10 sample rows.

## Next steps

- Add a larger, ethically sourced public dataset.
- Practise data validation and cleaning.
- Add visualisations and SQL queries.
- Publish reproducible outputs with clear source notes.
