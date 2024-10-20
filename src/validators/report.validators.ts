import { body } from "express-validator";
import { REGEX } from "../constants";

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
