/**
 * Secondary API Service - Uses api.gimita.id exclusively
 * Response format: { data: [...], success: true, statusCode: 200 }
 */

import type { Drama, Episode, QualityOption } from '$lib/types';
import { fixUrl, parseRating, parseYear } from '$lib/utils/helpers';

// Secondary API base URL (through Vercel proxy)
const API_BASE = '/api';

/**
 * Secondary API drama response structure
 */
interface SecondaryDramaResponse {
    bookId?: string;
    bookid?: string;
    bookName?: string;
    bookname?: string;
    cover?: string;
    coverWap?: string;
    introduction?: string;
    chapterCount?: number;
    latestChapter?: number;
    rating?: number;
    score?: number;
    finished?: boolean;
    status?: string;
    cornerName?: string;
    cornerColor?: string;
    viewCount?: number;
    playCount?: number;
    tags?: Array<{ tagName?: string; tagEnName?: string }>;
    tagNameList?: string[];
}

interface SecondaryApiResponse<T> {
    data?: T;
    success?: boolean;
    statusCode?: number;
    error?: string;
}

/**
 * Normalize drama data from secondary API response
 */
function normalizeDrama(data: SecondaryDramaResponse): Drama {
    // Extract genres from tags array or tagNameList
    let genres: string[] = [];
    if (data.tags && Array.isArray(data.tags)) {
        genres = data.tags.map(t => t.tagName || t.tagEnName || '').filter(Boolean);
    } else if (data.tagNameList && Array.isArray(data.tagNameList)) {
        genres = data.tagNameList;
    }

    return {
        bookId: data.bookId || data.bookid || '',
        bookName: data.bookName || data.bookname || 'Unknown',
        cover: fixUrl(data.coverWap || data.cover || ''),
        introduction: data.introduction || '',
        rating: parseRating(data.rating || data.score),
        genres,
        status: data.finished === false || data.status === 'Ongoing' ? 'Ongoing' : 'Completed',
        year: undefined,
        latestEpisode: data.latestChapter || data.chapterCount || 0,
        chapterCount: data.chapterCount,
        viewCount: data.viewCount || data.playCount,
        cornerLabel: data.cornerName
    };
}

/**
 * Fetch from secondary API via proxy
 */
async function fetchSecondaryApi<T>(action: string, params: Record<string, string | number> = {}): Promise<T | null> {
    const queryParams = new URLSearchParams({
        action,
        provider: 'secondary',
        ...Object.fromEntries(Object.entries(params).map(([k, v]) => [k, String(v)]))
    });

    const url = `${API_BASE}/${action}?${queryParams.toString()}`;

    try {
        const response = await fetch(url);

        if (!response.ok) {
            console.error(`Secondary API error: ${response.status}`);
            return null;
        }

        const result = await response.json() as SecondaryApiResponse<T>;

        if (!result.success || !result.data) {
            console.error('Secondary API returned no data');
            return null;
        }

        return result.data;
    } catch (error) {
        console.error('Secondary API fetch error:', error);
        return null;
    }
}

// ============= PUBLIC API FUNCTIONS =============

/**
 * Get home data (featured dramas) from secondary API
 */
export async function getHome(page = 1, size = 20): Promise<Drama[]> {
    const data = await fetchSecondaryApi<SecondaryDramaResponse[]>('home', { page, size });

    if (!data || !Array.isArray(data)) return [];
    return data.map(normalizeDrama);
}

/**
 * Get recommended dramas from secondary API
 */
export async function getRecommend(page = 1, size = 20): Promise<Drama[]> {
    const data = await fetchSecondaryApi<SecondaryDramaResponse[]>('recommend', { page, size });

    if (!data || !Array.isArray(data)) return [];
    return data.map(normalizeDrama);
}

/**
 * Get VIP content from secondary API
 */
export async function getVip(page = 1, size = 20): Promise<Drama[]> {
    interface VipData {
        bookList?: SecondaryDramaResponse[];
    }

    const data = await fetchSecondaryApi<VipData>('vip', { page, size });

    if (!data || !data.bookList || !Array.isArray(data.bookList)) return [];
    return data.bookList.map(normalizeDrama);
}

