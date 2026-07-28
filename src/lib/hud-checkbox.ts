export type HudCheckboxMutationPayload = {
  pageId?: string;
  propertyName: string;
  checked: boolean;
};

type MutationResponse = {
  ok: boolean;
  json: () => Promise<unknown>;
};

type MutationFetcher = (
  input: string,
  init: RequestInit
) => Promise<MutationResponse>;

export type HudCheckboxMutationResult =
  | { ok: true }
  | { ok: false; error: string };

function getResponseError(payload: unknown) {
  if (
    payload &&
    typeof payload === "object" &&
    "error" in payload &&
    typeof payload.error === "string" &&
    payload.error.trim()
  ) {
    return payload.error.trim();
  }

  return "Command services rejected the update.";
}

export async function saveHudCheckbox({
  apiPath,
  payload,
  fetcher = fetch,
}: {
  apiPath: string;
  payload: HudCheckboxMutationPayload;
  fetcher?: MutationFetcher;
}): Promise<HudCheckboxMutationResult> {
  try {
    const response = await fetcher(apiPath, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const responsePayload = await response.json().catch(() => null);
      return {
        ok: false,
        error: getResponseError(responsePayload),
      };
    }

    return { ok: true };
  } catch {
    return {
      ok: false,
      error: "Unable to reach command services.",
    };
  }
}
