import { body, query } from "express-validator";
import { REGEX } from "../constants";


export const getReportValidator = () => {
    return [
        query("companyId").isInt().withMessage("invalid company id "),
        query("reportId").isInt().withMessage("invalid report id")
    ]
}
export const getAllReportsValidator = () => {
    return [
        body("companyId").isInt().withMessage("invalid companyId field"),
        body("pageSize").isInt().withMessage("invalid pageSize field"),
        body("cursor").custom((value) => {
            if (
                !value ||
                (typeof value === "object" &&
                    typeof value?.reportId === "number" &&
                    value?.createdAt)
            ) {
                return true;
            }
            throw new Error("invalid cursor field");
        }),
    ];
};

export const deleteReportValidator = () => {
    return [
        query("companyId").isInt().withMessage("invalid company id "),
        query("reportId").isInt().withMessage("invalid report id")
    ]
}

export const getDayEndSummaryReportValidator = () => {
    return [
        body("companyId").isInt().withMessage("invalid company id"),
        body("decimalRoundTo").isInt().withMessage("invalid decimal round to field"),
        body("fromDateTime").custom((value) => {
            if (typeof value === "string" && REGEX.date.test(value)) {
                return true;
            }
            throw new Error("invalid from date time");
        }),
        body("toDateTime").custom((value) => {
            if (typeof value === "string" && REGEX.date.test(value)) {
                return true;
            }
            throw new Error("invalid to date time");
        }),
        body("dayStartTime").custom((value) => {
            if (typeof value === "string" && REGEX.time.test(value)) {
                return true;
            }
            throw new Error("invalid day start time");
        }),
        body("timezone")
            .isString()
            .withMessage("invalid timezone")
            .trim()
            .notEmpty()
            .withMessage("timezone is required"),
    ];
};

export const getDayEndDetailedReportValidator = () => {
    return [
        body("companyId").isInt().withMessage("invalid company id"),
        body("decimalRoundTo").isInt().withMessage("invalid decimal round to field"),
        body("fromDateTime").custom((value) => {
            if (typeof value === "string" && REGEX.date.test(value)) {
                return true;
            }
            throw new Error("invalid from date time");
        }),
        body("dayStartTime").custom((value) => {
            if (typeof value === "string" && REGEX.time.test(value)) {
                return true;
            }
            throw new Error("invalid day start time");
        }),
        body("timezone")
            .isString()
            .withMessage("invalid timezone")
            .trim()
            .notEmpty()
            .withMessage("timezone is required"),
    ];
};

export const getSaleReportValidator = () => {
    return [
        body("companyId").isInt().withMessage("invalid company id"),
        body("decimalRoundTo").isInt().withMessage("invalid decimal round to field"),
        body("fromDateTime").custom((value) => {
            if (typeof value === "string" && REGEX.dateWithTime.test(value)) {
                return true;
            }
            throw new Error("invalid from date time");
        }),
        body("toDateTime").custom((value) => {
            if (typeof value === "string" && REGEX.dateWithTime.test(value)) {
                return true;
            }
            throw new Error("invalid to date time");
        }),
        body("dayStartTime").custom((value) => {
            if (typeof value === "string" && REGEX.time.test(value)) {
                return true;
            }
            throw new Error("invalid day start time");
        }),
        body("timezone")
            .isString()
            .withMessage("invalid timezone")
            .trim()
            .notEmpty()
            .withMessage("timezone is required"),
    ];
};

export const getPurchaseReportValidator = () => {
    return [
        body("companyId").isInt().withMessage("invalid company id"),
        body("decimalRoundTo").isInt().withMessage("invalid decimal round to field"),
        body("fromDateTime").custom((value) => {
            if (typeof value === "string" && REGEX.dateWithTime.test(value)) {
                return true;
            }
            throw new Error("invalid from date time");
        }),
        body("toDateTime").custom((value) => {
            if (typeof value === "string" && REGEX.dateWithTime.test(value)) {
                return true;
            }
            throw new Error("invalid to date time");
        }),
        body("dayStartTime").custom((value) => {
            if (typeof value === "string" && REGEX.time.test(value)) {
                return true;
            }
            throw new Error("invalid day start time");
        }),
        body("timezone")
            .isString()
            .withMessage("invalid timezone")
            .trim()
            .notEmpty()
            .withMessage("timezone is required"),
    ];
};

export const getSaleReturnReportValidator = () => {
    return [
        body("companyId").isInt().withMessage("invalid company id"),
        body("decimalRoundTo").isInt().withMessage("invalid decimal round to field"),
        body("fromDateTime").custom((value) => {
            if (typeof value === "string" && REGEX.dateWithTime.test(value)) {
                return true;
            }
            throw new Error("invalid from date time");
        }),
        body("toDateTime").custom((value) => {
            if (typeof value === "string" && REGEX.dateWithTime.test(value)) {
                return true;
            }
            throw new Error("invalid to date time");
        }),
        body("dayStartTime").custom((value) => {
            if (typeof value === "string" && REGEX.time.test(value)) {
                return true;
            }
            throw new Error("invalid day start time");
        }),
        body("timezone")
            .isString()
            .withMessage("invalid timezone")
            .trim()
            .notEmpty()
            .withMessage("timezone is required"),
    ];
};

export const getPurchaseReturnReportValidator = () => {
    return [
        body("companyId").isInt().withMessage("invalid company id"),
        body("decimalRoundTo").isInt().withMessage("invalid decimal round to field"),
        body("fromDateTime").custom((value) => {
            if (typeof value === "string" && REGEX.dateWithTime.test(value)) {
                return true;
            }
            throw new Error("invalid from date time");
        }),
        body("toDateTime").custom((value) => {
            if (typeof value === "string" && REGEX.dateWithTime.test(value)) {
                return true;
            }
            throw new Error("invalid to date time");
        }),
        body("dayStartTime").custom((value) => {
            if (typeof value === "string" && REGEX.time.test(value)) {
                return true;
            }
            throw new Error("invalid day start time");
        }),
        body("timezone")
            .isString()
            .withMessage("invalid timezone")
            .trim()
            .notEmpty()
            .withMessage("timezone is required"),
    ];
};





