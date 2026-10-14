import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { SearchIcon } from '@heroicons/react/outline';
import useSWR from 'swr';
import { ServerContext } from '@/state/server';
import ServerContentBlock from '@/components/elements/ServerContentBlock';
import FlashMessageRender from '@/components/FlashMessageRender';
import Spinner from '@/components/elements/Spinner';
import Input from '@/components/elements/Input';
import Select from '@/components/elements/Select';
import { Button } from '@/components/elements/button/index';
import PageHeader from '@/components/theme/PageHeader';
import Toggle from '@/components/theme/Toggle';
import { usePermissions } from '@/plugins/usePermissions';
import { useFlashKey } from '@/plugins/useFlash';
import useFlash from '@/plugins/useFlash';
import { DocumentTextIcon } from '@heroicons/react/outline';
import { getProperties, PropertiesResponse, ServerProperty, updateProperties } from './api';

// "max-players" -> "Max players", "enable-rcon" -> "Enable RCON"
const humanize = (key: string) => {
    const words = key.replace(/[._-]+/g, ' ').trim();
    const label = words.charAt(0).toUpperCase() + words.slice(1);

    return label.replace(/\b(rcon|pvp|motd|ip|id|jmx|tps|mspt|nbt)\b/gi, (word) => word.toUpperCase());
};

const PropertyInput = ({
    property,
    value,
    onChange,
    disabled,
}: {
    property: ServerProperty;
    value: string;
    onChange: (value: string) => void;
    disabled: boolean;
}) => {
    const id = `property-${property.key}`;

    switch (property.type) {
        case 'boolean':
            return (
                <Toggle
                    id={id}
                    checked={value === 'true'}
                    onChange={(checked) => onChange(checked ? 'true' : 'false')}
                    disabled={disabled}
                />
            );
        case 'select':
            return (
                <Select
                    id={id}
                    value={value}
                    onChange={(e) => onChange(e.currentTarget.value)}
                    disabled={disabled}
                    className={'!w-full sm:!w-56'}
                >
                    {!property.options.includes(value) && <option value={value}>{value || '(empty)'}</option>}
                    {property.options.map((option) => (
                        <option key={option} value={option}>
                            {option.replace(/^minecraft:/, '').replace(/_/g, ' ')}
                        </option>
                    ))}
                </Select>
            );
        default:
            return (
                <Input
                    id={id}
                    type={property.type === 'number' ? 'number' : 'text'}
                    value={value}
                    onChange={(e) => onChange(e.currentTarget.value.replace(/[\r\n]/g, ''))}
                    disabled={disabled}
                    className={property.type === 'number' ? 'sm:!w-56' : 'sm:!w-80'}
                    spellCheck={false}
                />
            );
    }
};

