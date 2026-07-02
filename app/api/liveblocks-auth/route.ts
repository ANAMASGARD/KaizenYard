import { auth, currentUser } from "@clerk/nextjs/server";
import { Liveblocks } from "@liveblocks/node";
import {
  isKnownLiveblocksRoom,
  resolveLiveblocksRoomAccess,
} from "@/lib/liveblocks/room-auth";
import "@/lib/liveblocks/config";
import { colorForUserId } from "@/lib/liveblocks/user-color";

function getLiveblocksClient() {
  const secret = process.env.LIVEBLOCKS_SECRET_KEY;
  if (!secret) {
    throw new Error("LIVEBLOCKS_SECRET_KEY is not configured");
  }
  return new Liveblocks({ secret });
}

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return new Response("Unauthorized", { status: 401 });
  }

  const clerkUser = await currentUser();
  if (!clerkUser) {
    return new Response("Unauthorized", { status: 401 });
  }

  const body = (await request.json()) as { room?: string };
  const room = body.room;
  if (!room) {
    return new Response("Missing room", { status: 400 });
  }

  if (!isKnownLiveblocksRoom(room)) {
    return new Response("Invalid room", { status: 400 });
  }

  const access = await resolveLiveblocksRoomAccess(room, userId);
  if (!access) {
    return new Response("Forbidden", { status: 403 });
  }

  const name =
    [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") ||
    clerkUser.username ||
    "Collaborator";

  const session = getLiveblocksClient().prepareSession(userId, {
    userInfo: {
      name,
      avatar: clerkUser.imageUrl,
      color: colorForUserId(userId),
    },
  });

  session.allow(
    room,
    access === "viewer" ? session.READ_ACCESS : session.FULL_ACCESS,
  );

  const { body: responseBody, status } = await session.authorize();
  return new Response(responseBody, { status });
}
