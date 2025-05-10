import express from 'express';
import { getTest } from '../../controller/test.controller.js';



const Testrouter = express.Router();

Testrouter.post('/', getTest)


export default Testrouter;
