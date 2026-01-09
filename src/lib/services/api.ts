import type {
    Drama,
    Episode,
    QualityOption,
    DramaDetailResponse,
    EpisodeResponse,
    PlayResponse,
    CategoryType
} from '$lib/types';
import { fixUrl, parseRating, parseYear } from '$lib/utils/helpers';

// API base URL (through Vercel proxy)
const API_BASE = '/api';

/**
 * Normalize drama data from various API response formats
 */
function normalizeDrama(data: DramaDetailResponse): Drama {
    return {
        bookId: data.bookId || data.bookid || '',
        bookName: data.bookName || data.bookname || 'Unknown',
        cover: fixUrl(data.coverWap || data.cover || data.coverUrl),
        introduction: data.introduction || data.description || '',
        rating: parseRating(data.rating || data.score),
        genres: data.genres || data.tags || [],
        status: data.finished === false || data.status === 'Ongoing' ? 'Ongoing' : 'Completed',
        year: parseYear(data.year || data.releaseYear),
        latestEpisode: data.latestChapter || data.chapterCount || data.totalChapter || 0,
        chapterCount: data.chapterCount || data.totalChapter,
        viewCount: data.viewCount || data.playCount,
        cornerLabel: data.cornerLabel
    };
}

/**
 * Normalize episode data
 */
function normalizeEpisode(data: EpisodeResponse, index: number): Omit<Episode, 'videoUrl' | 'qualityOptions'> {
    return {
        chapterId: data.chapterId || data.chapterid || data.id || `ep-${index}`,
        chapterIndex: data.chapterIndex || data.index || index,
        chapterName: data.chapterName || data.name || data.title || `Episode ${index + 1}`,
        cover: fixUrl(data.cover || data.coverUrl)
    };
}

/**
 * Extract video URLs from episode data with cdnList
 */
function extractVideoUrls(data: EpisodeResponse): QualityOption[] {
    const options: QualityOption[] = [];

    // Try cdnList first
    if (data.cdnList && data.cdnList.length > 0) {
        for (const cdn of data.cdnList) {
            const cdnDomain = cdn.cdnDomain;
            if (cdn.videoPathList) {
                cdn.videoPathList.forEach((path, idx) => {
                    let url = path.videoPath || path.path || path.url;
                    if (url) {
                        // Construct full URL if we have cdnDomain
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
            // Only use first CDN with valid paths
            if (options.length > 0) break;
        }
    }

    // Sort by quality (prefer highest quality as default)
    return options.sort((a, b) => b.quality - a.quality);
}

/**
 * Fetch with error handling
 */
async function fetchApi<T>(endpoint: string, provider: 'primary' | 'secondary' = 'primary'): Promise<T> {
    const url = `${API_BASE}/${endpoint}${endpoint.includes('?') ? '&' : '?'}provider=${provider}`;

    const response = await fetch(url);

    if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    return data;
}

// ============= PUBLIC API FUNCTIONS =============

/**
 * Get drama details by ID
 */
export async function getDramaDetail(bookId: string): Promise<Drama> {
    const data = await fetchApi<DramaDetailResponse>(`detail?bookId=${bookId}`);
    return normalizeDrama(data);
}

/**
 * Get all episodes for a drama
 */
export async function getAllEpisodes(bookId: string): Promise<Array<Omit<Episode, 'videoUrl' | 'qualityOptions'>>> {
    const data = await fetchApi<EpisodeResponse[]>(`allepisode?bookId=${bookId}`);

    if (!Array.isArray(data)) {
        return [];
    }

    return data.map((ep, idx) => normalizeEpisode(ep, idx));
}

/**
 * Get video stream URL for an episode
 * Videos are embedded in allepisode response
 */
export async function getStreamUrl(bookId: string, episodeNum: number): Promise<QualityOption[]> {
    const data = await fetchApi<EpisodeResponse[]>(`allepisode?bookId=${bookId}`);

    if (!Array.isArray(data) || data.length === 0) {
        return [];
    }

    // Find episode by index (1-indexed from user, 0-indexed in data)
    const episodeIndex = Math.max(0, episodeNum - 1);
    const episode = data[episodeIndex] || data[0];

    // Extract video URLs from episode's cdnList
    return extractVideoUrls(episode);
}

/**
 * Get trending dramas
 */
export async function getTrending(): Promise<Drama[]> {
    const data = await fetchApi<DramaDetailResponse[]>('trending');

    if (!Array.isArray(data)) return [];
    return data.map(normalizeDrama);
}

/**
 * Get popular dramas
 */
export async function getPopular(): Promise<Drama[]> {
    const data = await fetchApi<DramaDetailResponse[]>('populersearch');

    if (!Array.isArray(data)) return [];
    return data.map(normalizeDrama);
}

/**
 * Get latest dramas
 */
export async function getLatest(): Promise<Drama[]> {
    const data = await fetchApi<DramaDetailResponse[]>('latest');

    if (!Array.isArray(data)) return [];
    return data.map(normalizeDrama);
}

/**
 * Get personalized recommendations
 */
export async function getForYou(): Promise<Drama[]> {
    const data = await fetchApi<DramaDetailResponse[]>('foryou');

    if (!Array.isArray(data)) return [];
    return data.map(normalizeDrama);
}

/**
 * Get VIP content with pagination
 * VIP response is wrapped in {columnVoList: [{bookInfoList: [...]}]}
 */
export async function getVip(page = 1): Promise<Drama[]> {
    interface VipResponse {
        columnVoList?: Array<{
            bookInfoList?: DramaDetailResponse[];
        }>;
    }

    const response = await fetchApi<VipResponse | DramaDetailResponse[]>(`vip?page=${page}`);

    // Handle wrapped response
    if (response && typeof response === 'object' && 'columnVoList' in response) {
        const vipData = response as VipResponse;
        const allDramas: Drama[] = [];
        vipData.columnVoList?.forEach(column => {
            column.bookInfoList?.forEach(drama => {
                allDramas.push(normalizeDrama(drama));
            });
        });
        return allDramas;
    }

    // Direct array response
    if (Array.isArray(response)) {
        return response.map(normalizeDrama);
    }

    return [];
}

/**
 * Get Indonesian dubbed content
 */
export async function getDubIndo(classify = 'all', page = 1): Promise<Drama[]> {
    const data = await fetchApi<DramaDetailResponse[]>(`dubindo?classify=${classify}&page=${page}`);

    if (!Array.isArray(data)) return [];
    return data.map(normalizeDrama);
}

/**
 * Search dramas
 */
export async function searchDramas(query: string): Promise<Drama[]> {
    const data = await fetchApi<DramaDetailResponse[]>(`search?query=${encodeURIComponent(query)}`);

    if (!Array.isArray(data)) return [];
    return data.map(normalizeDrama);
}

/**
 * Get dramas by category type
 */
export async function getDramasByCategory(type: CategoryType, page = 1): Promise<Drama[]> {
    switch (type) {
        case 'trending':
            return getTrending();
        case 'foryou':
            return getForYou();
        case 'latest':
            return getLatest();
        case 'vip':
            return getVip(page);
        case 'dubindo':
            return getDubIndo('all', page);
        case 'populersearch':
            return getPopular();
        default:
            return getTrending();
    }
}
