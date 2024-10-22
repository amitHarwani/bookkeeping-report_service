export const PURCHASE_REPORT_QUERIES = {
    purchasesQuery: `
    select 
	p.created_at,
	p.party_name ,
	p.invoice_number ,
	p.subtotal ,
	p.discount ,
	p.total_after_discount ,
	p.tax_percent ,
	p.tax_name,
	p.tax,
	p.total_after_tax ,
	p.is_credit ,
	case when p.is_fully_paid is true then 'YES' else 'NO' end as is_fully_paid ,
	p.amount_paid ,
	p.amount_due ,
	p.payment_due_date ,
	p.payment_completion_date ,
	p.receipt_number 
    from purchases p 
    where p.company_id = $1
    and 
    p.created_at >= $2 and p.created_at <= $3
	order by p.created_at
    `
}