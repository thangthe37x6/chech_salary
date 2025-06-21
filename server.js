import express from 'express';
import dotenv from 'dotenv';
import bodyParser from 'body-parser'; 
import cookieParser from 'cookie-parser';
import { connectDB } from './config/conect_mg.js';
import routesUser from './routes/salary.js';
import routesAdmin from './routes/admin.js';
import router from './routes/auth.js';
dotenv.config();

const app = express();
app.set('view engine', 'ejs');
app.set('views', 'views');
app.use(express.static('public'));
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
app.use("/", router); 
app.use("/", routesUser); 
app.use("/", routesAdmin); 


const PORT = process.env.PORT || 3000;
connectDB(process.env.MONGODB_URI).then(() => {
  app.listen(PORT, () => {
    console.log(`✅ Server is running at http://localhost:${PORT}/login`);
  });
});