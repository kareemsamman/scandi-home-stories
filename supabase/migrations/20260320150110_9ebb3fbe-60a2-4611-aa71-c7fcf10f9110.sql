DELETE FROM inventory WHERE product_id IN (
  SELECT id FROM products WHERE sub_category_id IN (SELECT id FROM sub_categories WHERE slug = 'series-2000')
);

INSERT INTO inventory (product_id, variation_key, stock_quantity, low_stock_threshold)
SELECT p.id, c.tax_id || '__' || s.sid,
  CASE
    WHEN c.tax_id = 'black' THEN CASE s.idx WHEN 0 THEN 50 WHEN 1 THEN 45 WHEN 2 THEN 40 WHEN 3 THEN 40 WHEN 4 THEN 25 ELSE 15 END
    WHEN c.tax_id = 'white' THEN CASE s.idx WHEN 0 THEN 45 WHEN 1 THEN 40 WHEN 2 THEN 38 WHEN 3 THEN 35 WHEN 4 THEN 20 ELSE 12 END
    WHEN c.tax_id = 'charcoal' THEN CASE s.idx WHEN 0 THEN 40 WHEN 1 THEN 35 WHEN 2 THEN 32 WHEN 3 THEN 30 WHEN 4 THEN 18 ELSE 10 END
    WHEN c.tax_id = 'bronze' THEN CASE s.idx WHEN 0 THEN 30 WHEN 1 THEN 25 WHEN 2 THEN 22 WHEN 3 THEN 20 WHEN 4 THEN 12 ELSE 8 END
    ELSE CASE s.idx WHEN 0 THEN 35 WHEN 1 THEN 30 WHEN 2 THEN 28 WHEN 3 THEN 25 WHEN 4 THEN 15 ELSE 10 END
  END,
  5
FROM products p
CROSS JOIN (
  SELECT DISTINCT elem->>'tax_id' as tax_id
  FROM products pp, jsonb_array_elements(pp.colors) elem
  WHERE pp.sub_category_id IN (SELECT id FROM sub_categories WHERE slug = 'series-2000')
) c
CROSS JOIN (VALUES ('s3m',0),('s4m',1),('s5m',2),('s6m',3),('s65m',4),('s7m',5)) s(sid,idx)
WHERE p.sub_category_id IN (SELECT id FROM sub_categories WHERE slug = 'series-2000')
  AND EXISTS (
    SELECT 1 FROM jsonb_array_elements(p.colors) el WHERE el->>'tax_id' = c.tax_id
  )
ON CONFLICT (product_id, variation_key) DO UPDATE SET stock_quantity = EXCLUDED.stock_quantity