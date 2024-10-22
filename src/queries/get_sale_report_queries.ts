
export const SALE_REPORT_QUERIES = {
    salesQuery: `
    select 
	s.created_at,
	s.invoice_number ,
	case when s.party_name is null then 'NA' else s.party_name end as party_name ,
	s.subtotal ,
	s.discount ,
	s.total_after_discount,
	s.tax_percent ,
	s.tax_name ,
	s.tax ,
	s.total_after_tax ,
	s.is_credit ,
	case when s.is_fully_paid is true then 'YES' else 'NO' end as is_fully_paid ,
	s.amount_paid ,
	s.amount_due ,
	s.payment_due_date,
	s.payment_completion_date
    from sales s 
    where s.company_id = $1
    and 
    s.created_at >= $2 and s.created_at <= $3
	order by s.created_at 
    `
}