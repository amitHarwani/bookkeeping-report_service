export class GetPurchaseReturnReportRequest {
    constructor(
        public companyId: number,
        public fromDateTime: string,
        public toDateTime: string,
        public dayStartTime: string,
        public timezone: string,
        public decimalRoundTo: number
    ){}
}

export class GetPurchaseReturnReportResponse {
    constructor(
        public message: string
    ){}
}