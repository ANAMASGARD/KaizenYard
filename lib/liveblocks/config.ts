declare global {
  interface Liveblocks {
    Presence: Record<string, never>;
    UserMeta: {
      id: string;
      info: {
        name: string;
        avatar: string;
        color: string;
      };
    };
    ThreadMetadata: {
      taskId: number;
    };
    RoomEvent: { type: "board-changed" };
  }
}

export {};
