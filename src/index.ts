import app from "./app.js";
import { PORT } from "./config/config.js";
import express from "express";
import { userRouter } from "./modules/auth/auth.routes.js";
import { contentRouter } from "./modules/content/content.routes.js";

app.use(express.json());

app.use("/api/v1/user", userRouter);
app.use("/api/v1/content", contentRouter);

app.listen(PORT, () => {
  console.log(`Server is running at port ${PORT} `);
});
