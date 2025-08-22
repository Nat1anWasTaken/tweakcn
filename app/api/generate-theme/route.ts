import { recordAIUsage } from "@/actions/ai-usage";
import { handleError } from "@/lib/error-response";
import { getCurrentUserId, logError } from "@/lib/shared";
import { validateSubscriptionAndUsage } from "@/lib/subscription";
import { SubscriptionRequiredError } from "@/types/errors";
import { requestSchema, responseSchema, SYSTEM_PROMPT } from "@/utils/ai/generate-theme";
import { createGoogleGenerativeAI, GoogleGenerativeAIProviderOptions } from "@ai-sdk/google";
import { generateText, Output } from "ai";
import { NextRequest } from "next/server";

const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_API_KEY,
});

const model = google("gemini-2.5-flash");

export async function POST(req: NextRequest) {
  try {
    const userId = await getCurrentUserId(req);

    const subscriptionCheck = await validateSubscriptionAndUsage(userId);

    if (!subscriptionCheck.canProceed) {
      throw new SubscriptionRequiredError(subscriptionCheck.error, {
        requestsRemaining: subscriptionCheck.requestsRemaining,
      });
    }

    const { messages } = requestSchema.parse(await req.json());

    const { experimental_output: result, usage } = await generateText({
      model,
      experimental_output: Output.object({
        schema: responseSchema,
      }),
      system: SYSTEM_PROMPT,
      messages,
      abortSignal: req.signal,
      providerOptions: {
        google: {
          thinkingConfig: {
            thinkingBudget: 128,
          },
        } satisfies GoogleGenerativeAIProviderOptions,
      },
    });

    if (usage) {
      try {
        await recordAIUsage({
          promptTokens: usage.promptTokens,
          completionTokens: usage.completionTokens,
        });
      } catch (error) {
        logError(error as Error, { action: "recordAIUsage", usage });
      }
    }

    return new Response(JSON.stringify(result), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    if (
      error instanceof Error &&
      (error.name === "AbortError" || error.name === "ResponseAborted")
    ) {
      return new Response("Request aborted by user", { status: 499 });
    }

    return handleError(error, { route: "/api/generate-theme" });
  }
}
