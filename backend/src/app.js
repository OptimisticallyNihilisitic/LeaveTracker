import express from "express";
import cors from "cors";
import leaveRoutes from "./routes/leaveRoutes.js";
import attendanceRoutes from "./routes/attendanceRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import inviteRoutes from "./routes/inviteRoutes.js";

const app = express();

const corsOptions = {
  origin: [
    "https://leavetracktool.netlify.app",
    /^http:\/\/localhost:\d+$/,
  ],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
  credentials: true,
};

app.use(cors(corsOptions));
app.options(/.*/, cors(corsOptions));

app.use(express.json());

app.use("/api/user", userRoutes);
app.use("/api/leave", leaveRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/invite", inviteRoutes);

export default app;