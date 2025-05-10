import { AppMentionEvent } from "@slack/web-api";
import { client, getThread } from "./slack-utils";
import { generateResponse } from "./generate-response";
import { logger } from "./logger";

const updateStatusUtil = async (
  initialStatus: string,
  event: AppMentionEvent,
) => {
  const initialMessage = await client.chat.postMessage({
    channel: event.channel,
    thread_ts: event.thread_ts ?? event.ts,
    text: initialStatus,
  });

  logger.debug("updateStatusUtil: Initial message", initialMessage);

  if (!initialMessage || !initialMessage.ts) {
    logger.error("updateStatusUtil: Failed to post initial message");
    throw new Error("Failed to post initial message");
  }

  const updateMessage = async (status: string) => {
    logger.debug("updateStatusUtil: Updating message");
    await client.chat.update({
      channel: event.channel,
      ts: initialMessage.ts as string,
      text: status,
    });
  };

  logger.debug("updateStatusUtil: Return update message function");
  return updateMessage;
};

export async function handleNewAppMention(
  event: AppMentionEvent,
  botUserId: string,
) {
  logger.debug("handleNewAppMention: Event", JSON.stringify(event));

  if (event.bot_id || event.bot_id === botUserId || event.bot_profile) {
    logger.debug("handleNewAppMention: Skipping app mention");
    return;
  }

  const { thread_ts, channel } = event;
  logger.debug(`handleNewAppMention: Thread ${thread_ts} in channel ${channel}`);

  logger.debug("handleNewAppMention: Updating status");
  const updateMessage = await updateStatusUtil("is thinking...", event);
  logger.debug("handleNewAppMention: Update message function", updateMessage);

  if (thread_ts) {
    logger.debug("handleNewAppMention: Getting thread");
    const messages = await getThread(channel, thread_ts, botUserId);
    logger.debug(`handleNewAppMention: Thread ${thread_ts} has ${messages.length} messages`);
    const result = await generateResponse(messages, updateMessage);
    logger.debug("handleNewAppMention: Generated response", result);
    await updateMessage(result);
  } else {
    logger.debug("handleNewAppMention: Generating response");
    const result = await generateResponse(
      [{ role: "user", content: event.text }],
      updateMessage,
    );
    logger.debug("handleNewAppMention: Generated response", result);
    await updateMessage(result);
  }

  logger.debug("handleNewAppMention: Done");
}
