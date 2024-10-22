import { reports } from "db_service";
import { and, asc, desc, eq, gt, or, sql } from "drizzle-orm";
import ExcelJS from "exceljs";
import { NextFunction, Request, Response } from "express";
import fs from "fs";
import moment from "moment";
import QueryStream from "pg-query-stream";
import * as DAY_END_SUMMARY_CONFIG from "../config/get_day_end_summary_report_config";
import * as DAY_END_DETAILED_CONFIG from "../config/get_day_end_detailed_report_config";
import * as SALE_REPORT_CONFIG from "../config/get_sale_report_config";
import * as PURCHASE_REPORT_CONFIG from "../config/get_purchase_report_config";
import * as SALE_RETURN_REPORT_CONFIG from "../config/get_sale_return_report_config";
import {
    DATE_TIME_FORMATS,
    REPORT_STATUS_TYPES,
    REPORT_TYPES,
} from "../constants";
import * as db from "../db";
import { DeleteReportResponse } from "../dto/report/delete_report_dto";
import {
    GetAllReportsRequest,
    GetAllReportsResponse,
} from "../dto/report/get_all_reports_dto";
import {
    GetDayEndDetailedReportResponse,
    GetDayEndDetailsReportRequest,
} from "../dto/report/get_day_end_detailed_report_dto";
import {
    GetDayEndSummaryReportRequest,
    GetDayEndSummaryReportResponse,
} from "../dto/report/get_day_end_summary_report_dto";
import { GetReportResponse } from "../dto/report/get_report_dto";
import { DAY_END_SUMMARY_QUERIES } from "../queries/get_day_end_summary_report_queries";
import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse";
import asyncHandler from "../utils/async_handler";
import {
    deleteFile,
    getFileIDFromWebLink,
    uploadReportFile,
} from "../utils/cloud_storage";
import {
    addHeaderStyle,
    autosizeAllColumns,
    autosizeColumn,
    convertUTCStringToTimezonedString,
    getTempReportFilePath,
} from "../utils/common_utils";
import { DAY_END_DETAILED_QUERIES } from "../queries/get_day_end_detailed_report_queries";
import logger from "../utils/logger";
import {
    GetSaleReportRequest,
    GetSaleReportResponse,
} from "../dto/report/get_sale_report_dto";
import { SALE_REPORT_QUERIES } from "../queries/get_sale_report_queries";
import { GetPurchaseReportRequest, GetPurchaseReportResponse } from "../dto/report/get_purchase_report_dto";
import { PURCHASE_REPORT_QUERIES } from "../queries/get_purchase_report_queries";
import { GetSaleReturnReportRequest, GetSaleReturnReportResponse } from "../dto/report/get_sale_return_report_dto";
import { SALE_RETURN_QUERIES } from "../queries/get_sale_return_report_queries";

export const getReport = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
        /* Company Id and report id  */
        const companyId = Number(req?.query?.companyId);
        const reportId = Number(req?.query?.reportId);

        /* Finding the report */
        const reportsFound = await db.db
            .select()
            .from(reports)
            .where(
                and(
                    eq(reports.companyId, companyId),
                    eq(reports.reportId, reportId),
                    eq(reports.requestedBy, req?.user?.userId as string)
                )
            );

        /* Report not found */
        if (!reportsFound.length) {
            throw new ApiError(404, "no report found", []);
        }

        return res.status(200).json(
            new ApiResponse<GetReportResponse>(200, {
                report: reportsFound[0],
            })
        );
    }
);
export const getAllReports = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
        const body = req.body as GetAllReportsRequest;

        let whereClause;

        /* If cursor is passed: Next page is being fetched */
        if (body?.cursor) {
            whereClause = and(
                or(
                    sql`${reports.createdAt} < ${body.cursor.createdAt}`,
                    and(
                        sql`${reports.createdAt} = ${body.cursor.createdAt}`,
                        gt(reports.reportId, body.cursor.reportId)
                    )
                ),
                eq(reports.companyId, body.companyId),
                eq(reports.requestedBy, req?.user?.userId as string)
            );
        } else {
            whereClause = and(
                eq(reports.companyId, body.companyId),
                eq(reports.requestedBy, req?.user?.userId as string)
            );
        }

        /* DB Query */
        const allReports = await db.db
            .select()
            .from(reports)
            .where(whereClause)
            .limit(body.pageSize)
            .orderBy(desc(reports.createdAt), asc(reports.reportId));

        /* Setting the next page cursor according to the last item values */
        let nextPageCursor;
        const lastItem = allReports?.[allReports.length - 1];
        if (lastItem) {
            nextPageCursor = {
                reportId: lastItem.reportId,
                createdAt: lastItem.createdAt as Date,
            };
        }

        return res.status(200).json(
            new ApiResponse<GetAllReportsResponse>(200, {
                reports: allReports,
                hasNextPage: nextPageCursor ? true : false,
                nextPageCursor: nextPageCursor,
            })
        );
    }
);

