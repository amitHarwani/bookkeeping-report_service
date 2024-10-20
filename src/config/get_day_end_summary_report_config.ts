import ExcelJS from "exceljs";

export const WORKSHEET_NAME = "Day End Summary Report";

export enum HEADER_KEYS {
    startTime = "start_time",
    endTime = "end_time",
    totalCashIn = "total_cash_in",
    totalCashOut = "total_cash_out",
    totalSales = "total_sales",
    totalPurchases = "total_purchases",
    aggregatedProfit = "aggregated_profit"
}

export const WORKSHEET_COLUMNS: Partial<ExcelJS.Column>[] = [
    {
        header: "Start Time",
        key: "start_time",
        style: { font: { size: 10 } },
    },
    {
        header: "End Time",
        key: "end_time",
        style: { font: { size: 10 } },
    },
    {
        header: "Total Cash In",
        key: "total_cash_in",
        style: { font: { size: 10 } },
    },
    {
        header: "Total Cash Out",
        key: "total_cash_out",
        style: { font: { size: 10 } },
    },
    {
        header: "Total Sales",
        key: "total_sales",
        style: { font: { size: 10 } },
    },
    {
        header: "Total Purchases",
        key: "total_purchases",
        style: { font: { size: 10 } },
    },
    {
        header: "Total Profit",
        key: "aggregated_profit",
        style: { font: { size: 10 } },
    },
];

