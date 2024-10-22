export const PURCHASE_RETURN_QUERIES = {
    purchaseReturnsQuery: `
    select 
	pr.created_at ,
	pr.purchase_return_number ,
	p.invoice_number ,
	p.party_name ,
	pr.subtotal ,
	pr.tax_percent ,
	pr.tax_name ,
	pr.tax ,
	pr.total_after_tax 
    from 
    purchase_returns pr left join purchases p on pr.purchase_id = p.purchase_id 
    where pr.company_id = $1
    and 
    pr.created_at >= $2 and pr.created_at <= $3
	order by pr.created_at 
    `,
}