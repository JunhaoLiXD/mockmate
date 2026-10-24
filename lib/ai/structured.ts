import "server-only";

import { z } from "zod";

/**
 * Calls the OpenAI Responses API with Structured Outputs (strict JSON Schema) over plain fetch,
 * then validates the result with the same zod schema.
 * Docs: https://developers.openai.com/api/docs/guides/structured-outputs
 *       https://developers.openai.com/api/reference/resources/responses/methods/create
 *
 * Schema rules for strict mode: every field is required (use .nullable() for optional values),
 * the root is an object, and no string length limits (enforce those after parsing).
 */

const RESPONSES_URL = "https://api.openai.com/v1/responses";

export type AiErrorKind = "timeout" | "upstream" | "refusal" | "incomplete" | "invalid-output";

export class AiError extends Error {
  constructor(readonly kind: AiErrorKind, message: string) {
    super(message);
    this.name = "AiError";
  }
}

export interface StructuredRequest<T extends z.ZodType> {
  apiKey: string;
  model: string;
  /** Schema name sent to OpenAI, e.g. "candidate_analysis". */
  name: string;
  schema: T;
  instructions: string;
  input: string;
  maxOutputTokens: number;
  reasoningEffort?: "none" | "minimal" | "low" | "medium" | "high";
  /** Hashed, non-reversible user identifier (see hashIdentifier). */
  safetyIdentifier: string;
  timeoutMs: number;
}

const SAFE_INT_BOUND = Number.MAX_SAFE_INTEGER;

/** Removes keys OpenAI does not need: the $schema marker and zod's default safe-integer bounds. */
function cleanJsonSchema(node: unknown): unknown {
  if (Array.isArray(node)) return node.map(cleanJsonSchema);
  if (typeof node !== "object" || node === null) return node;
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(node)) {
    if (key === "$schema") continue;
    if ((key === "minimum" || key === "maximum") && Math.abs(value as number) === SAFE_INT_BOUND) continue;
    result[key] = cleanJsonSchema(value);
  }
  return result;
}

export function toStrictJsonSchema(schema: z.ZodType): Record<string, unknown> {
  return cleanJsonSchema(z.toJSONSchema(schema)) as Record<string, unknown>;
}

interface ResponsesBody {
  status?: string;
  incomplete_details?: { reason?: string } | null;
  output?: Array<{ type: string; content?: Array<{ type: string; text?: string; refusal?: string }> }>;
}

export async function generateStructured<T extends z.ZodType>(request: StructuredRequest<T>): Promise<z.infer<T>> {
  const body: Record<string, unknown> = {
    model: request.model,
    instructions: request.instructions,
    input: request.input,
    max_output_tokens: request.maxOutputTokens,
    store: false,
    safety_identifier: request.safetyIdentifier,
    text: {
      format: { type: "json_schema", name: request.name, strict: true, schema: toStrictJsonSchema(request.schema) },
    },
  };
  if (request.reasoningEffort) body.reasoning = { effort: request.reasoningEffort };

  let response: Response;
  try {
    response = await fetch(RESPONSES_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${request.apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(request.timeoutMs),
    });
  } catch (error) {
    const name = error instanceof Error ? error.name : "unknown";
    console.error(`[ai:${request.name}] request failed:`, name);
    throw new AiError(name === "TimeoutError" ? "timeout" : "upstream", "The AI service did not respond in time.");
  }

  if (!response.ok) {
    // Log status and OpenAI's error text only; never the request body.
    const detail = await response.text().catch(() => "");
    console.error(`[ai:${request.name}] OpenAI returned`, response.status, detail.slice(0, 500));
    throw new AiError("upstream", "The AI service returned an error.");
  }

  const data = (await response.json()) as ResponsesBody;
  if (data.status === "incomplete") {
    console.error(`[ai:${request.name}] incomplete response:`, data.incomplete_details?.reason ?? "unknown");
    throw new AiError("incomplete", "The AI response was cut off.");
  }

  const content = data.output?.find((item) => item.type === "message")?.content?.[0];
  if (content?.type === "refusal") {
    console.error(`[ai:${request.name}] model refused`);
    throw new AiError("refusal", "The AI declined to process this input.");
  }
  if (content?.type !== "output_text" || typeof content.text !== "string") {
    console.error(`[ai:${request.name}] no output text`);
    throw new AiError("invalid-output", "The AI returned no usable result.");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(content.text);
  } catch {
    console.error(`[ai:${request.name}] output is not valid JSON`);
    throw new AiError("invalid-output", "The AI returned an unreadable result.");
  }
  const result = request.schema.safeParse(parsed);
  if (!result.success) {
    console.error(`[ai:${request.name}] output failed schema validation:`, result.error.issues.length, "issue(s)");
    throw new AiError("invalid-output", "The AI returned a result in the wrong shape.");
  }
  return result.data;
}
