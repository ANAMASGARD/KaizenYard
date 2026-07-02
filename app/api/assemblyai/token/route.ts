import { auth } from "@clerk/nextjs/server";
import { AssemblyAI } from "assemblyai";

function getAssemblyAIClient() {
  const apiKey = process.env.ASSEMBLYAI_API_KEY;
  if (!apiKey) {
    throw new Error("ASSEMBLYAI_API_KEY is not configured");
  }
  return new AssemblyAI({ apiKey });
}

export async function POST() {
  const { userId } = await auth();
  if (!userId) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const client = getAssemblyAIClient();
    const token = await client.streaming.createTemporaryToken({
      expires_in_seconds: 300,
    });
    return Response.json({ token });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to create token";
    return Response.json({ error: message }, { status: 500 });
  }
}
