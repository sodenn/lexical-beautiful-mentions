import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

interface QueryParams {
  value: string; // initial value
  focus: string; // autoFocus
  cf: string; // focus after insert
  async: string; // onSearch
  space: string; // allowSpaces
  new: string; // creatable
  blur: string; // insertOnBlur
  combobox: string; // combobox
  mentions: string; // showMentionsOnDelete
  enclosure: string; // mentionEnclosure
  cbai: string; // comboboxAdditionalItems
  cstmn: string; // custom mention node
}

export interface QueryParam {
  name: keyof QueryParams;
  value?: string;
}

export default function useQueryParams() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const setQueryParams = useCallback(
    (params: QueryParam[]) => {
      const newSearchParams = new URLSearchParams(
        Object.fromEntries(searchParams),
      );
      params.forEach(({ name, value }) => {
        if (value === "false") {
          newSearchParams.delete(name);
        } else {
          newSearchParams.set(name, value);
        }
      });
      const search = newSearchParams.toString();
      const query = search ? `?${search}` : "";
      router.push(`${pathname}${query}`);
    },
    [pathname, router, searchParams],
  );

  const hasQueryParams = useCallback(
    (name: keyof QueryParams) => searchParams.has(name),
    [searchParams],
  );

  const getQueryParam = useCallback(
    (name: keyof QueryParams) => searchParams.get(name),
    [searchParams],
  );

  return {
    setQueryParams,
    hasQueryParams,
    getQueryParam,
  };
}
