"use client";

import { useOthers, useSelf } from "@liveblocks/react/suspense";
import { Avatar } from "@/components/retroui/Avatar";
import { Tooltip } from "@/components/retroui/Tooltip";
import {
  bgClassForUserId,
  colorForUserId,
  initialsForName,
} from "@/lib/liveblocks/user-color";
import { cn } from "@/lib/utils";

type CollaboratorAvatarProps = {
  userId: string;
  name: string;
  avatarUrl?: string;
  className?: string;
  style?: React.CSSProperties;
};

function CollaboratorAvatar({
  userId,
  name,
  avatarUrl,
  className,
  style,
}: CollaboratorAvatarProps) {
  return (
    <Avatar
      className={cn(
        "size-8 border-2 border-background shadow-sm",
        bgClassForUserId(userId),
        className,
      )}
      style={{ ...style, borderColor: colorForUserId(userId) }}
    >
      {avatarUrl ? (
        <Avatar.Image src={avatarUrl} alt={name} />
      ) : null}
      <Avatar.Fallback className="font-head text-[10px]">
        {initialsForName(name)}
      </Avatar.Fallback>
    </Avatar>
  );
}

export function ActiveCollaborators() {
  const others = useOthers();
  const self = useSelf();

  const participants = [
    ...(self
      ? [
          {
            connectionId: self.connectionId,
            userId: self.id,
            name: self.info.name,
            avatar: self.info.avatar,
          },
        ]
      : []),
    ...others.map((other) => ({
      connectionId: other.connectionId,
      userId: other.id,
      name: other.info?.name ?? "Collaborator",
      avatar: other.info?.avatar,
    })),
  ];

  if (participants.length === 0) {
    return null;
  }

  const visible = participants.slice(0, 5);
  const overflow = participants.length - visible.length;

  return (
    <Tooltip.Provider>
      <div className="flex items-center gap-2">
      <div className="flex items-center -space-x-2">
        {visible.map((participant) => (
          <Tooltip key={participant.connectionId}>
            <Tooltip.Trigger
              render={
                <span className="inline-flex">
                  <CollaboratorAvatar
                    userId={participant.userId}
                    name={participant.name}
                    avatarUrl={participant.avatar}
                  />
                </span>
              }
            />
            <Tooltip.Content>{participant.name}</Tooltip.Content>
          </Tooltip>
        ))}
        {overflow > 0 ? (
          <span className="ml-3 inline-flex size-8 items-center justify-center rounded-full border-2 border-border bg-muted font-head text-[10px]">
            +{overflow}
          </span>
        ) : null}
      </div>
      <span className="inline-flex items-center gap-1 rounded border border-emerald-600 bg-emerald-100 px-2 py-0.5 font-head text-[10px] uppercase tracking-wider text-emerald-900 dark:bg-emerald-950 dark:text-emerald-100">
        <span className="size-1.5 animate-pulse rounded-full bg-emerald-600" />
        Live
      </span>
    </div>
    </Tooltip.Provider>
  );
}
