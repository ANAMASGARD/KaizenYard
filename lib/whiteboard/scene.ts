export type ExcalidrawElementLike = Record<string, unknown>;

export type WhiteboardScene = {
  elements: ExcalidrawElementLike[];
  appState: Record<string, unknown>;
  files: Record<string, unknown>;
};

export const EMPTY_WHITEBOARD_SCENE: WhiteboardScene = {
  elements: [],
  appState: {},
  files: {},
};

/** Runtime-only Excalidraw appState keys — never persist or restore (Maps, etc.). */
const EPHEMERAL_APP_STATE_KEYS = [
  "collaborators",
  "selectedElementIds",
  "previousSelectedElementIds",
  "selectedGroupIds",
  "editingGroupId",
  "selectedLinearElement",
  "stats",
] as const;

export function sanitizeAppStateForPersistence(
  appState: Record<string, unknown>,
): Record<string, unknown> {
  const copy = { ...appState };
  for (const key of EPHEMERAL_APP_STATE_KEYS) {
    delete copy[key];
  }
  return copy;
}

/** Strip ephemeral keys before passing appState into Excalidraw initialData / updateScene. */
export function sanitizeAppStateForExcalidraw(
  appState: Record<string, unknown>,
): Record<string, unknown> {
  return sanitizeAppStateForPersistence(appState);
}

export function parseWhiteboardScene(value: unknown): WhiteboardScene {
  if (!value || typeof value !== "object") {
    return EMPTY_WHITEBOARD_SCENE;
  }

  const record = value as Record<string, unknown>;

  return {
    elements: Array.isArray(record.elements)
      ? (record.elements as ExcalidrawElementLike[])
      : [],
    appState: sanitizeAppStateForPersistence(
      record.appState && typeof record.appState === "object"
        ? (record.appState as Record<string, unknown>)
        : {},
    ),
    files:
      record.files && typeof record.files === "object"
        ? (record.files as Record<string, unknown>)
        : {},
  };
}

export function serializeWhiteboardScene(scene: WhiteboardScene): WhiteboardScene {
  return {
    elements: scene.elements,
    appState: sanitizeAppStateForPersistence(scene.appState),
    files: scene.files,
  };
}

export function isSceneEmpty(scene: WhiteboardScene): boolean {
  return scene.elements.length === 0;
}
