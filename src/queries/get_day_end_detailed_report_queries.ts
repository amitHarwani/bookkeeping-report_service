export const DAY_END_DETAILED_QUERIES = {
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
    `,

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
    `,

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
    `,

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
    `,

    cashInOutDetailsQuery: `
    select 
	cio.cash_in ,
	s.invoice_number as sale_invoice_number,
	cio.cash_out ,
	p.invoice_number as purchase_invoice_number
    from
    cash_in_out cio left join sales s on cio.sale_id = s.sale_id left join purchases p on cio.purchase_id = p.purchase_id 
    where cio.company_id = $1
    and
    cio.transaction_date_time >= $2 and cio.transaction_date_time <= $3
    `
}