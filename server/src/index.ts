import "dotenv/config";
import { PORT } from "./app/config.js";
import { startCronJobs } from "./app/cron.js";
import { createApp } from "./app/createApp.js";
import { additionalPagesRouter } from "./routes/additionalPages.js";
import { authRouter } from "./routes/auth.js";
import { checkRunsRouter } from "./routes/checkRuns.js";
import { healthRouter } from "./routes/health.js";
import { incidentsRouter } from "./routes/incidents.js";
import { projectRouter } from "./routes/projects.js";
import { settingsRouter } from "./routes/settings.js";
import { failStaleCheckRuns } from "./services/checkRunService.js";

const app = createApp();
app.use(healthRouter);
app.use(authRouter);
app.use(projectRouter);
app.use(checkRunsRouter);
app.use(settingsRouter);
app.use(additionalPagesRouter);
app.use(incidentsRouter);

await failStaleCheckRuns();
startCronJobs();

app.listen(PORT, () => console.log(`API listening on http://localhost:${PORT}`));
