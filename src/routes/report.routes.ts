import { NextFunction, Request, Response, Router } from "express";
import {
    deleteReportValidator,
    getAllReportsValidator,
    getDayEndDetailedReportValidator,
    getDayEndSummaryReportValidator,
    getPurchaseReportValidator,
    getPurchaseReturnReportValidator,
    getReportValidator,
    getSaleReportValidator,
    getSaleReturnReportValidator,
} from "../validators/report.validators";
import { validateInput } from "../validators";
import { checkAccess } from "../middlewares/auth.middleware";
import {
    deleteReport,
    getAllReports,
    getDayEndDetailedReport,
    getDayEndSummaryReport,
    getPurchaseReport,
    getPurchaseReturnReport,
    getReport,
    getSaleReport,
    getSaleReturnReport,
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

router.post(
    "/get-day-end-detailed",
    getDayEndDetailedReportValidator(),
    validateInput,
    checkAccess(35),
    getDayEndDetailedReport
);

router.post(
    "/get-sale-report",
    getSaleReportValidator(),
    validateInput,
    checkAccess(36),
    getSaleReport
);

router.post(
    "/get-purchase-report",
    getPurchaseReportValidator(),
    validateInput,
    checkAccess(37),
    getPurchaseReport
);

router.post(
    "/get-sale-return-report",
    getSaleReturnReportValidator(),
    validateInput,
    checkAccess(38),
    getSaleReturnReport
);

router.post(
    "/get-purchase-return-report",
    getPurchaseReturnReportValidator(),
    validateInput,
    checkAccess(39),
    getPurchaseReturnReport
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
