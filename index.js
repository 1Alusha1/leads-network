import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import recordRoute from "./routes/record.route.js";
import fbRoute from "./routes/fb.route.js";
import ttRoute from "./routes/tt.route.js";
import ktRoute from "./routes/kt.route.js";
import userRoute from "./routes/user.route.js";
import fileUpload from "express-fileupload";
import cors from "cors";

dotenv.config();
const app = express();

app.use(cors());
app.use(
  fileUpload({
    limits: { fileSize: 50 * 1024 * 1024 },
  })
);
app.use(express.json());

app.use("/", recordRoute);
app.use("/fb", fbRoute);
app.use("/tt", ttRoute);
app.use("/kt", ktRoute);
app.use("/user", userRoute);

app.get("/", (req, res) => {
  res.send("hello");
});

mongoose
  .connect(process.env.MOGO_URI, {})
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`🚀 Сервер запущен на порту ${PORT}`));
