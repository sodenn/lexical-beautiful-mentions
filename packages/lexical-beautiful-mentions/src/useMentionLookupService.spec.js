var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useMentionLookupService } from "./useMentionLookupService";
const items = {
    "@": ["Jane"],
    "\\w+:": ["today", "tomorrow"],
};
const queryFn = (trigger, queryString) => __awaiter(void 0, void 0, void 0, function* () {
    yield new Promise((resolve) => setTimeout(resolve, 100));
    const mentions = Object.entries(items).find(([key]) => {
        return new RegExp(key).test(trigger);
    });
    return mentions
        ? mentions[1].filter((m) => queryString ? m.toLowerCase().startsWith(queryString.toLowerCase()) : m)
        : [];
});
describe("useMentionLookupService", () => {
    it("should return all mentions for predefined items and no search term", () => __awaiter(void 0, void 0, void 0, function* () {
        const { result } = renderHook(() => useMentionLookupService("", "due:", items));
        yield waitFor(() => {
            expect(result.current.results).toStrictEqual(["today", "tomorrow"]);
        });
    }));
    it("should return a filtered mention list for predefined items and search term", () => __awaiter(void 0, void 0, void 0, function* () {
        const { result } = renderHook(() => useMentionLookupService("tomo", "due:", items));
        yield waitFor(() => {
            expect(result.current.results).toStrictEqual(["tomorrow"]);
        });
    }));
    it("should execute the mentions query function", () => __awaiter(void 0, void 0, void 0, function* () {
        const { result } = renderHook(() => useMentionLookupService("tomo", "due:", undefined, queryFn));
        yield waitFor(() => {
            expect(result.current.loading).toBe(true);
        });
        yield waitFor(() => {
            expect(result.current.loading).toBe(false);
        });
        expect(result.current.results).toStrictEqual(["tomorrow"]);
    }));
});
