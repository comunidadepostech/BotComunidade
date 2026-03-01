import { Router } from 'express';
import v2 from './v2/v2.ts';

const router = Router();

router.use('/v2', v2);

export default router;