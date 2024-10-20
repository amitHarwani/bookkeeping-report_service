import ExcelJS from "exceljs";
import path from "path";
import crypto from "crypto";
import moment from "moment";
import momentTimezone from "moment-timezone";
import { DATE_TIME_FORMATS } from "../constants";

export const getTempReportFilePath = () => {
    return path.join(
        __dirname,
        "..",
        "..",
        "temp_reports",
        `${crypto.randomUUID()}.xlsx`
    );
};

/* Autosize Column In Reports sheet */
export const autosizeColumn = (
    worksheet: ExcelJS.Worksheet,
    columnKey: string,
    newColData: string | number | null
) => {
    /* Getting the column at key */
    const column = worksheet.getColumn(columnKey);

    /* Converting data to string */
    newColData =
        typeof newColData === "string"
            ? newColData
            : typeof newColData === "number"
              ? newColData.toString()
              : "";

    /* New width is max of current width, the width of the header or the length of the data being added */
    column.width = Math.max(
        column.width || 0,
        column.header?.length || 0,
        newColData.length
    );
};

/* Add Header Style to Report sheet based on style type */
export const addHeaderStyle = (
    worksheet: ExcelJS.Worksheet,
    styleType: number
) => {
    switch (styleType) {
        case 1: {
            worksheet.getRow(1).eachCell((cell) => {
                cell.fill = {
                    type: "pattern",
                    pattern: "solid",
                    fgColor: { argb: "0070C0" },
                };
                cell.font = {
                    name: "Calibri",
                    bold: true,
                    size: 12,
                    color: { argb: "FFFFFF" },
                };
                cell.border = {
                    top: { style: "thin" },
                    bottom: { style: "thin" },
                    left: { style: "thin" },
                    right: { style: "thin" },
                };
            });
        }
    }
};

/* Convert UTC Date Time String to another timezone, and return it in the passed format */
export const convertUTCStringToTimezonedString = (
    utcString: string,
    timezone: string,
    outputFormat: string
): string => {
    /* Formatting utc string to YYYY-MM-DD HH:mm:ss */
    const utcStringFormatted = moment(utcString).format(
        DATE_TIME_FORMATS.dateTimeFormat24hr
    );

    /* Parsing as UTC string and then converting to the passed timezone */
    return momentTimezone
        .tz(utcStringFormatted, "UTC")
        .tz(timezone)
        .format(outputFormat);
};
