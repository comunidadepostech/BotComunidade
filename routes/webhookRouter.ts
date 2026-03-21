import { Router } from 'express';
import v2 from './v2/v2.ts';
import v1 from "./v1/v1.ts";

const router = Router();

router.use('/v1', v1);
router.use('/v2', v2);

export default router;