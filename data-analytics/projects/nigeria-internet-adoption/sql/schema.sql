CREATE TABLE IF NOT EXISTS internet_usage (
    year INTEGER PRIMARY KEY CHECK (year BETWEEN 1960 AND 2100),
    internet_users_pct REAL NOT NULL CHECK (internet_users_pct >= 0 AND internet_users_pct <= 100)
);
