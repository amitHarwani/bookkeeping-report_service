export class GetSaleReportRequest {
    constructor(
        public companyId: number,
        public fromDateTime: string,
        public toDateTime: string,
        public dayStartTime: string,
        public timezone: string,
        public decimalRoundTo: number
    ){}
}

export class GetSaleReportResponse {
    constructor(
        public message: string
    ){}
}