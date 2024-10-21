import { Report } from "../../db";


export class GetAllReportsRequest {
    constructor(
        public companyId: number,
        public pageSize: number,
        public cursor?: {
            createdAt: Date;
            reportId: number;
        }
    ) {}
}

export class GetAllReportsResponse {
    constructor(
        public reports: Array<Report>,
        public hasNextPage: boolean,
        public nextPageCursor?: {
            createdAt: Date;
            reportId: number;
        }
    ) {}
}
