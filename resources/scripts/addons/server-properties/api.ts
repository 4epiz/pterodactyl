import http from '@/api/http';

export interface ServerProperty {
    key: string;
    value: string;
    type: 'text' | 'number' | 'boolean' | 'select';
    options: string[];
}

export interface PropertiesResponse {
    // False when the server has no server.properties yet (it has never started).
    exists: boolean;
    properties: ServerProperty[];
}

export const getProperties = async (uuid: string): Promise<PropertiesResponse> => {
    const { data } = await http.get(`/api/client/servers/${uuid}/properties`);

    return { exists: data.exists, properties: data.properties };
};

export const updateProperties = async (
    uuid: string,
    values: Record<string, string>
): Promise<{ properties: ServerProperty[]; changed: string[] }> => {
    const { data } = await http.post(`/api/client/servers/${uuid}/properties`, { values });

    return data;
};
