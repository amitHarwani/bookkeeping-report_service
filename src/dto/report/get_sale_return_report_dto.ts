export class GetSaleReturnReportRequest {
    constructor(
        public companyId: number,
        public fromDateTime: string,
        public toDateTime: string,
        public dayStartTime: string,
        public timezone: string,
        public decimalRoundTo: number
    ){}
}

export class GetSaleReturnReportResponse {
    constructor(
        public message: string
    ){}
}