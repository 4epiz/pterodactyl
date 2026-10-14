import http from '@/api/http';

export interface VersionOption {
    id: number;
    name: string;
    current: boolean;
}

export interface VersionGroup {
    id: number;
    name: string;
    type: 'download' | 'egg';
    versions: VersionOption[];
}

export interface VersionsResponse {
    groups: VersionGroup[];
    current: { name: string; installed_at: string } | null;
}

export const getVersions = async (uuid: string): Promise<VersionsResponse> => {
    const { data } = await http.get(`/api/client/servers/${uuid}/versions`);

    return data;
};

export const installVersion = async (
    uuid: string,
    group: number,
    version: number,
    wipe: boolean
): Promise<{ name: string; reinstalling: boolean }> => {
    // Wings downloads the file before the request returns, which can take a while.
    const { data } = await http.post(
        `/api/client/servers/${uuid}/versions/install`,
        { group, version, wipe },
        { timeout: 10 * 60 * 1000 }
    );

    return data;
};