export const deleteReport = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
        /* Company Id and Report ID */
        const companyId = Number(req?.query?.companyId);
        const reportId = Number(req?.query?.reportId);

        /* Deleting the report from reports table */
        const deletedReport = await db.db
            .delete(reports)
            .where(
                and(
                    eq(reports.reportId, reportId),
                    eq(reports.companyId, companyId),
                    eq(reports.requestedBy, req?.user?.userId as string)
                )
            )
            .returning();

        /* If report does not exist */
        if (!deletedReport.length) {
            throw new ApiError(400, "invalid details passed", []);
        }

        /* Report Link */
        const reportLink = deletedReport[0].reportLink;

        /* If report link exists */
        if (reportLink) {
            /* File ID */
            const fileId = getFileIDFromWebLink(reportLink);

            /* If File ID exists, delete the file from cloud storage */
            if (fileId) {
                await deleteFile(fileId);
            }
        }
        return res.status(200).json(
            new ApiResponse<DeleteReportResponse>(200, {
                message: "report deleted successfully",
            })
        );
    }
);

export const getDayEndSummaryReport = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
        /* Request Body */
        const body = req.body as GetDayEndSummaryReportRequest;

        /* End Time for each day is the day start time - 1 second */
        const endTime = moment(`${body.toDateTime} ${body.dayStartTime}`)
            .subtract(1, "seconds")
            .format("HH:mm:ss");

        /* Inserting into reports table */
        const reportRequestAdded = await db.db
            .insert(reports)
            .values({
                reportName: REPORT_TYPES.dayEndSummaryReport,
                companyId: body.companyId,
                status: REPORT_STATUS_TYPES.inProgress,
                fromDateTime: moment
                    .utc(`${body.fromDateTime} ${body.dayStartTime}`)
                    .toDate(),
                toDateTime: moment
                    .utc(`${body.toDateTime} ${endTime}`)
                    .add(1, "day")
                    .toDate(),
                requestedBy: req?.user?.userId,
            })
            .returning();

        /* Sending the response */
        res.status(200).json(
            new ApiResponse<GetDayEndSummaryReportResponse>(200, {
                message: "in progress",
            })
        );

        /* Temporary File Name */
        const fileName = getTempReportFilePath();

        /* Excel Workbook */
        const workbook = new ExcelJS.Workbook();

        /* Adding the worksheet to the workbook */
        const worksheet = workbook.addWorksheet(
            DAY_END_SUMMARY_CONFIG.WORKSHEET_NAME
        );

        /* Initializing Worksheet Columns */
        worksheet.columns = DAY_END_SUMMARY_CONFIG.WORKSHEET_COLUMNS;

        /* Header Keys for the worksheet */
        const HEADER_KEYS = DAY_END_SUMMARY_CONFIG.HEADER_KEYS;

        /* Adding header style to the worksheet */
        addHeaderStyle(worksheet, 1);

        /* Getting the postgres client */
        const client = await db.getClient();

        let reportLink;

        try {
            /* Cash In Out Query */
            const cashInOutQueryPromise = new Promise((resolve, reject) => {
                /* Cash In Out Query Stream */
                const query = new QueryStream(
                    DAY_END_SUMMARY_QUERIES.cashInOutQuery,
                    [
                        `${body.fromDateTime} 00:00:00`,
                        body.dayStartTime,
                        `${body.toDateTime} 00:00:00`,
                        endTime,
                        body.companyId,
                    ]
                );

                const stream = client.query(query);

                /* On Data */
                stream.on("data", (chunk) => {
                    /* Converting UTC times to the timezone passed */
                    chunk.start_time = convertUTCStringToTimezonedString(
                        chunk.start_time,
                        body.timezone,
                        DATE_TIME_FORMATS.displayedDateTimeFormat24hr
                    );
                    chunk.end_time = convertUTCStringToTimezonedString(
                        chunk.end_time,
                        body.timezone,
                        DATE_TIME_FORMATS.displayedDateTimeFormat24hr
                    );

                    /* Converting numeric string type to Number */
                    chunk.total_cash_in = Number(chunk.total_cash_in);
                    chunk.total_cash_out = Number(chunk.total_cash_out);

                    /* Adding row to the worksheet */
                    worksheet.addRow(chunk);

                    /* Autosizing column as data is being added */
                    autosizeColumn(
                        worksheet,
                        HEADER_KEYS.startTime,
                        chunk.start_time
                    );
                    autosizeColumn(
                        worksheet,
                        HEADER_KEYS.endTime,
                        chunk.end_time
                    );
                    autosizeColumn(
                        worksheet,
                        HEADER_KEYS.totalCashIn,
                        chunk.total_cash_in
                    );
                    autosizeColumn(
                        worksheet,
                        HEADER_KEYS.totalCashOut,
                        chunk.total_cash_out
                    );
                });

                /* On End resolve the promise */
                stream.on("end", async () => {
                    resolve(true);
                });

                /* On Error Reject the promies */
                stream.on("error", () => {
                    reject();
                });
            });

            /* Total Sales and purchases query */
            const totalSalesAndPurchasesQueryPromise = new Promise(
                (resolve, reject) => {
                    /* Query Stream */
                    const query = new QueryStream(
                        DAY_END_SUMMARY_QUERIES.totalSalesAndPurchasesQuery,
                        [
                            `${body.fromDateTime} 00:00:00`,
                            body.dayStartTime,
                            `${body.toDateTime} 00:00:00`,
                            endTime,
                            body.companyId,
                        ]
                    );

                    const stream = client.query(query);

                    /* Index for row number: As all the queries will have the same number of rows
                because of ordering by start time and including all days*/
                    let index = 2;
                    stream.on("data", (chunk) => {
                        /* Converting to number type */
                        chunk.total_sales = Number(chunk.total_sales);
                        chunk.total_purchases = Number(chunk.total_purchases);

                        /* Getting the row */
                        const currentRow = worksheet.getRow(index);

                        /* Updating the row at the appropriate column cell */
                        currentRow.getCell(HEADER_KEYS.totalSales).value =
                            chunk.total_sales;
                        currentRow.getCell(HEADER_KEYS.totalPurchases).value =
                            chunk.total_purchases;

                        /* Autosizing columns */
                        autosizeColumn(
                            worksheet,
                            HEADER_KEYS.totalSales,
                            chunk.total_sales
                        );
                        autosizeColumn(
                            worksheet,
                            HEADER_KEYS.totalPurchases,
                            chunk.total_purchases
                        );

                        /* Incrementing index */
                        ++index;
                    });

                    /* On end resolve the promise */
                    stream.on("end", async () => {
                        resolve(true);
                    });

                    /* On error reject the promise */
                    stream.on("error", () => {
                        reject();
                    });
                }
            );

            /* Aggregated Profit Query Promise */
            const aggregatedProfitQueryPromise = new Promise(
                (resolve, reject) => {
                    /* Query Stream */
                    const query = new QueryStream(
                        DAY_END_SUMMARY_QUERIES.aggregatedProfitQuery,
                        [
                            `${body.fromDateTime} 00:00:00`,
                            body.dayStartTime,
                            `${body.toDateTime} 00:00:00`,
                            endTime,
                            body.companyId,
                        ]
                    );

                    const stream = client.query(query);

                    /* Index for row number: As all the queries will have the same number of rows
                because of ordering by start time and including all days*/
                    let index = 2;
                    stream.on("data", (chunk) => {
                        /* Converting to number type */
                        chunk.aggregated_profit = Number(
                            chunk.aggregated_profit
                        );

                        /* Getting the row */
                        const currentRow = worksheet.getRow(index);

                        /* Updating the row at the appropriate column cell */
                        currentRow.getCell(HEADER_KEYS.aggregatedProfit).value =
                            chunk.aggregated_profit;

                        /* Autosizing columns */
                        autosizeColumn(
                            worksheet,
                            HEADER_KEYS.aggregatedProfit,
                            chunk.aggregated_profit
                        );

                        ++index;
                    });

                    stream.on("end", async () => {
                        resolve(true);
                    });
                    stream.on("error", () => {
                        reject();
                    });
                }
            );

            /* Wait for all promises to resolve */
            await Promise.all([
                cashInOutQueryPromise,
                totalSalesAndPurchasesQueryPromise,
                aggregatedProfitQueryPromise,
            ]);

            /* Write to file */
            await workbook.xlsx.writeFile(fileName);

            /* Uploading report to cloud storage and storing the report link */
            reportLink = await uploadReportFile(
                fileName,
                `${REPORT_TYPES.dayEndSummaryReport}-${crypto.randomUUID()}`
            );

            /* Update reports table, with status as complete and the report link
            Surrounding in try catch as the response is already sent.
            */
            await db.db
                .update(reports)
                .set({
                    reportLink: reportLink,
                    status: REPORT_STATUS_TYPES.completed,
                })
                .where(eq(reports.reportId, reportRequestAdded[0].reportId));
        } catch (error) {
            /* On error update reports status in DB */
            await db.db
                .update(reports)
                .set({
                    status: REPORT_STATUS_TYPES.error,
                })
                .where(eq(reports.reportId, reportRequestAdded[0].reportId));
        } finally {
            /* Always release the client */
            client.release();

            /* Delete the temporary file */
            fs.unlinkSync(fileName);
        }
    }
);

