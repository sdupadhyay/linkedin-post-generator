import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";

import { analyzeHandler } from "./controllers/analyzeController";
import { topicsHandler } from "./controllers/topicsController";
import { generateHandler } from "./controllers/generateController";
import { saveDnaHandler } from "./controllers/saveDnaController";
import { getDnaHandler } from "./controllers/getDnaController";
import { requireAuth } from "./middleware/auth";

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "../public")));

// Route definitions – each handler is a pure function.
app.post("/api/analyze", requireAuth, analyzeHandler);
app.post("/api/topics", requireAuth, topicsHandler);
app.post("/api/generate", requireAuth, generateHandler);
app.post("/api/save-dna", requireAuth, saveDnaHandler);
app.get("/api/get-dna", requireAuth, getDnaHandler);

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
