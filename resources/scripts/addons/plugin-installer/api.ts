import http from '@/api/http';

export type PluginSource = 'spigot' | 'modrinth' | 'polymart';

export interface Plugin {
    source: PluginSource;
    id: string;
    name: string;
    summary: string;
    icon: string | null;
    author: string | null;
    downloads: number;
    rating: number | null;
    updatedAt: string | null;
    url: string;
    premium: boolean;
    installable: boolean;
    gameVersions: string[];
    latestVersion: string | null;
}

export interface PluginVersion {
    id: string;
    name: string;
    downloads: number | null;
    releasedAt: string | null;
    gameVersions: string[];
    installable: boolean;
}

export interface InstalledPlugin {
    file: string;
    size: number;
    modifiedAt: string | null;
    source: PluginSource | null;
    id: string | null;
    version: string | null;
}

export interface SearchParams {
    source: PluginSource;
    query: string;
    page: number;
    category?: number | null;
    version?: string | null;
}

const toPlugin = (data: any): Plugin => ({
    source: data.source,
    id: data.id,
    name: data.name,
    summary: data.summary,
    icon: data.icon,
    author: data.author,
    downloads: data.downloads,
    rating: data.rating,
    updatedAt: data.updated_at,
    url: data.url,
    premium: data.premium,
    installable: data.installable,
    gameVersions: data.game_versions || [],
    latestVersion: data.latest_version,
});

const toInstalled = (data: any): InstalledPlugin => ({
    file: data.file,
    size: data.size,
    modifiedAt: data.modified_at,
    source: data.source,
    id: data.id,
    version: data.version,
});

export const searchPlugins = async (
    uuid: string,
    { source, query, page, category, version }: SearchParams
): Promise<{ plugins: Plugin[]; page: number; hasMore: boolean }> => {
    const { data } = await http.get(`/api/client/servers/${uuid}/plugins`, {
        params: {
            source,
            query: query || undefined,
            page,
            category: category || undefined,
            version: version || undefined,
        },
    });

    return { plugins: data.plugins.map(toPlugin), page: data.page, hasMore: data.has_more };
};

export const getPluginVersions = async (uuid: string, plugin: Plugin): Promise<PluginVersion[]> => {
    const { data } = await http.get(`/api/client/servers/${uuid}/plugins/${plugin.source}/${plugin.id}/versions`);

    return data.versions.map((version: any) => ({
        id: version.id,
        name: version.name,
        downloads: version.downloads,
        releasedAt: version.released_at,
        gameVersions: version.game_versions || [],
        installable: version.installable,
    }));
};

export const getInstalledPlugins = async (uuid: string): Promise<InstalledPlugin[]> => {
    const { data } = await http.get(`/api/client/servers/${uuid}/plugins/installed`);

    return data.plugins.map(toInstalled);
};

export const installPlugin = async (
    uuid: string,
    plugin: Pick<Plugin, 'source' | 'id'>,
    version?: string
): Promise<InstalledPlugin[]> => {
    const { data } = await http.post(
        `/api/client/servers/${uuid}/plugins/install`,
        { source: plugin.source, id: plugin.id, version },
        { timeout: 5 * 60 * 1000 }
    );

    return data.plugins.map(toInstalled);
};

export const uninstallPlugin = async (uuid: string, file: string): Promise<InstalledPlugin[]> => {
    const { data } = await http.post(`/api/client/servers/${uuid}/plugins/uninstall`, { file });

    return data.plugins.map(toInstalled);
};
