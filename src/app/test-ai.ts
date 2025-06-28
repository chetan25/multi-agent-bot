import { createAI } from "ai/rsc";
import { submitUserMessage } from "./test-actions";
// import {
//   ServerMessage,
//   ClientMessage,
//   continueConversation,
// } from "./ui-action";

export const AI = createAI<any[], React.ReactNode[]>({
  initialUIState: [],
  initialAIState: [],
  actions: {
    submitUserMessage,
  },
});

// export const AI = createAI<ServerMessage[], ClientMessage[]>({
//   actions: {
//     continueConversation,
//   },
//   initialAIState: [],
//   initialUIState: [],
// });
