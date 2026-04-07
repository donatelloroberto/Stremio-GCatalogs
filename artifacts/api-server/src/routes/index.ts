import { Router, type IRouter } from "express";
import healthRouter from "./health";
import stremioRouter from "./stremio";
import stremioPlusRouter from "./stremio-plus";

const router: IRouter = Router();

router.use(healthRouter);

export default router;

export { stremioRouter, stremioPlusRouter };
