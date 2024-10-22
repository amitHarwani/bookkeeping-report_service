export const SALE_RETURN_QUERIES = {
    saleReturnsQuery: `
    select 
	sr.created_at ,
	sr.sale_return_number ,
	sr.invoice_number ,
	sr.subtotal ,
	sr.tax_percent ,
	sr.tax_name ,
	sr.tax , 
	sr.total_after_tax 
    from 
    sale_returns sr 
    where sr.company_id = $1
    and 
    sr.created_at >= $2 and sr.created_at <= $3
	order by sr.created_at
    `,
}