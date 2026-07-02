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

type ActiveCollaboratorsProps = {
  compact?: boolean;
};

export function ActiveCollaborators({ compact = false }: ActiveCollaboratorsProps) {
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

  const avatarSize = compact ? "size-7" : "size-8";
  const overflowSize = compact ? "size-7 text-[9px]" : "size-8 text-[10px]";

  return (
    <Tooltip.Provider>
      <div className={cn("flex items-center", compact ? "gap-1" : "gap-2")}>
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
                      className={avatarSize}
                    />
                  </span>
                }
              />
              <Tooltip.Content>{participant.name}</Tooltip.Content>
            </Tooltip>
          ))}
          {overflow > 0 ? (
            <span
              className={cn(
                "ml-2 inline-flex items-center justify-center rounded-full border-2 border-border bg-muted font-head",
                overflowSize,
                !compact && "ml-3",
              )}
            >
              +{overflow}
            </span>
          ) : null}
        </div>
        <span
          className={cn(
            "inline-flex shrink-0 items-center gap-1 rounded border border-emerald-600 bg-emerald-100 font-head uppercase tracking-wider text-emerald-900 dark:bg-emerald-950 dark:text-emerald-100",
            compact
              ? "h-7 px-1.5 text-[9px]"
              : "px-2 py-0.5 text-[10px]",
          )}
        >
          <span className="size-1.5 animate-pulse rounded-full bg-emerald-600" />
          Live
        </span>
      </div>
    </Tooltip.Provider>
  );
}
