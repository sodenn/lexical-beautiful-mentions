import { jsx as _jsx } from "react/jsx-runtime";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { useLexicalNodeSelection } from "@lexical/react/useLexicalNodeSelection";
import { mergeRegister } from "@lexical/utils";
import { $getNodeByKey, $getSelection, $isDecoratorNode, $isElementNode, $isNodeSelection, $isTextNode, $setSelection, BLUR_COMMAND, CLICK_COMMAND, COMMAND_PRIORITY_LOW, KEY_ARROW_LEFT_COMMAND, KEY_ARROW_RIGHT_COMMAND, KEY_BACKSPACE_COMMAND, KEY_DELETE_COMMAND, } from "lexical";
import React, { useCallback, useMemo, useState } from "react";
import { $isBeautifulMentionNode } from "./MentionNode";
export default function BeautifulMentionComponent(props) {
    const { mention, className = "", classNameFocused = "", nodeKey } = props;
    const [editor] = useLexicalComposerContext();
    const [isSelected, setSelected, clearSelection] = useLexicalNodeSelection(nodeKey);
    const [selection, setSelection] = useState(null);
    const isFocused = $isNodeSelection(selection) && isSelected;
    const ref = React.useRef(null);
    const classNameFinal = useMemo(() => {
        const classes = [className];
        if (isFocused) {
            classes.push(classNameFocused);
        }
        return classes.join(" ").trim() || undefined;
    }, [className, classNameFocused, isFocused]);
    const onDelete = useCallback((payload) => {
        if (isSelected && $isNodeSelection($getSelection())) {
            payload.preventDefault();
            const node = $getNodeByKey(nodeKey);
            if ($isBeautifulMentionNode(node)) {
                node.remove();
            }
            setSelected(false);
        }
        return false;
    }, [isSelected, nodeKey, setSelected]);
    const onArrowLeftPress = useCallback((event) => {
        const node = $getNodeByKey(nodeKey);
        if (!node || !node.isSelected()) {
            return false;
        }
        let handled = false;
        const nodeToSelect = node.getPreviousSibling();
        if ($isElementNode(nodeToSelect)) {
            nodeToSelect.selectEnd();
            handled = true;
        }
        if ($isTextNode(nodeToSelect)) {
            nodeToSelect.select();
            handled = true;
        }
        if ($isDecoratorNode(nodeToSelect)) {
            nodeToSelect.selectNext();
            handled = true;
        }
        if (nodeToSelect === null) {
            node.selectPrevious();
            handled = true;
        }
        if (handled) {
            event.preventDefault();
        }
        return handled;
    }, [nodeKey]);
    const onArrowRightPress = useCallback((event) => {
        const node = $getNodeByKey(nodeKey);
        if (!node || !node.isSelected()) {
            return false;
        }
        let handled = false;
        const nodeToSelect = node.getNextSibling();
        if ($isElementNode(nodeToSelect)) {
            nodeToSelect.selectStart();
            handled = true;
        }
        if ($isTextNode(nodeToSelect)) {
            nodeToSelect.select(0, 0);
            handled = true;
        }
        if ($isDecoratorNode(nodeToSelect)) {
            nodeToSelect.selectPrevious();
            handled = true;
        }
        if (nodeToSelect === null) {
            node.selectNext();
            handled = true;
        }
        if (handled) {
            event.preventDefault();
        }
        return handled;
    }, [nodeKey]);
    const onClick = useCallback((event) => {
        if (event.target === ref.current) {
            if (!event.shiftKey) {
                clearSelection();
            }
            setSelected(!isSelected);
            return true;
        }
        return false;
    }, [isSelected, clearSelection, setSelected]);
    const onBlur = useCallback(() => {
        if (isFocused) {
            $setSelection(null);
            return true;
        }
        return false;
    }, [isFocused]);
    React.useEffect(() => {
        let isMounted = true;
        const unregister = mergeRegister(editor.registerUpdateListener(({ editorState }) => {
            if (isMounted) {
                setSelection(editorState.read(() => $getSelection()));
            }
        }), editor.registerCommand(CLICK_COMMAND, onClick, COMMAND_PRIORITY_LOW), editor.registerCommand(KEY_DELETE_COMMAND, onDelete, COMMAND_PRIORITY_LOW), editor.registerCommand(KEY_BACKSPACE_COMMAND, onDelete, COMMAND_PRIORITY_LOW), editor.registerCommand(KEY_ARROW_LEFT_COMMAND, onArrowLeftPress, COMMAND_PRIORITY_LOW), editor.registerCommand(KEY_ARROW_RIGHT_COMMAND, onArrowRightPress, COMMAND_PRIORITY_LOW), editor.registerCommand(BLUR_COMMAND, onBlur, COMMAND_PRIORITY_LOW));
        return () => {
            isMounted = false;
            unregister();
        };
    }, [editor, onArrowLeftPress, onArrowRightPress, onClick, onBlur, onDelete]);
    return (_jsx("span", Object.assign({ ref: ref, className: classNameFinal }, { children: mention })));
}
