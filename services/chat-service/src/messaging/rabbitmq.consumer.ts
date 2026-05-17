import { env } from "@/config/env";
import { userRepository } from "@/repositories/user.repository";
import { logger } from "@/utils/logger";
import {
  USER_CREATED_ROUTING_KEY,
  USER_EVENTS_EXCHANGE,
  UserCreatedEvent,
} from "@chat_app/common";
import {
  connect,
  ConsumeMessage,
  Replies,
  type Channel,
  type ChannelModel,
} from "amqplib";

let connection: ChannelModel | null = null;
let channel: Channel | null = null;
let consumerTag: string | null = null;

const EVENT_QUEUE = "chat-service.user-events";

const closeAmpqConnection = async (conn: ChannelModel) => {
  await conn.close();
};

const handleUserCreated = async (event: UserCreatedEvent) => {
  // Handle the user created event, e.g., update the chat service's user data
  await userRepository.upsertUser(event.payload);
};

export const startConsumers = async () => {
  if (!env.RABBITMQ_URL) {
    logger.error("RABBITMQ_URL is not defined in environment variables");
    return;
  }

  const conn = await connect(env.RABBITMQ_URL);
  connection = conn;
  const ch = await conn.createChannel();
  channel = ch;

  await ch.assertExchange(USER_EVENTS_EXCHANGE, "topic", {
    durable: true,
  });
  const q = await ch.assertQueue(EVENT_QUEUE, { durable: true });
  await ch.bindQueue(q.queue, USER_EVENTS_EXCHANGE, USER_CREATED_ROUTING_KEY);

  const consumerHandler = (message: ConsumeMessage | null) => {
    if (!message) {
      return;
    }

    void (async () => {
      const payload = message.content.toString("utf-8");
      const event = JSON.parse(payload) as UserCreatedEvent;

      await handleUserCreated(event);
      ch.ack(message);
    })().catch((error: unknown) => {
      logger.error({ error }, "Error processing message from RabbitMQ");
      ch.nack(message, false, false); // Reject the message without requeueing
    });
  };

  const result: Replies.Consume = await ch.consume(q.queue, consumerHandler, {
    noAck: false, // Ensure messages are acknowledged after processing
  });
  consumerTag = result.consumerTag;

  logger.info("RabbitMQ consumer started for user events");
};

export const stopConsumers = async () => {
  try {
    const ch = channel;
    if (ch && consumerTag) {
      await ch.cancel(consumerTag);
      logger.info("RabbitMQ consumer stopped");
      consumerTag = null;
    }

    if (ch) {
      await ch.close();
      logger.info("RabbitMQ channel closed");
      channel = null;
    }

    const conn = connection;
    if (conn) {
      await closeAmpqConnection(conn);
      logger.info("RabbitMQ connection closed");
      connection = null;
    }
  } catch (error) {
    logger.error({ error }, "Error while stopping RabbitMQ consumer");
  }
};
