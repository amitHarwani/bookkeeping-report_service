import ExcelJS from "exceljs";
import { NextFunction, Request, Response } from "express";
import moment from "moment";
import momentTimezone from "moment-timezone";
import QueryStream from "pg-query-stream";
import * as DAY_END_SUMMARY_CONFIG from "../config/get_day_end_summary_report_config";
import { DATE_TIME_FORMATS } from "../constants";
import * as db from "../db";
import { GetDayEndSummaryReportRequest } from "../dto/report/get_day_end_summary_report_dto";
import { DAY_END_SUMMARY_QUERIES } from "../queries/get_day_end_summary_report_queries";
import asyncHandler from "../utils/async_handler";
import {
    addHeaderStyle,
    autosizeColumn,
    convertUTCStringToTimezonedString,
    getTempReportFilePath,
} from "../utils/common_utils";

export const getDayEndSummaryReport = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
        /* Request Body */
        const body = req.body as GetDayEndSummaryReportRequest;

        /* End Time for each day is the day start time - 1 second */
        const endTime = moment(`${body.toDateTime} ${body.dayStartTime}`)
            .subtract(1, "seconds")
            .format("HH:mm:ss");

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
                autosizeColumn(worksheet, HEADER_KEYS.endTime, chunk.end_time);
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
        const aggregatedProfitQueryPromise = new Promise((resolve, reject) => {
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
                chunk.aggregated_profit = Number(chunk.aggregated_profit);

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
        });

        /* Wait for all promises to resolve */
        try {
            await Promise.all([
                cashInOutQueryPromise,
                totalSalesAndPurchasesQueryPromise,
                aggregatedProfitQueryPromise,
            ]);
        } catch (error) {
            throw error;
        } finally {
            /* Always release the client */
            client.release();
        }
        /* Write to file */
        await workbook.xlsx.writeFile(fileName);

        return res.status(200).json({ message: "Done" });
    }
);
