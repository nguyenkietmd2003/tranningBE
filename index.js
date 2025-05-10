import express from 'express';
import cors from 'cors';
import compression from 'compression';
import morgan from 'morgan';
import 'dotenv/config';
import { connectDB } from './src/config/database.js';
import { v1 } from './src/routes/routes.js';

const PORT = process.env.PORT || 3000;


const app = express();

app.use(compression());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(morgan('dev'));




(async () => {
 
  const registerRouter =()=>{
    v1(app);
  } 
    
  try {
    app.listen(PORT, async() => {
      registerRouter();
      await connectDB();
      console.log('Connecting to MongoDB...');
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Error starting server:', error);
  }
})();
