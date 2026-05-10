import { createApp } from "@/app";
import { createServer } from "http";
import { env } from "@/config/env";
import { logger } from "@/utils/logger";
import { disconnectFromDatabase, initializeDatabase } from "@/db/sequelize";
import { startAuthEventConsumer } from "@/messaging/auth-consumer";
import { initMessaging } from "@/messaging/event-publish";

const main = async () => {
  try {
    await initializeDatabase();
    await startAuthEventConsumer();
    await initMessaging();

    const app = createApp();
    const server = createServer(app);

    const PORT = env.USER_SERVICE_PORT;

    server.listen(PORT, () => {
      logger.info(`User service is running on port ${PORT}`);
    });

    const shutdown = () => {
      logger.info("Shutting down user service...");

      Promise.all([disconnectFromDatabase()])
        .catch((error) => {
          logger.error({ error }, "Error during shutdown");
        })
        .finally(() => {
          process.exit(0);
        });
    };

    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);
  } catch (error) {
    logger.error({ error }, "Failed to start the user service");
    process.exit(1);
  }
};

main();
