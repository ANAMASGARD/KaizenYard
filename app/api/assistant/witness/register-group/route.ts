import { auth } from "@clerk/nextjs/server";
import { createWitnessGroup } from "@/lib/assistant/actions";

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return new Response("Unauthorized", { status: 401 });
  }

  const body = (await request.json()) as {
    name?: string;
    boardId?: number;
    commitment?: string;
  };

  if (!body.name?.trim()) {
    return Response.json({ error: "name required" }, { status: 400 });
  }

  const group = await createWitnessGroup({
    name: body.name.trim(),
    boardId: body.boardId,
    commitment: body.commitment,
  });

  return Response.json({ group });
}
