-- Allow anonymous users to access invoices via the get_invoice_order function
GRANT EXECUTE ON FUNCTION public.get_invoice_order(text) TO anon;
GRANT EXECUTE ON FUNCTION public.get_invoice_order(text) TO authenticated;
