-- Remove demolished gas stations from the database
-- Phillips 66 on Gordon Dr was torn down (as of March 2026)
-- gas_prices rows are automatically cleaned up via ON DELETE CASCADE

DELETE FROM gas_stations
WHERE LOWER(brand_name) LIKE '%phillips 66%'
AND LOWER(street_address) LIKE '%gordon%';