/* Format and add row to worksheet */
const addRowToWorksheet = (
    worksheet: ExcelJS.Worksheet,
    row: { [key: string]: any },
    dateTimeConversionFields: { [headerKey: string]: boolean },
    numberFields: { [headerKey: string]: boolean },
    timezone: string
) => {
    /* For each key in row */
    Object.keys(row).forEach((key) => {
        /* If the field is a date time field and needs to be converted to another timezone */
        if (dateTimeConversionFields?.[key]) {
            /* Converting timezone */
            if (row?.[key]) {
                row[key] = convertUTCStringToTimezonedString(
                    row[key] as string,
                    timezone,
                    DATE_TIME_FORMATS.dateTimeFormat24hr
                );
            }
        }
        /* Number field formatting */
        if (numberFields?.[key]) {
            row[key] = Number(row[key]);
        }
    });
    /* Add Row, auto size columns and then commit the row */
    worksheet.addRow(row);
    autosizeAllColumns(worksheet, row);
    worksheet.getRow(worksheet.rowCount).commit();
};
export const getDayEndDetailedReport = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
        /* Request Body */
        const body = req.body as GetDayEndDetailsReportRequest;

        /* End Time is the day start time - 1 second */
        const endTime = moment(`${body.fromDateTime} ${body.dayStartTime}`)
            .subtract(1, "seconds")
            .format("HH:mm:ss");

        /* Start Date Time: 'From Date  Day Start Time' */
        const startDateTime = `${body.fromDateTime} ${body.dayStartTime}`;

        /* End date time: 'From Date Day End Time'  + 1 day */
        const endDateTime = moment
            .utc(`${body.fromDateTime} ${endTime}`)
            .add(1, "day")
            .format(DATE_TIME_FORMATS.dateTimeFormat24hr);

        /* Inserting into reports table */
        const reportRequestAdded = await db.db
            .insert(reports)
            .values({
                reportName: REPORT_TYPES.dayEndDetailedReport,
                companyId: body.companyId,
                status: REPORT_STATUS_TYPES.inProgress,
                fromDateTime: moment.utc(`${startDateTime}`).toDate(),
                toDateTime: moment.utc(`${endDateTime}`).toDate(),
                requestedBy: req?.user?.userId,
            })
            .returning();

        /* Sending the response */
        res.status(200).json(
            new ApiResponse<GetDayEndDetailedReportResponse>(200, {
                message: "in progress",
            })
        );

        /* Temporary File Name */
        const fileName = getTempReportFilePath();

        /* Excel Workbook */
        const workbook = new ExcelJS.stream.xlsx.WorkbookWriter({
            filename: fileName,
            useStyles: true,
        });

        /* Stores the references to all the worksheets */
        const worksheetReferences: {
            [worksheetKey: string]: ExcelJS.Worksheet;
        } = {};

        /* For each worksheet key in config */
        Object.keys(DAY_END_DETAILED_CONFIG.WORKSHEETS).forEach(
            (worksheetKey) => {
                /* Worksheet Info */
                const worksheetInfo =
                    DAY_END_DETAILED_CONFIG.WORKSHEETS[worksheetKey];

                /* Adding the worksheet */
                const newWorksheet = workbook.addWorksheet(
                    worksheetInfo.worksheetName
                );

                /* Setting its columns from the config */
                newWorksheet.columns = worksheetInfo.columns;

                /* Adding header style to the worksheet */
                addHeaderStyle(newWorksheet, 1);

                /* Adding to worksheet references */
                worksheetReferences[worksheetKey] = newWorksheet;
            }
        );

        /* Getting the postgres client */
        const client = await db.getClient();

        let reportLink;

        try {
            /* Sales Query */
            const salesQueryPromise = new Promise((resolve, reject) => {
                /* Sales Query Stream */
                const query = new QueryStream(
                    DAY_END_DETAILED_QUERIES.salesQuery,
                    [body.companyId, startDateTime, endDateTime]
                );

                const stream = client.query(query);

                /* On Data */
                stream.on("data", (chunk) => {
                    /* Format and add Row to worksheet */
                    addRowToWorksheet(
                        worksheetReferences?.SALES,
                        chunk,
                        DAY_END_DETAILED_CONFIG.DateTimeConversionFields,
                        DAY_END_DETAILED_CONFIG.NumberFields,
                        body.timezone
                    );
                });

                /* On End resolve the promise */
                stream.on("end", async () => {
                    /* Commit the worksheet */
                    worksheetReferences.SALES.commit();
                    resolve(true);
                });

                /* On Error Reject the promies */
                stream.on("error", (error) => {
                    reject(error);
                });
            });

            /* Purchases Query */
            const purchasesQueryPromise = new Promise((resolve, reject) => {
                /* Purchases Query Stream */
                const query = new QueryStream(
                    DAY_END_DETAILED_QUERIES.purchasesQuery,
                    [body.companyId, startDateTime, endDateTime]
                );

                const stream = client.query(query);

                /* On Data */
                stream.on("data", (chunk) => {
                    /* Format and add Row to worksheet */
                    addRowToWorksheet(
                        worksheetReferences?.PURCHASES,
                        chunk,
                        DAY_END_DETAILED_CONFIG.DateTimeConversionFields,
                        DAY_END_DETAILED_CONFIG.NumberFields,
                        body.timezone
                    );
                });

                /* On End resolve the promise */
                stream.on("end", async () => {
                    /* Commit the worksheet */
                    worksheetReferences.PURCHASES.commit();
                    resolve(true);
                });

                /* On Error Reject the promies */
                stream.on("error", (error) => {
                    reject(error);
                });
            });

            /* Sale Returns Query */
            const saleReturnsQueryPromise = new Promise((resolve, reject) => {
                /* Sales Return Query Stream */
                const query = new QueryStream(
                    DAY_END_DETAILED_QUERIES.saleReturnsQuery,
                    [body.companyId, startDateTime, endDateTime]
                );

                const stream = client.query(query);

                /* On Data */
                stream.on("data", (chunk) => {
                    /* Format and add Row to worksheet */
                    addRowToWorksheet(
                        worksheetReferences?.SALE_RETURNS,
                        chunk,
                        DAY_END_DETAILED_CONFIG.DateTimeConversionFields,
                        DAY_END_DETAILED_CONFIG.NumberFields,
                        body.timezone
                    );
                });

                /* On End resolve the promise */
                stream.on("end", async () => {
                    /* Commit the worksheet */
                    worksheetReferences.SALE_RETURNS.commit();
                    resolve(true);
                });

                /* On Error Reject the promies */
                stream.on("error", (error) => {
                    reject(error);
                });
            });

            /* Purchase Returns Query */
            const purchaseReturnsQueryPromise = new Promise(
                (resolve, reject) => {
                    /* Purchase returns Query Stream */
                    const query = new QueryStream(
                        DAY_END_DETAILED_QUERIES.purchaseReturnsQuery,
                        [body.companyId, startDateTime, endDateTime]
                    );

                    const stream = client.query(query);

                    /* On Data */
                    stream.on("data", (chunk) => {
                        /* Format and add Row to worksheet */
                        addRowToWorksheet(
                            worksheetReferences?.PURCHASE_RETURNS,
                            chunk,
                            DAY_END_DETAILED_CONFIG.DateTimeConversionFields,
                            DAY_END_DETAILED_CONFIG.NumberFields,
                            body.timezone
                        );
                    });

                    /* On End resolve the promise */
                    stream.on("end", async () => {
                        /* Commit the worksheet */
                        worksheetReferences.PURCHASE_RETURNS.commit();
                        resolve(true);
                    });

                    /* On Error Reject the promies */
                    stream.on("error", (error) => {
                        reject(error);
                    });
                }
            );

            /* Cash In Out Details Query */
            const cashInOutDetailsQueryPromise = new Promise(
                (resolve, reject) => {
                    /* Cash In Out Details Query Stream */
                    const query = new QueryStream(
                        DAY_END_DETAILED_QUERIES.cashInOutDetailsQuery,
                        [body.companyId, startDateTime, endDateTime]
                    );

                    const stream = client.query(query);

                    /* On Data */
                    stream.on("data", (chunk) => {
                        /* Format and add Row to worksheet */
                        addRowToWorksheet(
                            worksheetReferences?.CASH_IN_OUT_DETAILS,
                            chunk,
                            DAY_END_DETAILED_CONFIG.DateTimeConversionFields,
                            DAY_END_DETAILED_CONFIG.NumberFields,
                            body.timezone
                        );
                    });

                    /* On End resolve the promise */
                    stream.on("end", async () => {
                        /* Commit the worksheet */
                        worksheetReferences.CASH_IN_OUT_DETAILS.commit();
                        resolve(true);
                    });

                    /* On Error Reject the promies */
                    stream.on("error", (error) => {
                        reject(error);
                    });
                }
            );
            /* Wait for all promises to resolve */
            await Promise.all([
                salesQueryPromise,
                purchasesQueryPromise,
                saleReturnsQueryPromise,
                purchaseReturnsQueryPromise,
                cashInOutDetailsQueryPromise,
            ]);
            /* Commit the workbook */
            await workbook.commit();

            /* Uploading report to cloud storage and storing the report link */
            reportLink = await uploadReportFile(
                fileName,
                `${REPORT_TYPES.dayEndSummaryReport}-${crypto.randomUUID()}`
            );

            /* Update reports table, with status as complete and the report link
            Surrounding in try catch as the response is already sent.
            */
            await db.db
                .update(reports)
                .set({
                    reportLink: reportLink,
                    status: REPORT_STATUS_TYPES.completed,
                })
                .where(eq(reports.reportId, reportRequestAdded[0].reportId));
        } catch (error) {
            /* On error update reports status in DB */
            await db.db
                .update(reports)
                .set({
                    status: REPORT_STATUS_TYPES.error,
                })
                .where(eq(reports.reportId, reportRequestAdded[0].reportId));
        } finally {
            /* Always release the client */
            client.release();

            /* Delete the temporary file */
            fs.unlinkSync(fileName);
        }
    }
);

