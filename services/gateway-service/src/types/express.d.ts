// this file is used to extend the Express Request interface with custom properties

import type { AuthenticatedUser } from "@chat_app/common";

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

// we need to export something to make this file a module, otherwise the global declaration won't work
export {};
