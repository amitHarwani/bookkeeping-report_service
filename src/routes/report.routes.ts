import { NextFunction, Request, Response, Router } from "express";
import {
    deleteReportValidator,
    getAllReportsValidator,
    getDayEndSummaryReportValidator,
    getReportValidator,
} from "../validators/report.validators";
import { validateInput } from "../validators";
import { checkAccess } from "../middlewares/auth.middleware";
import {
    deleteReport,
    getAllReports,
    getDayEndSummaryReport,
    getReport,
} from "../controllers/report.controllers";

const router = Router();

router.get(
    "/get-report",
    getReportValidator(),
    validateInput,
    (req: Request, res: Response, next: NextFunction) => {
        checkAccess(33, Number(req?.query?.companyId))(req, res, next);
    },
    getReport
);
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

router.delete(
    "/delete-report",
    deleteReportValidator(),
    validateInput,
    (req: Request, res: Response, next: NextFunction) => {
        checkAccess(33, Number(req?.query?.companyId))(req, res, next);
    },
    deleteReport
);

export default router;