export const getSaleReport = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
        /* Request Body */
        const body = req.body as GetSaleReportRequest;

        /* Inserting into reports table */
        const reportRequestAdded = await db.db
            .insert(reports)
            .values({
                reportName: REPORT_TYPES.saleReport,
                companyId: body.companyId,
                status: REPORT_STATUS_TYPES.inProgress,
                fromDateTime: moment.utc(`${body.fromDateTime}`).toDate(),
                toDateTime: moment.utc(`${body.toDateTime}`).toDate(),
                requestedBy: req?.user?.userId,
            })
            .returning();

        /* Sending the response */
        res.status(200).json(
            new ApiResponse<GetSaleReportResponse>(200, {
                message: "in progress",
            })
        );

        /* Temporary File Name */
        const fileName = getTempReportFilePath();

        /* Excel Workbook */
        const workbook = new ExcelJS.stream.xlsx.WorkbookWriter({
            filename: fileName,
            useStyles: true,
        });

        /* Stores the references to all the worksheets */
        const worksheetReferences: {
            [worksheetKey: string]: ExcelJS.Worksheet;
        } = {};

        /* For each worksheet key in config */
        Object.keys(SALE_REPORT_CONFIG.WORKSHEETS).forEach((worksheetKey) => {
            /* Worksheet Info */
            const worksheetInfo = SALE_REPORT_CONFIG.WORKSHEETS[worksheetKey];

            /* Adding the worksheet */
            const newWorksheet = workbook.addWorksheet(
                worksheetInfo.worksheetName
            );

            /* Setting its columns from the config */
            newWorksheet.columns = worksheetInfo.columns;

            /* Adding header style to the worksheet */
            addHeaderStyle(newWorksheet, 1);

            /* Adding to worksheet references */
            worksheetReferences[worksheetKey] = newWorksheet;
        });

        /* Getting the postgres client */
        const client = await db.getClient();

        let reportLink;

        try {
            /* Sales Query */
            const salesQueryPromise = new Promise((resolve, reject) => {
                /* Sales Query Stream */
                const query = new QueryStream(
                    SALE_REPORT_QUERIES.salesQuery,
                    [body.companyId, body.fromDateTime, body.toDateTime]
                );

                const stream = client.query(query);

                /* On Data */
                stream.on("data", (chunk) => {
                    /* Format and add Row to worksheet */
                    addRowToWorksheet(
                        worksheetReferences?.SALES,
                        chunk,
                        SALE_REPORT_CONFIG.DateTimeConversionFields,
                        SALE_REPORT_CONFIG.NumberFields,
                        body.timezone
                    );
                });

                /* On End resolve the promise */
                stream.on("end", async () => {
                    /* Commit the worksheet */
                    worksheetReferences.SALES.commit();
                    resolve(true);
                });

                /* On Error Reject the promies */
                stream.on("error", (error) => {
                    reject(error);
                });
            });

            /* Wait for all promises to resolve */
            await salesQueryPromise;

            /* Commit the workbook */
            await workbook.commit();

            /* Uploading report to cloud storage and storing the report link */
            reportLink = await uploadReportFile(
                fileName,
                `${REPORT_TYPES.saleReport}-${crypto.randomUUID()}`
            );

            /* Update reports table, with status as complete and the report link
            Surrounding in try catch as the response is already sent.
            */
            await db.db
                .update(reports)
                .set({
                    reportLink: reportLink,
                    status: REPORT_STATUS_TYPES.completed,
                })
                .where(eq(reports.reportId, reportRequestAdded[0].reportId));
        } catch (error) {
            /* On error update reports status in DB */
            await db.db
                .update(reports)
                .set({
                    status: REPORT_STATUS_TYPES.error,
                })
                .where(eq(reports.reportId, reportRequestAdded[0].reportId));
        } finally {
            /* Always release the client */
            client.release();

            /* Delete the temporary file */
            fs.unlinkSync(fileName);
        }
    }
);

