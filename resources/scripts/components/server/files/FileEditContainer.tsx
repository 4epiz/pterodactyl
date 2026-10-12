import React, { useEffect } from 'react';
import { useHistory, useLocation, useParams } from 'react-router';
import { dirname } from 'pathe';
import tw from 'twin.macro';
import FileManagerBreadcrumbs from '@/components/server/files/FileManagerBreadcrumbs';
import PageContentBlock from '@/components/elements/PageContentBlock';
import ErrorBoundary from '@/components/elements/ErrorBoundary';
import { ServerContext } from '@/state/server';
import { encodePathSegments, hashToPath } from '@/helpers';
import EditorWindow from '@/components/theme/editor/EditorWindow';

/**
 * Full page editor, used for direct links to /files/edit and /files/new. The
 * file manager itself opens files in the floating editor.
 */
export default () => {
    const { action } = useParams<{ action: 'new' | string }>();
    const history = useHistory();
    const { hash } = useLocation();

    const id = ServerContext.useStoreState((state) => state.server.data!.id);
    const setDirectory = ServerContext.useStoreActions((actions) => actions.files.setDirectory);

    const isNew = action === 'new';
    const filePath = hashToPath(hash);
    const directory = isNew ? filePath : dirname(filePath);

    useEffect(() => {
        setDirectory(directory);
    }, [directory, setDirectory]);

    return (
        <PageContentBlock>
            <ErrorBoundary>
                <div css={tw`mb-4`}>
                    <FileManagerBreadcrumbs withinFileEditor isNewFile={isNew} />
                </div>
            </ErrorBoundary>
            <div style={{ height: 'max(24rem, calc(100vh - 14rem))' }}>
                <EditorWindow
                    key={`${action}:${filePath}`}
                    path={filePath || '/'}
                    isNew={isNew}
                    onSaved={(path) => {
                        if (isNew) history.replace(`/server/${id}/files/edit#/${encodePathSegments(path)}`);
                    }}
                />
            </div>
        </PageContentBlock>
    );
};
