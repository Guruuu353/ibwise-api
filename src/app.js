const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
require("express-async-errors");
const path = require("path");

const { clientUrl, rateLimit: rateLimitConfig, nodeEnv } = require("./config/env");
const { errorMiddleware, notFoundMiddleware } = require("./middleware/error.middleware");

const authRoutes = require("./modules/auth/auth.routes");
const usersRoutes = require("./modules/users/users.routes");
const classesRoutes = require("./modules/classes/classes.routes");
const subjectsRoutes = require("./modules/subjects/subjects.routes");
const assignmentsRoutes = require("./modules/assignments/assignments.routes");
const submissionsRoutes = require("./modules/submissions/submissions.routes");
const gradesRoutes = require("./modules/grades/grades.routes");
const blogRoutes = require("./modules/blog/blog.routes");
const eventsRoutes = require("./modules/events/events.routes");
const announcementsRoutes = require("./modules/announcements/announcements.routes");
const dashboardRoutes = require("./modules/dashboard/dashboard.routes");
const feesRoutes = require("./modules/fees/fees.routes");
const chatRoutes = require("./modules/chat/chat.routes");
const inquiriesRoutes = require("./modules/inquiries/inquiries.routes");
const lessonsRoutes = require("./modules/lessons/lessons.routes");
const attendanceRoutes = require("./modules/attendance/attendance.routes");
const notificationsRoutes = require("./modules/notifications/notifications.routes");
const mediaRoutes = require("./modules/media/media.routes");
const settingsRoutes = require("./modules/settings/settings.routes");
const reportsRoutes = require("./modules/reports/reports.routes");
const liveSessionsRoutes = require("./modules/live-sessions/live-sessions.routes");
const rubricsRoutes = require("./modules/rubrics/rubrics.routes");

const app = express();

// 1. ADD THIS LINE RIGHT HERE (Crucial for Railway/Vercel proxies)
app.set('trust proxy', 1); 
app.use(helmet());
app.use(cors({ origin: clientUrl, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
if (nodeEnv === "development") app.use(morgan("dev"));

// Global rate limit; auth routes additionally apply their own tighter limit.
app.use(rateLimit({ windowMs: rateLimitConfig.windowMs, max: rateLimitConfig.max }));

// Serve uploaded files. In production this is replaced by Cloudinary/S3 URLs
// (see middleware/upload.middleware.js) — this stays as the local dev path.
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

app.get("/health", (req, res) => res.json({ status: "ok", time: new Date().toISOString() }));

const API = "/api";
app.use(`${API}/auth`, authRoutes);
app.use(`${API}/users`, usersRoutes);
app.use(`${API}/classes`, classesRoutes);
app.use(`${API}/subjects`, subjectsRoutes);
app.use(`${API}/assignments`, assignmentsRoutes);
app.use(`${API}/submissions`, submissionsRoutes);
app.use(`${API}/grades`, gradesRoutes);
app.use(`${API}/blog`, blogRoutes);
app.use(`${API}/events`, eventsRoutes);
app.use(`${API}/announcements`, announcementsRoutes);
app.use(`${API}/dashboard`, dashboardRoutes);
app.use(`${API}/fees`, feesRoutes);
app.use(`${API}/chat`, chatRoutes);
app.use(`${API}/inquiries`, inquiriesRoutes);
app.use(`${API}/lessons`, lessonsRoutes);
app.use(`${API}/attendance`, attendanceRoutes);
app.use(`${API}/notifications`, notificationsRoutes);
app.use(`${API}/media`, mediaRoutes);
app.use(`${API}/settings`, settingsRoutes);
app.use(`${API}/reports`, reportsRoutes);
app.use(`${API}/live-sessions`, liveSessionsRoutes);
app.use(`${API}/rubrics`, rubricsRoutes);

app.use(notFoundMiddleware);
app.use(errorMiddleware);

module.exports = app;
