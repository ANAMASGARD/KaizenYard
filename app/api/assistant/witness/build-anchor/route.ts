import { auth } from "@clerk/nextjs/server";
import { assertAttestationForAnchor } from "@/lib/witness/attestations";
import { buildWitnessAnchorTx } from "@/lib/assistant/witness/anchor";

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return new Response("Unauthorized", { status: 401 });
  }

  const body = (await request.json()) as {
    sourceAddress?: string;
    witnessGroupId?: number;
    commitmentHex?: string;
    nullifierHex?: string;
    actionHash?: string;
    mode?: "witness" | "delegate";
  };

  if (
    !body.sourceAddress ||
    !body.witnessGroupId ||
    !body.commitmentHex ||
    !body.nullifierHex ||
    !body.actionHash
  ) {
    return Response.json({ error: "Missing required fields" }, { status: 400 });
  }

  try {
    await assertAttestationForAnchor(body.nullifierHex, body.witnessGroupId);

    const xdr = await buildWitnessAnchorTx({
      sourceAddress: body.sourceAddress,
      groupId: body.witnessGroupId,
      commitmentHex: body.commitmentHex,
      nullifierHex: body.nullifierHex,
      actionHash: body.actionHash,
      mode: body.mode ?? "witness",
    });

    if (!xdr) {
      return Response.json({
        configured: false,
        message: "Agent witness verifier contract not configured",
      });
    }

    return Response.json({ configured: true, xdr });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to build anchor tx";
    return Response.json({ error: message }, { status: 500 });
  }
}
