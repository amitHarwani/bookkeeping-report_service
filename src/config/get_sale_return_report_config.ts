import ExcelJS from "exceljs";

export const WORKSHEETS: {[worksheetKey: string]: {worksheetName: string, columns: Partial<ExcelJS.Column>[]}} = {
    SALE_RETURNS: {worksheetName: "Sale Returns", columns:[
        {
            header: "Created At",
            key: "created_at",
            style: { font: { size: 10 } },
        },
        {
            header: "Sale Return Number",
            key: "sale_return_number",
            style: { font: { size: 10 } },
        },
        {
            header: "Invoice Number",
            key: "invoice_number",
            style: { font: { size: 10 } },
        },
        {
            header: "Subtotal",
            key: "subtotal",
            style: { font: { size: 10 } },
        },
        {
            header: "Tax Percent",
            key: "tax_percent",
            style: { font: { size: 10 } },
        },
        {
            header: "Tax Name",
            key: "tax_name",
            style: { font: { size: 10 } },
        },
        {
            header: "Tax",
            key: "tax",
            style: { font: { size: 10 } },
        },
        {
            header: "Total After Tax",
            key: "total_after_tax",
            style: { font: { size: 10 } },
        },
    ]},
};

export enum HEADER_KEYS {
    createdAt = "created_at",
    saleReturnNumber = "sale_return_number",
    invoiceNumber = "invoice_number",
    subtotal = "subtotal",
    taxPercent = "tax_percent",
    taxName = "tax_name",
    tax = "tax",
    totalAfterTax = "total_after_tax"
}

/* Fields whose date time must be converted to the companies timezone */
export const DateTimeConversionFields = {
    [HEADER_KEYS.createdAt] : true,
}

/* Number Fields */
export const NumberFields = {
    [HEADER_KEYS.subtotal]: true,
    [HEADER_KEYS.tax]: true,
    [HEADER_KEYS.totalAfterTax]: true,
    [HEADER_KEYS.taxPercent]: true 
}