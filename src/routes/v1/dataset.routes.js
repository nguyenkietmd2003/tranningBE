import multer from 'multer';
import express from 'express';
import { listDropboxFiles, uploadFile, viewFile, analyzePdfById,analyzePdfById1 ,deleteAllDropboxFiles, getListFile } from '../../controller/dataset.controller.js';
const upload = multer({ dest: 'uploads/' })



const uploadRouter = express.Router();

uploadRouter.post('/', upload.single('file'),uploadFile)
uploadRouter.get('/list', listDropboxFiles);
uploadRouter.get('/view/:id', viewFile)
uploadRouter.get('/analyze/:id', analyzePdfById);
uploadRouter.get('/analyze/:id', analyzePdfById);
uploadRouter.get('/analyze1/:id', analyzePdfById1);
uploadRouter.delete('/delete', deleteAllDropboxFiles);




// 
uploadRouter.get('/allfile', getListFile)


// 

export default uploadRouter;
