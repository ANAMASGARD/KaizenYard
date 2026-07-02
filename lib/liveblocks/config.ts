declare global {
  interface Liveblocks {
    Presence: {
      cursor?: { x: number; y: number } | null;
    };
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
    RoomEvent:
      | { type: "board-changed" }
      | { type: "note-changed" }
      | { type: "whiteboard-changed" }
      | { type: "page-changed" };
  }
}

export {};
