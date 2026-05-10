import {
  USER_CREATED_ROUTING_KEY,
  USER_EVENTS_EXCHANGE,
} from "@chat_app/common";

import type {
  UserCreatedEvent,
  UserCreatedEventPayload,
} from "@chat_app/common";

import type { Channel, ChannelModel, Connection } from "amqplib";
import amqplib from "amqplib";

import { logger } from "@/utils/logger";
import { env } from "@/config/env";

type ManageConnection = Connection &
  Pick<ChannelModel, "close" | "createChannel">;

let connection: ManageConnection | null = null;
let channel: Channel | null = null;

const messagingEnabled = Boolean(env.RABBITMQ_URL);

const ensureChannel = async (): Promise<Channel | null> => {
  if (!messagingEnabled) return null;

  if (channel) return channel;
  if (!env.RABBITMQ_URL) {
    logger.warn("RabbitMQ URL is not defined. Messaging is disabled.");
    return null;
  }

  const amqpConnection = (await amqplib.connect(
    env.RABBITMQ_URL,
  )) as unknown as ManageConnection;
  connection = amqpConnection;

  amqpConnection.on("close", () => {
    logger.warn("RabbitMQ connection closed. Reconnecting...");
    connection = null;
    channel = null;
  });

  amqpConnection.on("error", (err) => {
    logger.error("RabbitMQ connection error:", err);
    connection = null;
    channel = null;
  });

  const amqpChannel = await amqpConnection.createChannel();
  channel = amqpChannel;

  await amqpChannel.assertExchange(USER_EVENTS_EXCHANGE, "topic", {
    durable: true,
  });

  return amqpChannel;
};

export const initMessaging = async () => {
  if (!messagingEnabled) {
    logger.info("Messaging is disabled. Skipping RabbitMQ connection.");
    return;
  }

  await ensureChannel();
  logger.info("Connected to RabbitMQ and channel is ready.");
};

export const closeMessaging = async () => {
  try {
    if (channel) {
      const currentChannel: Channel = channel;
      channel = null;
      await currentChannel.close();
    }

    if (connection) {
      const currentConnection: ManageConnection = connection;
      connection = null;
      await currentConnection.close();
    }

    logger.info(
      "User Service RabbitMQ connection and channel closed successfully.",
    );
  } catch (error) {
    logger.error({ error }, "Error closing RabbitMQ channel!");
  }
};

export const publishUserCreatedEvent = async (
  payload: UserCreatedEventPayload,
) => {
  const ch = await ensureChannel();
  if (!ch) {
    logger.debug(
      { payload },
      "Cannot publish user created event: channel is not available.",
    );
    return;
  }

  const event: UserCreatedEvent = {
    type: USER_CREATED_ROUTING_KEY,
    payload,
    occurredAt: new Date().toISOString(),
    metaData: {
      version: 1,
    },
  };

  try {
    const success = ch.publish(
      USER_EVENTS_EXCHANGE,
      USER_CREATED_ROUTING_KEY,
      Buffer.from(JSON.stringify(event)),
      {
        persistent: true,
        contentType: "application/json",
      },
    );
    if (!success) {
      logger.warn(
        { event },
        "Failed to publish user created event: channel buffer is full. Event will be retried on next publish.",
      );
    }
  } catch (error) {
    logger.error({ error }, "Error publishing user created event to RabbitMQ!");
  }
};
