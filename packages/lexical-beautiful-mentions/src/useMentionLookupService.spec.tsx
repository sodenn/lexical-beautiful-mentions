import { renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useMentionLookupService } from "./useMentionLookupService";

const items = {
  "@": ["Jane"],
  "\\w+:": ["today", "tomorrow"],
};

const queryFn = async (
  trigger: string,
  queryString?: string | null | undefined,
) => {
  await new Promise((resolve) => setTimeout(resolve, 100));
  const mentions = Object.entries(items).find(([key]) => {
    return new RegExp(key).test(trigger);
  });
  return mentions
    ? mentions[1].filter((m) =>
        queryString ? m.toLowerCase().startsWith(queryString.toLowerCase()) : m,
      )
    : [];
};

describe("useMentionLookupService", () => {
  it("should return all mentions for predefined items and no search term", async () => {
    const { result } = renderHook(() =>
      useMentionLookupService("", "due:", items),
    );

    await waitFor(() => {
      expect(result.current.results).toStrictEqual(["today", "tomorrow"]);
    });
  });

  it("should return a filtered mention list for predefined items and search term", async () => {
    const { result } = renderHook(() =>
      useMentionLookupService("tomo", "due:", items),
    );

    await waitFor(() => {
      expect(result.current.results).toStrictEqual(["tomorrow"]);
    });
  });

  it("should execute the mentions query function", async () => {
    const { result } = renderHook(() =>
      useMentionLookupService("tomo", "due:", undefined, queryFn),
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(true);
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.results).toStrictEqual(["tomorrow"]);
  });
});
