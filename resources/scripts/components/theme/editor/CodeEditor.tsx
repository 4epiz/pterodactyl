import React, { useEffect, useRef } from 'react';
import CodeMirror from 'codemirror';
// Loads CodeMirror's language modes and addons (side effects only).
import '@/components/elements/CodemirrorEditor';
import './editor.css';

require('codemirror/addon/selection/active-line');

export interface Cursor {
    line: number;
    column: number;
    selected: number;
}

interface Props {
    // Content loaded into the editor; changing it replaces the document and
    // resets the undo history.
    value: string;
    mode: string;
    wrap: boolean;
    readOnly?: boolean;
    onReady?: (editor: CodeMirror.Editor) => void;
    onSave?: () => void;
    onChange?: (editor: CodeMirror.Editor) => void;
    onCursor?: (cursor: Cursor) => void;
    className?: string;
}

/**
 * CodeMirror 5 with the theme's own "graphite" styling. Callbacks are read
 * through a ref so parents can pass inline functions without recreating the
 * editor.
 */
export default ({ value, mode, wrap, readOnly, className, ...callbacks }: Props) => {
    const host = useRef<HTMLDivElement>(null);
    const editor = useRef<CodeMirror.Editor>();
    const handlers = useRef(callbacks);
    handlers.current = callbacks;

    useEffect(() => {
        const node = host.current;
        if (!node) return;

        // Addon options (active line, brackets, selection matches) are missing
        // from the CodeMirror typings, hence the cast.
        const options: Record<string, unknown> = {
            value,
            mode,
            theme: 'graphite',
            indentUnit: 4,
            tabSize: 4,
            smartIndent: true,
            indentWithTabs: false,
            lineWrapping: wrap,
            lineNumbers: true,
            foldGutter: true,
            fixedGutter: true,
            scrollbarStyle: 'overlay',
            readOnly: !!readOnly,
            autofocus: true,
            styleActiveLine: true,
            autoCloseBrackets: true,
            matchBrackets: true,
            highlightSelectionMatches: { showToken: false, annotateScrollbar: true },
            gutters: ['CodeMirror-linenumbers', 'CodeMirror-foldgutter'],
            extraKeys: {
                'Ctrl-S': () => handlers.current.onSave?.(),
                'Cmd-S': () => handlers.current.onSave?.(),
                Tab: (cm: CodeMirror.Editor) =>
                    cm.somethingSelected() ? cm.execCommand('indentMore') : cm.execCommand('insertSoftTab'),
                'Shift-Tab': 'indentLess',
            },
        };

        const instance = CodeMirror(node, options as CodeMirror.EditorConfiguration);

        const emitCursor = () => {
            const cursor = instance.getCursor();
            handlers.current.onCursor?.({
                line: cursor.line + 1,
                column: cursor.ch + 1,
                selected: instance.getSelection().length,
            });
        };

        instance.on('change', () => handlers.current.onChange?.(instance));
        instance.on('cursorActivity', emitCursor);

        editor.current = instance;
        handlers.current.onReady?.(instance);
        emitCursor();

        return () => {
            node.innerHTML = '';
            editor.current = undefined;
        };
    }, []);

    useEffect(() => {
        const instance = editor.current;
        if (!instance || instance.getValue() === value) return;

        instance.setValue(value);
        // Loading a file should not be undoable.
        instance.clearHistory();
        handlers.current.onChange?.(instance);
    }, [value]);

    useEffect(() => {
        editor.current?.setOption('mode', mode);
    }, [mode]);

    useEffect(() => {
        editor.current?.setOption('lineWrapping', wrap);
    }, [wrap]);

    useEffect(() => {
        editor.current?.setOption('readOnly', !!readOnly);
    }, [readOnly]);

    return <div ref={host} className={className} />;
};
