export const REGEX = {
    date: /^\d\d\d\d-(0?[1-9]|1[0-2])-(0?[1-9]|[12][0-9]|3[01])$/,
    dateWithTime:
        /^\d\d\d\d-(0?[1-9]|1[0-2])-(0?[1-9]|[12][0-9]|3[01]) (00|0[0-9]|1[0-9]|2[0-3]):([0-9]|[0-5][0-9]):([0-9]|[0-5][0-9])$/,
    time: /^((?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d$)/
};

export const DATE_TIME_FORMATS = {
    dateFormat: "YYYY-MM-DD",
    timeFormat24hr: "HH:mm:ss",
    dateTimeFormat24hr: "YYYY-MM-DD HH:mm:ss",
    displayedDateTimeFormat24hr: "DD/MM/YYYY HH:mm:ss"
};


/* Should be same as Platform features name, 
as this is added as name to the reports table, and is used by the client
to display the reports dropdown selector */
export enum REPORT_TYPES {
    dayEndSummaryReport = "DAY_END_SUMMARY_REPORT",
    dayEndDetailedReport = "DAY_END_DETAILED_REPORT"
}

export enum REPORT_STATUS_TYPES {
    inProgress = "IN_PROGRESS",
    error = "ERROR",
    completed = "COMPLETED"
}