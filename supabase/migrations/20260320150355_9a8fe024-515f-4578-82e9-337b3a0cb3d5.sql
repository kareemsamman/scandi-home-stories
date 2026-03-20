UPDATE inventory 
SET variation_key = 'combo:' || split_part(variation_key, '__', 1) || '|' || split_part(variation_key, '__', 2)
WHERE product_id IN (
  SELECT id FROM products WHERE sub_category_id IN (SELECT id FROM sub_categories WHERE slug = 'series-2000')
)
AND variation_key LIKE '%__%' 
AND variation_key NOT LIKE 'combo:%'