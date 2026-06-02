import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";

import { analyzeHandler } from "./controllers/analyzeController";
import { topicsHandler } from "./controllers/topicsController";
import { generateHandler } from "./controllers/generateController";

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "../public")));

// Route definitions – each handler is a pure function.
app.post("/api/analyze", analyzeHandler);
app.post("/api/topics", topicsHandler);
app.post("/api/generate", generateHandler);

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
