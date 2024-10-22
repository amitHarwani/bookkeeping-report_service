export class GetPurchaseReportRequest {
    constructor(
        public companyId: number,
        public fromDateTime: string,
        public toDateTime: string,
        public dayStartTime: string,
        public timezone: string,
        public decimalRoundTo: number
    ){}
}

export class GetPurchaseReportResponse {
    constructor(
        public message: string
    ){}
}