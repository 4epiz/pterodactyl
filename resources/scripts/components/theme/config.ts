/**
 * Theme settings managed from Admin > Theme. The server renders them into
 * window.SiteConfiguration.theme (see app/Services/Theme/ThemeSettingsService.php);
 * the defaults below mirror the PHP defaults and are used for anything missing.
 */
export interface ThemeConfig {
    branding: {
        subtitle: string;
        logo_url: string;
        login_title: string;
        login_subtitle: string;
        footer_text: string;
    };
    appearance: {
        accent: string;
        allow_accent_change: boolean;
        default_mode: 'system' | 'dark' | 'light';
        allow_mode_change: boolean;
        show_greeting: boolean;
        show_featured: boolean;
    };
    announcement: {
        id: string;
        type: 'info' | 'success' | 'warning' | 'danger';
        title: string;
        message: string;
        link_url: string;
        link_label: string;
        dismissible: boolean;
    } | null;
    links: {
        billing_url: string;
        support_url: string;
        status_url: string;
        discord_url: string;
    };
    game_images: Record<string, string>;
}

export const defaultThemeConfig: ThemeConfig = {
    branding: {
        subtitle: 'Control panel',
        logo_url: '',
        login_title: 'Sign in',
        login_subtitle: 'Welcome back. Enter your details to manage your servers.',
        footer_text: '',
    },
    appearance: {
        accent: 'lime',
        allow_accent_change: true,
        default_mode: 'system',
        allow_mode_change: true,
        show_greeting: true,
        show_featured: true,
    },
    announcement: null,
    links: { billing_url: '', support_url: '', status_url: '', discord_url: '' },
    game_images: {},
};

export const DEFAULT_LOGO = '/assets/svgs/pterodactyl.svg';

let cached: ThemeConfig | undefined;

export const themeConfig = (): ThemeConfig => {
    if (cached) return cached;

    const raw = (typeof window !== 'undefined' && (window as any).SiteConfiguration?.theme) || {};

    cached = {
        branding: { ...defaultThemeConfig.branding, ...(raw.branding || {}) },
        appearance: { ...defaultThemeConfig.appearance, ...(raw.appearance || {}) },
        announcement: raw.announcement && raw.announcement.message ? raw.announcement : null,
        links: { ...defaultThemeConfig.links, ...(raw.links || {}) },
        game_images: { ...(raw.game_images || {}) },
    };

    return cached;
};
