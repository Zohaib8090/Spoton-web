declare module 'youtube-captions-scraper' {
    export interface Subtitle {
        start: string;
        dur: string;
        text: string;
    }
    export function getSubtitles(options: { videoId: string, lang?: string }): Promise<Subtitle[]>;
}
