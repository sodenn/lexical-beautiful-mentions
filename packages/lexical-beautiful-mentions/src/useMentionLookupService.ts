import { useCallback, useEffect, useMemo, useState } from "react";

export function useMentionLookupService(
  queryString: string | null,
  trigger: string | null,
  items?: Record<string, string[]>,
  onSearch?: (
    trigger: string,
    queryString?: string | null,
  ) => Promise<string[]>,
) {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Array<string>>([]);

  const lookupService = useCallback(
    async (queryString: string | null, trigger: string) => {
      const mentions =
        items &&
        Object.entries(items).find(([key]) => {
          return new RegExp(key).test(trigger);
        });
      if (mentions) {
        return !queryString
          ? [...mentions[1]]
          : mentions[1].filter((item) =>
              item.toLowerCase().includes(queryString.toLowerCase()),
            );
      }
      if (onSearch) {
        setLoading(true);
        return onSearch(trigger, queryString).finally(() => setLoading(false));
      }
      throw new Error("No lookup service provided");
    },
    [items, onSearch],
  );

  useEffect(() => {
    if (trigger === null || queryString === null) {
      setResults([]);
      return;
    }
    lookupService(queryString, trigger).then(setResults);
  }, [queryString, lookupService, trigger]);

  return useMemo(() => ({ loading, results }), [loading, results]);
}
