import { createApp } from "@/app";
import { createServer } from "http";
import { env } from "@/config/env";
import { logger } from "@/utils/logger";

const main = async () => {
  try {
    const app = createApp();
    const server = createServer(app);

    const PORT = env.CHAT_SERVICE_PORT;

    server.listen(PORT, () => {
      logger.info(`Chat service is running on port ${PORT}`);
    });

    const shutdown = () => {
      logger.info("Shutting down chat service...");

      Promise.all([])
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
    logger.error({ error }, "Failed to start the chat service");
    process.exit(1);
  }
};

main();
