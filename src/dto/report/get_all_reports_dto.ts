import { Report } from "../../db";


export class GetAllReportsRequest {
    constructor(
        public companyId: number,
        public pageSize: number,
        public cursor?: {
            createdAt: Date;
            reportId: number;
        },
        public select?: [keyof Report]
    ) {}
}

export class GetAllReportsResponse<T> {
    constructor(
        public reports: T,
        public hasNextPage: boolean,
        public nextPageCursor?: {
            createdAt: Date;
            reportId: number;
        }
    ) {}
}
