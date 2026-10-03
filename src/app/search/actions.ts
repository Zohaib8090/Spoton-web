
'use server';

import { google } from 'googleapis';

export type YoutubeResult = {
    id: string;
    title: string;
    artist: string;
    thumbnail: string;
    duration: string;
}

function formatDuration(duration: string): string {
    const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
    if (!match) return "0:00";

    const hours = (parseInt(match[1]) || 0);
    const minutes = (parseInt(match[2]) || 0);
    const seconds = (parseInt(match[3]) || 0);

    const totalSeconds = hours * 3600 + minutes * 60 + seconds;

    const fmtMinutes = Math.floor(totalSeconds / 60);
    const fmtSeconds = totalSeconds % 60;

    return `${fmtMinutes}:${fmtSeconds.toString().padStart(2, '0')}`;
}

const CACHE_TTL_MS = 10 * 60 * 1000;
const CACHE_MAX_ENTRIES = 200;
const RATE_WINDOW_MS = 60 * 1000;
const RATE_MAX_REQUESTS = 30;

type SearchOutcome = { results?: YoutubeResult[], error?: string };

// search.list costs 100 quota units per call, so cache results and cap request volume.
const searchCache = new Map<string, { expires: number, value: SearchOutcome }>();
let rateWindowStart = 0;
let rateCount = 0;

function allowRequest(): boolean {
    const now = Date.now();
    if (now - rateWindowStart > RATE_WINDOW_MS) {
        rateWindowStart = now;
        rateCount = 0;
    }
    rateCount++;
    return rateCount <= RATE_MAX_REQUESTS;
}

export async function searchYoutubeAction(query: string, searchType: 'youtube' | 'youtubeMusic' = 'youtubeMusic'): Promise<SearchOutcome> {
    const normalized = query.trim().toLowerCase().slice(0, 200);
    if (!normalized) return { results: [] };

    const cacheKey = `${searchType}:${normalized}`;
    const cached = searchCache.get(cacheKey);
    if (cached && cached.expires > Date.now()) return cached.value;

    if (!allowRequest()) {
        return { error: 'Too many searches right now. Please try again in a minute.' };
    }

    const outcome = await fetchYoutubeResults(query.trim(), searchType);
    if (outcome.results) {
        if (searchCache.size >= CACHE_MAX_ENTRIES) {
            const oldest = searchCache.keys().next().value;
            if (oldest !== undefined) searchCache.delete(oldest);
        }
        searchCache.set(cacheKey, { expires: Date.now() + CACHE_TTL_MS, value: outcome });
    }
    return outcome;
}

async function fetchYoutubeResults(query: string, searchType: 'youtube' | 'youtubeMusic'): Promise<SearchOutcome> {
    const youtube = google.youtube('v3');
    const apiKey = process.env.YOUTUBE_API_KEY;

    if (!apiKey) {
        console.error('YOUTUBE_API_KEY environment variable not set.');
        return { error: 'Server configuration error: YouTube API key is missing.' };
    }

    try {
        const queryParams: any = {
            key: apiKey,
            part: ['snippet'],
            q: searchType === 'youtubeMusic' ? `${query} music` : query,
            type: ['video'],
            maxResults: 15,
        };

        if (searchType === 'youtubeMusic') {
            queryParams.videoCategoryId = '10'; // Music category
        }

        const searchResponse = await youtube.search.list(queryParams);

        const videoIds = searchResponse.data.items?.map(item => item.id?.videoId).filter((id): id is string => !!id) || [];

        if (videoIds.length === 0) {
            return { results: [] };
        }

        const videoResponse = await youtube.videos.list({
            key: apiKey,
            part: ['snippet', 'contentDetails'],
            id: videoIds,
        });

        const results = videoResponse.data.items?.map((item): YoutubeResult => {
            const artistTitle = item.snippet?.title || 'Unknown';
            let artist = item.snippet?.channelTitle || 'Unknown Artist';
            let title = artistTitle;

            const separators = [' - ', ' – ', ' -- '];
            for (const sep of separators) {
                if (artistTitle.includes(sep)) {
                    [artist, title] = artistTitle.split(sep, 2);
                    break;
                }
            }

            const thumbnails = item.snippet?.thumbnails;
            const thumbnail = thumbnails?.high?.url || thumbnails?.medium?.url || thumbnails?.default?.url || '';


            return {
                id: item.id || '',
                title: title.trim(),
                artist: artist.trim().replace(' - Topic', ''),
                thumbnail: thumbnail,
                duration: item.contentDetails?.duration ? formatDuration(item.contentDetails.duration) : '0:00',
            };
        }) || [];

        return { results };

    } catch (e: any) {
        console.error("Error searching YouTube:", e.message);
        return { error: 'Could not fetch results from YouTube.' };
    }
}
