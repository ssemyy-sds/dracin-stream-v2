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
- Update the normalization logic to match the response from the secondary API:
    - `bookId` can be `bookId`, `bookid`, or `id`.
    - `bookName` can be `bookName`, `bookname`, or `name`.
    - `cover` should use `fixUrl(data.coverWap || data.cover || '')`.
    - `genres` should handle `tags` (string array) or `tagNameList`.
    - `viewCount` should handle the string format (e.g., "1.2M") using the parsing logic from `api-secondary.ts`.

### 2.2 Rewrite Public API Functions
- **`getDramaDetail(bookId)`**: Call `chapters/${bookId}` and return normalized data.
- **`getAllEpisodes(bookId)`**: Call `chapters/${bookId}` and extract the chapter list.
- **`getStreamUrl(bookId, episodeNum)`**: Call `chapters/${bookId}`, find the episode by index, and extract `videoPath`.
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