export default () => {
    const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);
    const [canUpdate] = usePermissions('properties.update');
    const { clearFlashes, clearAndAddHttpError } = useFlashKey('server:properties');
    const { addFlash } = useFlash();

    const {
        data: response,
        error,
        mutate,
    } = useSWR<PropertiesResponse>([uuid, '/addons/properties'], () => getProperties(uuid), {
        revalidateOnFocus: false,
    });
    const data = response?.properties;

    const [values, setValues] = useState<Record<string, string>>({});
    const [query, setQuery] = useState('');
    const [saving, setSaving] = useState(false);

    const reset = (properties?: ServerProperty[]) =>
        setValues(Object.fromEntries((properties || []).map((property) => [property.key, property.value])));

    useEffect(() => reset(data), [data]);

    useEffect(() => {
        if (error) clearAndAddHttpError(error);
    }, [error]);

    const changed = useMemo(
        () =>
            (data || []).filter(
                (property) => values[property.key] !== undefined && values[property.key] !== property.value
            ),
        [data, values]
    );

    const visible = useMemo(() => {
        const search = query.trim().toLowerCase();
        if (!data || !search) return data || [];

        return data.filter(
            (property) =>
                property.key.toLowerCase().includes(search) || humanize(property.key).toLowerCase().includes(search)
        );
    }, [data, query]);

    const save = () => {
        clearFlashes();
        setSaving(true);

        updateProperties(uuid, Object.fromEntries(changed.map((property) => [property.key, values[property.key]])))
            .then(({ properties }) => {
                mutate({ exists: true, properties }, false);
                addFlash({
                    key: 'server:properties',
                    type: 'success',
                    message: 'Saved. Restart the server for the changes to take effect.',
                });
            })
            .catch((error) => clearAndAddHttpError(error))
            .then(() => setSaving(false));
    };

    return (
        <ServerContentBlock title={'Properties'}>
            <PageHeader
                title={'Server properties'}
                description={'Settings from server.properties. Changes apply after a restart.'}
                actions={
                    response?.exists && (
                        <div className={'relative w-full sm:w-64'}>
                            <SearchIcon
                                className={
                                    'pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-fg-subtle'
                                }
                                strokeWidth={1.8}
                            />
                            <Input
                                type={'search'}
                                placeholder={'Search properties'}
                                value={query}
                                onChange={(e) => setQuery(e.currentTarget.value)}
                                className={'!pl-9'}
                                aria-label={'Search properties'}
                            />
                        </div>
                    )
                }
            />
            <FlashMessageRender byKey={'server:properties'} className={'mb-4'} />
            {!response ? (
                !error && <Spinner size={'large'} centered />
            ) : !response.exists ? (
                <div className={'panel rounded-2xl px-6 py-14 text-center'}>
                    <DocumentTextIcon className={'mx-auto h-8 w-8 text-fg-subtle'} strokeWidth={1.4} />
                    <p className={'mt-3 text-sm font-medium text-fg'}>No server.properties yet</p>
                    <p className={'mx-auto mt-1 max-w-sm text-sm text-fg-subtle'}>
                        Minecraft creates this file the first time the server starts. Start the server once, then come
                        back here to change its settings.
                    </p>
                </div>
            ) : !data ? null : (
                <>
                    <div className={'panel divide-y divide-line overflow-hidden rounded-2xl'}>
                        {visible.length === 0 ? (
                            <p className={'px-5 py-10 text-center text-sm text-fg-subtle'}>
                                {data.length === 0
                                    ? 'The server.properties file is empty.'
                                    : 'No properties match your search.'}
                            </p>
                        ) : (
                            visible.map((property) => {
                                const isChanged = values[property.key] !== property.value;

                                return (
                                    <div
                                        key={property.key}
                                        className={
                                            'flex flex-col gap-3 px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between'
                                        }
                                    >
                                        <label htmlFor={`property-${property.key}`} className={'min-w-0'}>
                                            <span className={'flex items-center gap-2 text-sm font-medium text-fg'}>
                                                {humanize(property.key)}
                                                {isChanged && (
                                                    <span
                                                        className={'h-1.5 w-1.5 rounded-full bg-accent'}
                                                        title={'Changed'}
                                                    />
                                                )}
                                            </span>
                                            <span className={'block truncate font-mono text-xs text-fg-subtle'}>
                                                {property.key}
                                            </span>
                                        </label>
                                        <PropertyInput
                                            property={property}
                                            value={values[property.key] ?? property.value}
                                            onChange={(value) =>
                                                setValues((current) => ({ ...current, [property.key]: value }))
                                            }
                                            disabled={!canUpdate || saving}
                                        />
                                    </div>
                                );
                            })
                        )}
                    </div>
                    <AnimatePresence>
                        {changed.length > 0 && (
                            <motion.div
                                initial={{ opacity: 0, y: 16 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 16 }}
                                transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                                className={
                                    'sticky bottom-4 z-10 mt-4 flex items-center justify-between gap-3 rounded-2xl border border-line bg-surface px-4 py-3 shadow-pop'
                                }
                            >
                                <p className={'text-sm text-fg-muted'}>
                                    {changed.length} unsaved {changed.length === 1 ? 'change' : 'changes'}
                                </p>
                                <div className={'flex gap-2'}>
                                    <Button.Text onClick={() => reset(data)} disabled={saving}>
                                        Discard
                                    </Button.Text>
                                    <Button onClick={save} disabled={saving}>
                                        {saving ? 'Saving…' : 'Save changes'}
                                    </Button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </>
            )}
        </ServerContentBlock>
    );
};
