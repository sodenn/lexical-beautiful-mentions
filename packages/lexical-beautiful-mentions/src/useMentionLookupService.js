var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { useCallback, useEffect, useMemo, useState } from "react";
export function useMentionLookupService(queryString, trigger, items, onSearch) {
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState([]);
    const lookupService = useCallback((queryString, trigger) => __awaiter(this, void 0, void 0, function* () {
        const mentions = items &&
            Object.entries(items).find(([key]) => {
                return new RegExp(key).test(trigger);
            });
        if (mentions) {
            return !queryString
                ? [...mentions[1]]
                : mentions[1].filter((item) => item.toLowerCase().includes(queryString.toLowerCase()));
        }
        if (onSearch) {
            setLoading(true);
            return onSearch(trigger, queryString).finally(() => setLoading(false));
        }
        throw new Error("No lookup service provided");
    }), [items, onSearch]);
    useEffect(() => {
        if (trigger === null || queryString === null) {
            setResults([]);
            return;
        }
        lookupService(queryString, trigger).then(setResults);
    }, [queryString, lookupService, trigger]);
    return useMemo(() => ({ loading, results }), [loading, results]);
}
