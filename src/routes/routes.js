import express from 'express';
import Testrouter from './v1/test.routes.js';
import uploadRouter from './v1/dataset.routes.js';



export const v1 = (app)=>{

    const router = express.Router();
    app.use('/api/v1', router);
    router.use('/test', Testrouter);
    router.use('/dataset', uploadRouter);
}
