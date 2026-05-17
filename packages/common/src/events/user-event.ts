import { EventPayload, OutBoundEvent } from "./event-types";

export const USER_EVENTS_EXCHANGE = "user.events";
export const USER_CREATED_ROUTING_KEY = "user.created";

export interface UserCreatedEventPayload extends EventPayload {
  id: string;
  email: string;
  displayName: string;
  createdAt: string;
  updatedAt: string;
}

export type UserCreatedEvent = OutBoundEvent<
  typeof USER_CREATED_ROUTING_KEY,
  UserCreatedEventPayload
>;
