import { Router, type IRouter } from "express";
import healthRouter from "./health";
import stremioRouter from "./stremio";
import stremioPlusRouter from "./stremio-plus";
import stremioAdultRouter from "./stremio-adult";

const router: IRouter = Router();

router.use(healthRouter);

export default router;

export { stremioRouter, stremioPlusRouter, stremioAdultRouter };
