import { Router } from "express";
import {
    getAllReportsValidator,
    getDayEndSummaryReportValidator,
} from "../validators/report.validators";
import { validateInput } from "../validators";
import { checkAccess } from "../middlewares/auth.middleware";
import {
    getAllReports,
    getDayEndSummaryReport,
} from "../controllers/report.controllers";

const router = Router();

router.post(
    "/get-all-reports",
    getAllReportsValidator(),
    validateInput,
    checkAccess(33),
    getAllReports
);
router.post(
    "/get-day-end-summary",
    getDayEndSummaryReportValidator(),
    validateInput,
    checkAccess(34),
    getDayEndSummaryReport
);

export default router;
