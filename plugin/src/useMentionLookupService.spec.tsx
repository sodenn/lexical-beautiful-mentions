import { renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useMentionLookupService } from "./useMentionLookupService";

const items = {
  "@": ["Jane"],
  "\\w+:": ["today", "tomorrow"],
};

const queryFn = async (trigger: string, queryString?: string | null) => {
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
  it("should return the full list of mentions when the search term is empty", async () => {
    const { result } = renderHook(() =>
      useMentionLookupService({
        queryString: "",
        trigger: "due:",
        items: items,
      }),
    );
    await waitFor(() => {
      expect(result.current.results).toStrictEqual(["today", "tomorrow"]);
    });
  });

  it("should return the full list of mentions when the search term is null", async () => {
    const { result } = renderHook(() =>
      useMentionLookupService({
        queryString: null,
        trigger: "due:",
        items: items,
      }),
    );

    await waitFor(() => {
      expect(result.current.results).toStrictEqual(["today", "tomorrow"]);
    });
  });

  it("should return a filtered mention list for predefined items and search term", async () => {
    const { result } = renderHook(() =>
      useMentionLookupService({
        queryString: "tomo",
        trigger: "due:",
        items: items,
      }),
    );
    await waitFor(() => {
      expect(result.current.results).toStrictEqual(["tomorrow"]);
    });
  });

  it("should execute the mentions query function", async () => {
    type Params = Parameters<typeof useMentionLookupService>;
    type Options = Params[0];

    const options: Options = {
      queryString: null,
      trigger: null,
      onSearch: queryFn,
      searchDelay: 100,
    };

    const { result, rerender } = renderHook(
      (opt: Options) => useMentionLookupService(opt),
      {
        initialProps: options,
      },
    );

    expect(result.current.loading).toBe(false);
    expect(result.current.query).toBeNull();
    expect(result.current.results).toStrictEqual([]);

    rerender({ ...options, trigger: "due:", queryString: "tomor" });

    await waitFor(
      () => {
        expect(result.current.loading).toBe(true);
      },
      { timeout: 200 },
    );

    await waitFor(() => {
      expect(result.current.query).toStrictEqual("tomor");
      expect(result.current.results).toStrictEqual(["tomorrow"]);
      expect(result.current.loading).toBe(false);
    });
  });

  it("should return an empty array when no matching trigger was found", async () => {
    const { result } = renderHook(() =>
      useMentionLookupService({
        queryString: "j",
        trigger: "#",
        items: items,
      }),
    );

    await waitFor(() => {
      expect(result.current.results).toStrictEqual([]);
    });
  });

  it("should handle trigger change", async () => {
    const { result, rerender } = renderHook(
      ({ queryString, trigger }) =>
        useMentionLookupService({
          queryString: queryString,
          trigger: trigger,
          items: items,
        }),
      {
        initialProps: { queryString: "ja", trigger: "@" },
      },
    );

    await waitFor(() => {
      expect(result.current.results).toStrictEqual(["Jane"]);
    });

    rerender({ queryString: "ja", trigger: "due:" });

    await waitFor(() => {
      expect(result.current.results).toEqual([]);
    });
  });
});