export const getPurchaseReport = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
        /* Request Body */
        const body = req.body as GetPurchaseReportRequest;

        /* Inserting into reports table */
        const reportRequestAdded = await db.db
            .insert(reports)
            .values({
                reportName: REPORT_TYPES.purchaseReport,
                companyId: body.companyId,
                status: REPORT_STATUS_TYPES.inProgress,
                fromDateTime: moment.utc(`${body.fromDateTime}`).toDate(),
                toDateTime: moment.utc(`${body.toDateTime}`).toDate(),
                requestedBy: req?.user?.userId,
            })
            .returning();

        /* Sending the response */
        res.status(200).json(
            new ApiResponse<GetPurchaseReportResponse>(200, {
                message: "in progress",
            })
        );

        /* Temporary File Name */
        const fileName = getTempReportFilePath();

        /* Excel Workbook */
        const workbook = new ExcelJS.stream.xlsx.WorkbookWriter({
            filename: fileName,
            useStyles: true,
        });

        /* Stores the references to all the worksheets */
        const worksheetReferences: {
            [worksheetKey: string]: ExcelJS.Worksheet;
        } = {};

        /* For each worksheet key in config */
        Object.keys(PURCHASE_REPORT_CONFIG.WORKSHEETS).forEach((worksheetKey) => {
            /* Worksheet Info */
            const worksheetInfo = PURCHASE_REPORT_CONFIG.WORKSHEETS[worksheetKey];

            /* Adding the worksheet */
            const newWorksheet = workbook.addWorksheet(
                worksheetInfo.worksheetName
            );

            /* Setting its columns from the config */
            newWorksheet.columns = worksheetInfo.columns;

            /* Adding header style to the worksheet */
            addHeaderStyle(newWorksheet, 1);

            /* Adding to worksheet references */
            worksheetReferences[worksheetKey] = newWorksheet;
        });

        /* Getting the postgres client */
        const client = await db.getClient();

        let reportLink;

        try {
            /* Purchases Query */
            const purchasesQueryPromise = new Promise((resolve, reject) => {
                /* Purchases Query Stream */
                const query = new QueryStream(
                    PURCHASE_REPORT_QUERIES.purchasesQuery,
                    [body.companyId, body.fromDateTime, body.toDateTime]
                );

                const stream = client.query(query);

                /* On Data */
                stream.on("data", (chunk) => {
                    /* Format and add Row to worksheet */
                    addRowToWorksheet(
                        worksheetReferences?.PURCHASES,
                        chunk,
                        PURCHASE_REPORT_CONFIG.DateTimeConversionFields,
                        PURCHASE_REPORT_CONFIG.NumberFields,
                        body.timezone
                    );
                });

                /* On End resolve the promise */
                stream.on("end", async () => {
                    /* Commit the worksheet */
                    worksheetReferences.PURCHASES.commit();
                    resolve(true);
                });

                /* On Error Reject the promies */
                stream.on("error", (error) => {
                    reject(error);
                });
            });

            /* Wait for all promises to resolve */
            await purchasesQueryPromise;

            /* Commit the workbook */
            await workbook.commit();

            /* Uploading report to cloud storage and storing the report link */
            reportLink = await uploadReportFile(
                fileName,
                `${REPORT_TYPES.purchaseReport}-${crypto.randomUUID()}`
            );

            /* Update reports table, with status as complete and the report link
            Surrounding in try catch as the response is already sent.
            */
            await db.db
                .update(reports)
                .set({
                    reportLink: reportLink,
                    status: REPORT_STATUS_TYPES.completed,
                })
                .where(eq(reports.reportId, reportRequestAdded[0].reportId));
        } catch (error) {
            /* On error update reports status in DB */
            await db.db
                .update(reports)
                .set({
                    status: REPORT_STATUS_TYPES.error,
                })
                .where(eq(reports.reportId, reportRequestAdded[0].reportId));
        } finally {
            /* Always release the client */
            client.release();

            /* Delete the temporary file */
            fs.unlinkSync(fileName);
        }
    }
);

