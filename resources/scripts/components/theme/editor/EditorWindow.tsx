import React, { useEffect, useRef, useState } from 'react';
import CodeMirror from 'codemirror';
import classNames from 'classnames';
import { basename, dirname, join } from 'pathe';
import {
    ArrowsExpandIcon,
    DocumentTextIcon,
    MenuAlt1Icon,
    SwitchHorizontalIcon,
    XIcon,
} from '@heroicons/react/outline';
import getFileContents from '@/api/server/files/getFileContents';
import saveFileContents from '@/api/server/files/saveFileContents';
import { httpErrorToHuman } from '@/api/http';
import { ServerContext } from '@/state/server';
import { usePermissions } from '@/plugins/usePermissions';
import { findModeByFilename } from '@/components/elements/CodemirrorEditor';
import FileNameModal from '@/components/server/files/FileNameModal';
import { Dialog } from '@/components/elements/dialog';
import Spinner from '@/components/elements/Spinner';
import modes from '@/modes';
import CodeEditor, { Cursor } from '@/components/theme/editor/CodeEditor';

const draftKey = (uuid: string, directory: string) => `pterodactyl:new-file:${uuid}:${directory}`;

export interface EditorWindowProps {
    // File being edited, or the directory a new file will be created in.
    path: string;
    isNew: boolean;
    // Floating windows get maximize and close controls.
    floating?: boolean;
    maximized?: boolean;
    onToggleMaximize?: () => void;
    onHeaderPointerDown?: (event: React.PointerEvent) => void;
    onClose?: () => void;
    // Called after a save; for new files with the path the file was created at.
    onSaved?: (path: string) => void;
}

const IconButton = ({
    title,
    active,
    ...props
}: { title: string; active?: boolean } & React.ComponentProps<'button'>) => (
    <button
        type={'button'}
        title={title}
        aria-label={title}
        {...props}
        className={classNames(
            'flex h-8 w-8 flex-none items-center justify-center rounded-lg transition-colors',
            active ? 'bg-surface-3 text-fg' : 'text-fg-subtle hover:bg-surface-3 hover:text-fg'
        )}
    />
);

