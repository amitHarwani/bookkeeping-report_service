import { Router } from "express";
import { getDayEndSummaryReportValidator } from "../validators/report.validators";
import { validateInput } from "../validators";
import { checkAccess } from "../middlewares/auth.middleware";
import { getDayEndSummaryReport } from "../controllers/report.controllers";

const router = Router();

router.post(
    "/get-day-end-summary",
    getDayEndSummaryReportValidator(),
    validateInput,
    checkAccess(34),
    getDayEndSummaryReport
);

export default router;
