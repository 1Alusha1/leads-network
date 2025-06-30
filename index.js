import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import recordRoute from "./routes/record.route.js";
import fbRoute from "./routes/fb.route.js";

dotenv.config();
const app = express();
app.use(express.json());

app.use("/", recordRoute);
app.use("/fb", fbRoute);

app.get("/", (req, res) => {
  res.send("hello");
});

mongoose
  .connect(process.env.MOGO_URI, {})
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`🚀 Сервер запущен на порту ${PORT}`));