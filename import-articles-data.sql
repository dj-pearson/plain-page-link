\copy articles FROM '/tmp/articles_rows.csv' WITH (FORMAT csv, HEADER true);
SELECT COUNT(*) FROM articles;
