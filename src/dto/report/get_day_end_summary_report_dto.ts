export class GetDayEndSummaryReportRequest {
    constructor(
        public companyId: number,
        public fromDateTime: string,
        public toDateTime: string,
        public dayStartTime: string,
        public timezone: string,
        public decimalRoundTo: number
    ){}
}

export class GetDayEndSummaryReportResponse {
    constructor(
        public message: string
    ){}
}