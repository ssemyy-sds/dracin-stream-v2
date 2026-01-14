# TODO: Remove Primary API and Migrate to Secondary API

The primary API (`api.sansekai.my.id`) is down. We need to completely remove it and shift all functionality to the secondary API (`kdjekek-usieke-owjejxkek-iwjwjxkod.vercel.app`).

## 1. Update Proxy Configurations

### 1.1 Update `api/index.js` (Vercel Serverless Function)
- Remove the `if (provider === 'secondary')` check.
- Set `targetUrl` to always use the secondary base URL: `https://kdjekek-usieke-owjejxkek-iwjwjxkod.vercel.app/api`.
- Ensure `path` and `queryParams` are correctly appended.

### 1.2 Update `src/routes/api/[...path]/+server.ts` (SvelteKit API Route)
- Similar to `api/index.js`, remove the provider logic.
- Always point to `https://kdjekek-usieke-owjejxkek-iwjwjxkod.vercel.app/api`.
- Clean up the `API_URLS` constant and remove the `primary` entry.

## 2. Refactor `src/lib/services/api.ts`

### 2.1 Update `normalizeDrama`
- Update the normalization logic based on `home-response.json` (Secondary API):
    - `bookId`: `data.id` (Secondary) or `data.bookId`
    - `bookName`: `data.name` (Secondary) or `data.bookName`
    - `cover`: `fixUrl(data.cover || data.coverWap || '')`
    - `introduction`: `data.introduction` or `data.description`
    - `genres`: Handle `data.tags` which is an array of objects `{ tagName: "..." }`, map to a string array.
    - `viewCount`: `data.playCount` (e.g., "2.8M"). Use parsing: `2.8 * 1000000`.
    - `cornerLabel`: `data.cornerName`.

### 2.2 Rewrite Public API Functions
- **`getDramaDetail(bookId)`**: 
    - The `download/${bookId}` endpoint (from `download-all-response.json`) returns an episode list in `data` and book info in `info`.
    - *Metadata Mapping*: Since `download/${bookId}` might only have the `bookId` in `info`, the metadata should be retrieved from a `home` or `search` result if possible, or mapped from `info` if available.
    - *Mapping*: `id` -> `bookId`, `name` -> `bookName`, `cover` -> `cover`, `introduction` -> `introduction`.

- **`getAllEpisodes(bookId)`**: 
    - Call `download/${bookId}`.
    - According to `download-all-response.json`, episodes are in the `data` array.
    - Each episode has `chapterId`, `chapterIndex`, `chapterName`, and `videoPath`.
    - Map `chapterName` (e.g., "EP 1") and `chapterIndex`.

- **`getStreamUrl(bookId, episodeNum)`**: 
    - Call `download/${bookId}` (or use cached data from the same call).
    - Find the episode in the `data` array where `chapterIndex === episodeNum - 1` (or match by index).
    - Use `videoPath` as the `videoUrl`.

- **`getTrending`, `getPopular`, `getLatest`, `getForYou`**: Map these to calling either `home` or `recommend` endpoints from the secondary API.
- **`getVip(page)`**: Call the `vip` endpoint from the secondary API.
- **`searchDramas(query)`**: Call the `search` endpoint with `keyword` parameter instead of `query`.

### 2.3 Import missing functions from `api-secondary.ts`
- Move `getHome`, `getRecommend`, `getCategories`, and `getCategory` into `api.ts`.
- Ensure they use the updated `normalizeDrama`.

## 3. Migration and Cleanup

### 3.1 Update Imports
- Find all files importing from `$lib/services/api-secondary` and change them to import from `$lib/services/api`.
- Specifically, update `src/routes/+page.svelte`.

### 3.2 Remove `api-secondary.ts`
- Once all logic is moved and imports are updated, delete `src/lib/services/api-secondary.ts`.

### 3.3 Verify Layout and Types
- Ensure the `Drama` and `Episode` types are still respected.
- Check that the `watch` and `detail` pages still function correctly with the new data source.
