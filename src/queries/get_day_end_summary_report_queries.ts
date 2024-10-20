export const DAY_END_SUMMARY_QUERIES = {
    cashInOutQuery: `
    WITH date_series AS (
        SELECT generate_series(
            DATE_TRUNC('day', $1::TIMESTAMP) + $2::INTERVAL,
            DATE_TRUNC('day', $3::TIMESTAMP) + INTERVAL '1 day' + $4::INTERVAL,
            '1 day'
        ) AS day_start
    )
    SELECT 
        ds.day_start AS start_time,
        ds.day_start + interval '23 hours 59 minutes 59 seconds' AS end_time,
        sum(cio.cash_in) as total_cash_in,
        sum(cio.cash_out) as total_cash_out
    FROM 
    date_series ds left join
    cash_in_out cio 
    on cio.transaction_date_time >= ds.day_start and cio.transaction_date_time < ds.day_start + interval '1 day'
    WHERE cio.company_id = $5 or cio.company_id is null
    GROUP BY 
        ds.day_start
    order by ds.day_start
    `,

    totalSalesAndPurchasesQuery: `
    WITH date_series AS (
    SELECT generate_series(
        DATE_TRUNC('day', $1::TIMESTAMP) + $2::INTERVAL, 
        DATE_TRUNC('day', $3::TIMESTAMP) + INTERVAL '1 day' + $4::INTERVAL,
        '1 day'
        ) AS day_start
    )
    select 
    	ds.day_start AS start_time,
        ds.day_start + interval '23 hours 59 minutes 59 seconds' AS end_time,
    	sum(s.total_after_tax) as total_sales,
    	sum(p.total_after_tax) as total_purchases
    from 
    date_series ds left join sales s
    on s.created_at >= ds.day_start and s.created_at < ds.day_start + interval '1 day' 
    left join purchases p 
    on p.created_at >= ds.day_start and p.created_at < ds.day_start + interval '1 day' 
    WHERE p.company_id = $5 or p.company_id is null
    GROUP BY 
        ds.day_start
    order by ds.day_start
    `,

    aggregatedProfitQuery: `
    WITH date_series AS (
    SELECT generate_series(
        DATE_TRUNC('day', $1::TIMESTAMP) + $2::INTERVAL, 
        DATE_TRUNC('day', $3::TIMESTAMP) + INTERVAL '1 day' + $4::INTERVAL,
        '1 day'
        ) AS day_start
    )
    select 
    	ds.day_start AS start_time,
        ds.day_start + interval '23 hours 59 minutes 59 seconds' AS end_time,
    	sum(sip.total_profit) as aggregated_profit
    from 
    date_series ds left join sales s
    on s.created_at >= ds.day_start and s.created_at < ds.day_start + interval '1 day' 
    left join sale_item_profits sip 
    on sip.sale_id = s.sale_id 
    WHERE sip.company_id = $5 or sip.company_id is null
    GROUP BY 
        ds.day_start
    order by ds.day_start
`,
};
