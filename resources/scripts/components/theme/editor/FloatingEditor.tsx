import React, { createContext, useCallback, useContext, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion, useDragControls } from 'framer-motion';
import EditorWindow from '@/components/theme/editor/EditorWindow';

interface Target {
    path: string;
    isNew: boolean;
}

interface FileEditorContextValue {
    openFile: (path: string) => void;
    newFile: (directory: string) => void;
}

const FileEditorContext = createContext<FileEditorContextValue | null>(null);

// Returns null outside the file manager, so callers can fall back to the
// full page editor route.
export const useFileEditor = () => useContext(FileEditorContext);

const ease = [0.22, 1, 0.36, 1];

const FloatingWindow = ({
    target,
    onClose,
    onSaved,
}: {
    target: Target;
    onClose: () => void;
    onSaved: (path: string) => void;
}) => {
    const [maximized, setMaximized] = useState(false);
    const controls = useDragControls();
    const bounds = useRef<HTMLDivElement>(null);

    return (
        <motion.div
            ref={bounds}
            className={'fixed inset-0 z-40 flex items-center justify-center p-3 sm:p-6'}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.14 } }}
            transition={{ duration: 0.18 }}
        >
            {/* Clicking outside does not close the editor, so work is never lost by accident. */}
            <div className={'absolute inset-0 backdrop-blur-[2px]'} style={{ background: 'rgb(0 0 0 / 0.35)' }} />
            <motion.div
                role={'dialog'}
                aria-modal
                aria-label={target.isNew ? 'New file' : target.path}
                drag={!maximized}
                dragControls={controls}
                dragListener={false}
                dragMomentum={false}
                dragConstraints={bounds}
                dragElastic={0.05}
                initial={{ opacity: 0, scale: 0.96, y: 12 }}
                animate={{ opacity: 1, scale: 1, y: 0, ...(maximized ? { x: 0 } : {}) }}
                exit={{ opacity: 0, scale: 0.98, y: 6, transition: { duration: 0.14 } }}
                transition={{ duration: 0.26, ease }}
                className={maximized ? 'absolute inset-3 sm:inset-4' : 'relative h-[min(82vh,860px)] w-full max-w-5xl'}
            >
                <EditorWindow
                    path={target.path}
                    isNew={target.isNew}
                    floating
                    maximized={maximized}
                    onToggleMaximize={() => setMaximized((value) => !value)}
                    onHeaderPointerDown={(e) => !maximized && controls.start(e)}
                    onClose={onClose}
                    onSaved={onSaved}
                />
            </motion.div>
        </motion.div>
    );
};

interface ProviderProps {
    // Called after a file was saved, e.g. to refresh the file list.
    onSaved?: (path: string) => void;
    children: React.ReactNode;
}

/**
 * Lets the file manager open files in a floating editor window instead of
 * navigating to the full page editor.
 */
export const FileEditorProvider = ({ onSaved, children }: ProviderProps) => {
    const [target, setTarget] = useState<Target | null>(null);

    const openFile = useCallback((path: string) => setTarget({ path, isNew: false }), []);
    const newFile = useCallback((directory: string) => setTarget({ path: directory, isNew: true }), []);

    return (
        <FileEditorContext.Provider value={{ openFile, newFile }}>
            {children}
            {createPortal(
                <AnimatePresence>
                    {target && (
                        <FloatingWindow
                            key={`${target.isNew}:${target.path}`}
                            target={target}
                            onClose={() => setTarget(null)}
                            onSaved={(path) => {
                                // A new file becomes a normal edit session once it has a name.
                                if (target.isNew) setTarget({ path, isNew: false });
                                onSaved?.(path);
                            }}
                        />
                    )}
                </AnimatePresence>,
                document.body
            )}
        </FileEditorContext.Provider>
    );
};