/**
 * Get categories list from secondary API
 */
export interface Category {
    id: number;
    name: string;
    replaceName?: string;
}

export async function getCategories(): Promise<Category[]> {
    const data = await fetchSecondaryApi<Category[]>('categories');

    if (!data || !Array.isArray(data)) return [];
    return data;
}

/**
 * Get dramas by category from secondary API
 */
export async function getCategory(categoryId: number, page = 1, size = 20): Promise<Drama[]> {
    const data = await fetchSecondaryApi<SecondaryDramaResponse[]>('category', {
        categoryId,
        page,
        size
    });

    if (!data || !Array.isArray(data)) return [];
    return data.map(normalizeDrama);
}

/**
 * Search dramas from secondary API
 */
export async function search(query: string, page = 1, size = 20): Promise<Drama[]> {
    const data = await fetchSecondaryApi<SecondaryDramaResponse[]>('search', {
        query,
        page,
        size
    });

    if (!data || !Array.isArray(data)) return [];
    return data.map(normalizeDrama);
}

/**
 * Get drama detail from secondary API
 */
export async function getDetail(bookId: string): Promise<Drama | null> {
    const data = await fetchSecondaryApi<SecondaryDramaResponse>('detail', { bookId });

    if (!data) return null;
    return normalizeDrama(data);
}

/**
 * Get episodes/chapters from secondary API
 */
interface ChapterResponse {
    chapterId?: string;
    chapterid?: string;
    chapterIndex?: number;
    index?: number;
    chapterName?: string;
    name?: string;
    cover?: string;
}

export async function getChapters(bookId: string): Promise<Array<Omit<Episode, 'videoUrl' | 'qualityOptions'>>> {
    const data = await fetchSecondaryApi<ChapterResponse[]>('chapters', { bookId });

    if (!data || !Array.isArray(data)) return [];

    return data.map((ep, idx) => ({
        chapterId: ep.chapterId || ep.chapterid || `ep-${idx}`,
        chapterIndex: ep.chapterIndex || ep.index || idx + 1,
        chapterName: ep.chapterName || ep.name || `Episode ${idx + 1}`,
        cover: fixUrl(ep.cover || '')
    }));
}

/**
 * Get stream URL from secondary API
 */
interface StreamResponse {
    videoUrl?: string;
    url?: string;
    quality?: number;
    cdnList?: Array<{
        cdnDomain?: string;
        videoPathList?: Array<{
            videoPath?: string;
            path?: string;
            definition?: number;
            quality?: number;
        }>;
    }>;
}

export async function getStream(bookId: string, chapterId: string): Promise<QualityOption[]> {
    const data = await fetchSecondaryApi<StreamResponse>('stream', { bookId, chapterId });

    if (!data) return [];

    const options: QualityOption[] = [];

    // Try cdnList first
    if (data.cdnList && data.cdnList.length > 0) {
        for (const cdn of data.cdnList) {
            const cdnDomain = cdn.cdnDomain;
            if (cdn.videoPathList) {
                cdn.videoPathList.forEach((path, idx) => {
                    let url = path.videoPath || path.path;
                    if (url) {
                        if (cdnDomain && !url.startsWith('http')) {
                            url = `https://${cdnDomain}${url.startsWith('/') ? '' : '/'}${url}`;
                        }
                        options.push({
                            quality: path.definition || path.quality || 720,
                            videoUrl: fixUrl(url),
                            isDefault: idx === 0
                        });
                    }
                });
            }
            if (options.length > 0) break;
        }
    }

    // Fallback to direct URL
    if (options.length === 0 && (data.videoUrl || data.url)) {
        options.push({
            quality: data.quality || 720,
            videoUrl: fixUrl(data.videoUrl || data.url || ''),
            isDefault: true
        });
    }

    return options.sort((a, b) => b.quality - a.quality);
}