export default ({
    path,
    isNew,
    floating,
    maximized,
    onToggleMaximize,
    onHeaderPointerDown,
    onClose,
    onSaved,
}: EditorWindowProps) => {
    const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);
    const [canUpdate, canCreate] = usePermissions(['file.update', 'file.create']);

    const [content, setContent] = useState('');
    const [loading, setLoading] = useState(!isNew);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [dirty, setDirty] = useState(false);
    const [mode, setMode] = useState(() => findModeByFilename(isNew ? '' : path)?.mime || 'text/plain');
    const [wrap, setWrap] = useState(true);
    const [cursor, setCursor] = useState<Cursor>({ line: 1, column: 1, selected: 0 });
    const [naming, setNaming] = useState(false);
    const [confirmClose, setConfirmClose] = useState(false);

    const editor = useRef<CodeMirror.Editor>();
    const clean = useRef(0);

    const directory = isNew ? path : dirname(path);
    const name = isNew ? 'Untitled' : basename(path);
    const canSave = isNew ? canCreate : canUpdate;
    const draft = isNew ? draftKey(uuid, directory) : undefined;

    const markClean = () => {
        if (editor.current) clean.current = editor.current.changeGeneration();
        setDirty(false);
    };

    useEffect(() => {
        setError('');
        setMode(findModeByFilename(isNew ? '' : path)?.mime || 'text/plain');

        if (isNew) {
            setContent((draft && sessionStorage.getItem(draft)) || '');
            setLoading(false);
            return;
        }

        setLoading(true);
        getFileContents(uuid, path)
            .then((value) => {
                setContent(value);
                // The editor applies the new value synchronously in its own effect.
                setTimeout(markClean, 0);
            })
            .catch((e) => setError(httpErrorToHuman(e)))
            .then(() => setLoading(false));
    }, [uuid, path, isNew]);

    const save = async (target?: string) => {
        if (!editor.current || saving || !canSave) return;

        if (isNew && !target) {
            setNaming(true);
            return;
        }

        setSaving(true);
        setError('');
        try {
            const destination = target || path;
            await saveFileContents(uuid, destination, editor.current.getValue());
            markClean();
            if (draft) sessionStorage.removeItem(draft);
            onSaved?.(destination);
        } catch (e) {
            setError(httpErrorToHuman(e));
        } finally {
            setSaving(false);
        }
    };

    const requestClose = () => {
        if (!onClose) return;
        dirty ? setConfirmClose(true) : onClose();
    };

    // Window level shortcuts so they also work when focus is outside the editor.
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
                e.preventDefault();
                save();
            }
            if (e.key === 'Escape' && floating && !naming && !confirmClose) {
                const target = e.target as HTMLElement | null;
                // Leave Escape to CodeMirror's search dialog when it is open.
                if (target?.closest('.CodeMirror-dialog')) return;
                requestClose();
            }
        };

        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    });

    return (
        <div
            className={
                'flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-pop'
            }
        >
            <header
                onPointerDown={onHeaderPointerDown}
                onDoubleClick={floating ? onToggleMaximize : undefined}
                className={classNames(
                    'flex h-12 flex-none items-center gap-2 border-b border-line pl-4 pr-2',
                    floating && !maximized && 'cursor-grab active:cursor-grabbing'
                )}
            >
                <DocumentTextIcon className={'h-4 w-4 flex-none text-fg-subtle'} strokeWidth={1.7} />
                <div className={'flex min-w-0 flex-1 items-baseline gap-1.5 text-sm'}>
                    <span className={'hidden truncate text-fg-subtle sm:inline'}>
                        {directory === '/' ? '/' : `${directory}/`}
                    </span>
                    <span className={'truncate font-medium text-fg'}>{name}</span>
                    {dirty && <span className={'flex-none text-xs text-fg-subtle'}>Unsaved</span>}
                    {!canSave && <span className={'flex-none text-xs text-fg-subtle'}>Read only</span>}
                </div>
                <div className={'flex flex-none items-center gap-1'} onPointerDown={(e) => e.stopPropagation()}>
                    <select
                        value={mode}
                        onChange={(e) => setMode(e.currentTarget.value)}
                        aria-label={'Language'}
                        className={
                            'hidden h-8 max-w-[9rem] rounded-lg border-0 bg-transparent py-0 pl-2 pr-7 text-xs text-fg-muted hover:bg-surface-3 focus:ring-2 focus:ring-accent/40 sm:block'
                        }
                    >
                        {modes.map((item) => (
                            <option key={`${item.name}_${item.mime}`} value={item.mime}>
                                {item.name}
                            </option>
                        ))}
                    </select>
                    <IconButton
                        title={wrap ? 'Disable word wrap' : 'Enable word wrap'}
                        active={wrap}
                        onClick={() => setWrap(!wrap)}
                    >
                        {wrap ? (
                            <MenuAlt1Icon className={'h-4 w-4'} strokeWidth={1.7} />
                        ) : (
                            <SwitchHorizontalIcon className={'h-4 w-4'} strokeWidth={1.7} />
                        )}
                    </IconButton>
                    {floating && (
                        <IconButton
                            title={maximized ? 'Restore' : 'Maximize'}
                            active={maximized}
                            onClick={onToggleMaximize}
                        >
                            <ArrowsExpandIcon className={'h-4 w-4'} strokeWidth={1.7} />
                        </IconButton>
                    )}
                    {canSave && (
                        <button
                            type={'button'}
                            onClick={() => save()}
                            disabled={saving || loading || (!dirty && !isNew)}
                            className={
                                'ml-1 flex h-8 items-center gap-2 rounded-lg bg-accent px-3 text-xs font-medium text-accent-fg transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40'
                            }
                        >
                            {saving ? <Spinner size={'small'} /> : isNew ? 'Create' : 'Save'}
                            <kbd className={'hidden font-sans opacity-60 md:inline'}>Ctrl S</kbd>
                        </button>
                    )}
                    {onClose && (
                        <IconButton title={'Close'} onClick={requestClose}>
                            <XIcon className={'h-4 w-4'} strokeWidth={1.8} />
                        </IconButton>
                    )}
                </div>
            </header>

            {error && (
                <div
                    className={
                        'flex-none border-b border-red-500/20 bg-red-500/[0.08] px-4 py-2 text-sm text-red-600 dark:text-red-400'
                    }
                >
                    {error}
                </div>
            )}
            {name.endsWith('.pteroignore') && (
                <div className={'flex-none border-b border-line bg-surface-2 px-4 py-2 text-xs text-fg-muted'}>
                    Files and folders listed here are excluded from backups. Use <code>*</code> as a wildcard and start
                    a line with <code>!</code> to negate an earlier rule.
                </div>
            )}

            <div className={'relative min-h-0 flex-1'}>
                {loading && (
                    <div className={'absolute inset-0 z-10 flex items-center justify-center bg-surface text-fg-muted'}>
                        <Spinner />
                    </div>
                )}
                <CodeEditor
                    className={'h-full'}
                    value={content}
                    mode={mode}
                    wrap={wrap}
                    readOnly={!canSave}
                    onReady={(instance) => {
                        editor.current = instance;
                        clean.current = instance.changeGeneration();
                    }}
                    onChange={(instance) => {
                        setDirty(!instance.isClean(clean.current));
                        if (draft) {
                            const value = instance.getValue();
                            value ? sessionStorage.setItem(draft, value) : sessionStorage.removeItem(draft);
                        }
                    }}
                    onCursor={setCursor}
                    onSave={() => save()}
                />
            </div>

            <footer
                className={
                    'flex h-8 flex-none items-center gap-4 border-t border-line px-4 text-[11px] tabular-nums text-fg-subtle'
                }
            >
                <span>
                    Ln {cursor.line}, Col {cursor.column}
                    {cursor.selected > 0 && ` (${cursor.selected} selected)`}
                </span>
                <span className={'hidden sm:inline'}>Spaces: 4</span>
                <span className={'hidden sm:inline'}>UTF-8</span>
                <span className={'ml-auto'}>{modes.find((item) => item.mime === mode)?.name || 'Plain Text'}</span>
            </footer>

            <FileNameModal
                visible={naming}
                onDismissed={() => setNaming(false)}
                onFileNamed={(file) => {
                    setNaming(false);
                    save(file.startsWith('/') ? file : join(directory, file));
                }}
            />
            <Dialog.Confirm
                open={confirmClose}
                title={'Discard unsaved changes?'}
                confirm={'Discard'}
                onClose={() => setConfirmClose(false)}
                onConfirmed={() => {
                    setConfirmClose(false);
                    onClose?.();
                }}
            >
                {`Your changes to ${name} have not been saved.`}
            </Dialog.Confirm>
        </div>
    );
};
