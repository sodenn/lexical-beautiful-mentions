/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
import { LexicalCommand, LexicalEditor, TextNode } from "lexical";
import { MutableRefObject, ReactPortal } from "react";
export type QueryMatch = {
    leadOffset: number;
    matchingString: string;
    replaceableString: string;
};
export type Resolution = {
    match: QueryMatch;
    getRect: () => DOMRect;
};
export declare class TypeaheadOption {
    key: string;
    ref?: MutableRefObject<HTMLElement | null>;
    constructor(key: string);
    setRefElement(element: HTMLElement | null): void;
}
export type MenuRenderFn<TOption extends TypeaheadOption> = (anchorElementRef: MutableRefObject<HTMLElement | null>, itemProps: {
    selectedIndex: number | null;
    selectOptionAndCleanUp: (option: TOption) => void;
    setHighlightedIndex: (index: number) => void;
    options: Array<TOption>;
}, matchingString: string) => ReactPortal | JSX.Element | null;
export declare function getScrollParent(element: HTMLElement, includeHidden: boolean): HTMLElement | HTMLBodyElement;
export declare function useDynamicPositioning(resolution: Resolution | null, targetElement: HTMLElement | null, onReposition: () => void, onVisibilityChange?: (isInView: boolean) => void): void;
export declare const SCROLL_TYPEAHEAD_OPTION_INTO_VIEW_COMMAND: LexicalCommand<{
    index: number;
    option: TypeaheadOption;
}>;
export type TypeaheadMenuPluginProps<TOption extends TypeaheadOption> = {
    onQueryChange: (matchingString: string | null) => void;
    onSelectOption: (option: TOption, textNodeContainingQuery: TextNode | null, closeMenu: () => void, matchingString: string) => void;
    options: Array<TOption>;
    menuRenderFn: MenuRenderFn<TOption>;
    triggerFn: TriggerFn;
    onOpen?: (resolution: Resolution) => void;
    onClose?: () => void;
    anchorClassName?: string;
};
export type TriggerFn = (text: string, editor: LexicalEditor) => QueryMatch | null;
export declare function LexicalTypeaheadMenuPlugin<TOption extends TypeaheadOption>({ options, onQueryChange, onSelectOption, onOpen, onClose, menuRenderFn, triggerFn, anchorClassName, }: TypeaheadMenuPluginProps<TOption>): JSX.Element | null;
//# sourceMappingURL=LexicalTypeaheadMenuPlugin.d.ts.map