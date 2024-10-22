export class GetDayEndDetailsReportRequest {
    constructor(
        public companyId: number,
        public fromDateTime: string,
        public dayStartTime: string,
        public timezone: string,
        public decimalRoundTo: number
    ){}
}

export class GetDayEndDetailedReportResponse {
    constructor(
        public message: string
    ){}
}