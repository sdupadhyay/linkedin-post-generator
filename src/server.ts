import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import apiRoutes from './routes/apiRoutes';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// Register API Routes
app.use('/api', apiRoutes);

app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});
