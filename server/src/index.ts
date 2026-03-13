import "dotenv/config";
import { createApp } from "./app/createApp.js";
import { healthRouter } from "./routes/health.js";
import { authRouter } from "./routes/auth.js";
import { projectRouter } from "./routes/projects.js";
import { checkRunsRouter } from "./routes/checkRuns.js";
import { settingsRouter } from "./routes/settings.js";
import { additionalPagesRouter } from "./routes/additionalPages.js";
import { incidentsRouter } from "./routes/incidents.js";
import { startCronJobs } from "./app/cron.js";
import { PORT } from "./app/config.js";

const app = createApp();
app.use(healthRouter);
app.use(authRouter);
app.use(projectRouter);
app.use(checkRunsRouter);
app.use(settingsRouter);
app.use(additionalPagesRouter);
app.use(incidentsRouter);



startCronJobs();

app.listen(PORT, () => console.log(`API listening on http://localhost:${PORT}`));
