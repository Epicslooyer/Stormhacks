import { createOpenRouter } from "@openrouter/ai-sdk-provider";

export const openrouter = createOpenRouter({
	apiKey: process.env.OPENROUTER_API_KEY,
});

export const smallModel = openrouter("openai/gpt-5-nano");

export const largeModel = openrouter("openai/gpt-5");

export const chatModel = openrouter("openai/gpt-5-chat");
