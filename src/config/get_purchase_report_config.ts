import ExcelJS from "exceljs";

export const WORKSHEETS: {[worksheetKey: string]: {worksheetName: string, columns: Partial<ExcelJS.Column>[]}} = {
    PURCHASES: {worksheetName: "Purchases", columns:[
        {
            header: "Created At",
            key: "created_at",
            style: { font: { size: 10 } },
        },
        {
            header: "Party Name",
            key: "party_name",
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
            header: "Discount",
            key: "discount",
            style: { font: { size: 10 } },
        },
        {
            header: "Total After Discount",
            key: "total_after_discount",
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
        {
            header: "Is Credit",
            key: "is_credit",
            style: { font: { size: 10 } },
        },
        {
            header: "Fully Paid",
            key: "is_fully_paid",
            style: { font: { size: 10 } },
        },
        {
            header: "Amount Paid",
            key: "amount_paid",
            style: { font: { size: 10 } },
        },
        {
            header: "Amount Due",
            key: "amount_due",
            style: { font: { size: 10 } },
        },
        {
            header: "Payment Due Date",
            key: "payment_due_date",
            style: { font: { size: 10 } },
        },
        {
            header: "Payment Completion Date",
            key: "payment_completion_date",
            style: { font: { size: 10 } },
        },
        {
            header: "Receipt Number",
            key: "receipt_number",
            style: { font: { size: 10 } },
        },
    ]},
};

export enum HEADER_KEYS {
    createdAt = "created_at",
    invoiceNumber = "invoice_number",
    partyName = "party_name",
    subtotal = "subtotal",
    discount = "discount",
    totalAfterDiscount = "total_after_discount",
    taxPercent = "tax_percent",
    taxName = "tax_name",
    tax = "tax",
    totalAfterTax = "total_after_tax",
    isCredit = "is_credit",
    isFullyPaid = "is_fully_paid",
    amountPaid = "amount_paid",
    amountDue = "amount_due",
    paymentDueDate = "payment_due_date",
    paymentCompletionDate = "payment_completion_date"
}

/* Fields whose date time must be converted to the companies timezone */
export const DateTimeConversionFields = {
    [HEADER_KEYS.createdAt] : true,
    [HEADER_KEYS.paymentDueDate]: true,
    [HEADER_KEYS.paymentCompletionDate]: true
}

/* Number Fields */
export const NumberFields = {
    [HEADER_KEYS.subtotal]: true,
    [HEADER_KEYS.discount]: true,
    [HEADER_KEYS.totalAfterDiscount]: true,
    [HEADER_KEYS.tax]: true,
    [HEADER_KEYS.totalAfterTax]: true,
    [HEADER_KEYS.amountPaid]: true,
    [HEADER_KEYS.amountDue]: true,
    [HEADER_KEYS.taxPercent]: true 
}