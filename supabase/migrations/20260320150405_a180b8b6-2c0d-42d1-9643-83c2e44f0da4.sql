UPDATE inventory SET stock_quantity = GREATEST(stock_quantity, 20)
WHERE product_id IN (
  SELECT id FROM products WHERE sub_category_id IN (SELECT id FROM sub_categories WHERE slug = 'series-2000')
)