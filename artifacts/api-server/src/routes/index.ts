import { Router, type IRouter } from "express";
import healthRouter from "./health";
import farmersRouter from "./farmers";
import advisoryRouter from "./advisory";
import diseaseRouter from "./disease";
import weatherRouter from "./weather";
import marketRouter from "./market";
import gradingRouter from "./grading";
import logisticsRouter from "./logistics";
import forumRouter from "./forum";
import traceabilityRouter from "./traceability";
import insuranceRouter from "./insurance";
import ussdRouter from "./ussd";
import dashboardRouter from "./dashboard";
import decisionsRouter from "./decisions";
import riskmapRouter from "./riskmap";
import impactRouter from "./impact";

const router: IRouter = Router();

router.use(healthRouter);
router.use(farmersRouter);
router.use(advisoryRouter);
router.use(diseaseRouter);
router.use(weatherRouter);
router.use(marketRouter);
router.use(gradingRouter);
router.use(logisticsRouter);
router.use(forumRouter);
router.use(traceabilityRouter);
router.use(insuranceRouter);
router.use(ussdRouter);
router.use(dashboardRouter);
router.use(decisionsRouter);
router.use(riskmapRouter);
router.use(impactRouter);

export default router;