export const getSaleReturnReport = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
        /* Request Body */
        const body = req.body as GetSaleReturnReportRequest;

        /* Inserting into reports table */
        const reportRequestAdded = await db.db
            .insert(reports)
            .values({
                reportName: REPORT_TYPES.saleReturnReport,
                companyId: body.companyId,
                status: REPORT_STATUS_TYPES.inProgress,
                fromDateTime: moment.utc(`${body.fromDateTime}`).toDate(),
                toDateTime: moment.utc(`${body.toDateTime}`).toDate(),
                requestedBy: req?.user?.userId,
            })
            .returning();

        /* Sending the response */
        res.status(200).json(
            new ApiResponse<GetSaleReturnReportResponse>(200, {
                message: "in progress",
            })
        );

        /* Temporary File Name */
        const fileName = getTempReportFilePath();

        /* Excel Workbook */
        const workbook = new ExcelJS.stream.xlsx.WorkbookWriter({
            filename: fileName,
            useStyles: true,
        });

        /* Stores the references to all the worksheets */
        const worksheetReferences: {
            [worksheetKey: string]: ExcelJS.Worksheet;
        } = {};

        /* For each worksheet key in config */
        Object.keys(SALE_RETURN_REPORT_CONFIG.WORKSHEETS).forEach((worksheetKey) => {
            /* Worksheet Info */
            const worksheetInfo = SALE_RETURN_REPORT_CONFIG.WORKSHEETS[worksheetKey];

            /* Adding the worksheet */
            const newWorksheet = workbook.addWorksheet(
                worksheetInfo.worksheetName
            );

            /* Setting its columns from the config */
            newWorksheet.columns = worksheetInfo.columns;

            /* Adding header style to the worksheet */
            addHeaderStyle(newWorksheet, 1);

            /* Adding to worksheet references */
            worksheetReferences[worksheetKey] = newWorksheet;
        });

        /* Getting the postgres client */
        const client = await db.getClient();

        let reportLink;

        try {
            /* Sale Returns Query */
            const salesReturnsQueryPromise = new Promise((resolve, reject) => {
                /* Purchases Query Stream */
                const query = new QueryStream(
                    SALE_RETURN_QUERIES.saleReturnsQuery,
                    [body.companyId, body.fromDateTime, body.toDateTime]
                );

                const stream = client.query(query);

                /* On Data */
                stream.on("data", (chunk) => {
                    /* Format and add Row to worksheet */
                    addRowToWorksheet(
                        worksheetReferences?.SALE_RETURNS,
                        chunk,
                        PURCHASE_REPORT_CONFIG.DateTimeConversionFields,
                        PURCHASE_REPORT_CONFIG.NumberFields,
                        body.timezone
                    );
                });

                /* On End resolve the promise */
                stream.on("end", async () => {
                    /* Commit the worksheet */
                    worksheetReferences.SALE_RETURNS.commit();
                    resolve(true);
                });

                /* On Error Reject the promies */
                stream.on("error", (error) => {
                    reject(error);
                });
            });

            /* Wait for all promises to resolve */
            await salesReturnsQueryPromise;

            /* Commit the workbook */
            await workbook.commit();

            /* Uploading report to cloud storage and storing the report link */
            reportLink = await uploadReportFile(
                fileName,
                `${REPORT_TYPES.saleReturnReport}-${crypto.randomUUID()}`
            );

            /* Update reports table, with status as complete and the report link
            Surrounding in try catch as the response is already sent.
            */
            await db.db
                .update(reports)
                .set({
                    reportLink: reportLink,
                    status: REPORT_STATUS_TYPES.completed,
                })
                .where(eq(reports.reportId, reportRequestAdded[0].reportId));
        } catch (error) {
            /* On error update reports status in DB */
            await db.db
                .update(reports)
                .set({
                    status: REPORT_STATUS_TYPES.error,
                })
                .where(eq(reports.reportId, reportRequestAdded[0].reportId));
        } finally {
            /* Always release the client */
            client.release();

            /* Delete the temporary file */
            fs.unlinkSync(fileName);
        }
    }
);


