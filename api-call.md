# Secondary API Call Analysis

## Configuration
- **External Base URL:** `https://api.gimita.id/api/search/dramabox` 
#>> use new base URL : https://kdjekek-usieke-owjejxkek-iwjwjxkod.vercel.app/

- **Internal Proxy Handler:** `src/routes/api/[...path]/+server.ts` 
- **Primary Service:** `src/lib/services/api-secondary.ts`

## Proxy Logic
Requests to the internal proxy are mapped as follows:
- **Internal:** `/api/{action}?provider=secondary&param=value`
- **External:** `https://api.gimita.id/api/search/dramabox?action={action}&param=value`
#>> use new external URL : 'https://kdjekek-usieke-owjejxkek-iwjwjxkod.vercel.app/api/home'

*Note: The proxy extracts `{action}` from the URL path.*

## Identified Calls

### 1. Home (Featured)
- **Service Function:** `getHome(page, size)`
- **Internal:** `/api/home?provider=secondary&page={page}&size={size}`
- **External:** `https://api.gimita.id/api/search/dramabox?action=home&page={page}&size={size}`
#>> use new external URL : 'https://kdjekek-usieke-owjejxkek-iwjwjxkod.vercel.app/api/home'

### 2. Recommend
- **Service Function:** `getRecommend(page, size)`
- **Internal:** `/api/recommend?provider=secondary&page={page}&size={size}`
- **External:** `https://api.gimita.id/api/search/dramabox?action=recommend&page={page}&size={size}`
#>> use new external URL : 'https://kdjekek-usieke-owjejxkek-iwjwjxkod.vercel.app/api/recommend'

### 3. VIP Content
- **Service Function:** `getVip(page, size)`
- **Internal:** `/api/vip?provider=secondary&page={page}&size={size}`
- **External:** `https://api.gimita.id/api/search/dramabox?action=vip&page={page}&size={size}`
- *Note: `src/lib/services/api.ts` also has a fallback calling `/api?action=vip...` which may fail to route correctly locally.*
#>> use new external URL : 'https://kdjekek-usieke-owjejxkek-iwjwjxkod.vercel.app/api/vip'
#>> search until found below parameter 
#			  "bookId": "41000119254",
#              "bookName": "Ciumanmu Mengubah Duniaku",
#              "coverWap": "https://hwztchapter.dramaboxdb.com/data/cppartner/4x1/41x0/410x0/41000119254/41000119254.jpg?t=1766740652241",
#              "chapterCount": 53,
#              "introduction": "Sakit hati karena dikhianati oleh pacar dan sahabatnya sendiri, Gabrielle, seorang model, mengacaukan pesta pertunangan mereka. Takdir mempertemukan Gabrielle dengan Kyle, seorang CEO tampan, dan keduanya jatuh cinta, yang memicu serangkai kejadian yang mengubah dunia mereka berdua. ",
#              "tags": [
#                "Takdir Cinta",
#                "Romansa Kantor",
#                "CEO",
#                "Wanita Karier",
#                "Modern",
#                "Romansa"


### 4. Categories
- **Service Function:** `getCategories()`
- **Internal:** `/api/categories?provider=secondary`
- **External:** `https://api.gimita.id/api/search/dramabox?action=categories`
#>> use new external URL : 'https://kdjekek-usieke-owjejxkek-iwjwjxkod.vercel.app/api/categories'

### 5. Category Detail
- **Service Function:** `getCategory(categoryId, page, size)`
- **Internal:** `/api/category?provider=secondary&categoryId={id}&page={page}&size={size}`
- **External:** `https://api.gimita.id/api/search/dramabox?action=category&categoryId={id}&page={page}&size={size}`
#>> use new external URL : 'https://kdjekek-usieke-owjejxkek-iwjwjxkod.vercel.app/api/categories'

### 6. Search
- **Service Function:** `search(query, page, size)`
- **Internal:** `/api/search?provider=secondary&query={query}&page={page}&size={size}`
- **External:** `https://api.gimita.id/api/search/dramabox?action=search&query={query}&page={page}&size={size}`
#>> use new external URL : 'https://kdjekek-usieke-owjejxkek-iwjwjxkod.vercel.app/api/search?keyword={query}&page={page}'

### 7. Drama Detail
- **Service Function:** `getDetail(bookId)`
- **Internal:** `/api/detail?provider=secondary&bookId={bookId}`
- **External:** `https://api.gimita.id/api/search/dramabox?action=detail&bookId={bookId}`
#>> use new external URL : 'https://kdjekek-usieke-owjejxkek-iwjwjxkod.vercel.app/api/chapters/{bookId}'

### 8. Chapters/Episodes
- **Service Function:** `getChapters(bookId)`
- **Internal:** `/api/chapters?provider=secondary&bookId={bookId}`
- **External:** `https://api.gimita.id/api/search/dramabox?action=chapters&bookId={bookId}`
#>> use new external URL : 'https://kdjekek-usieke-owjejxkek-iwjwjxkod.vercel.app/api/chapters/{bookId}'

### 9. Stream URL
- **Service Function:** `getStream(bookId, chapterId)`
- **Internal:** `/api/stream?provider=secondary&bookId={bookId}&chapterId={chapterId}`
- **External:** `https://api.gimita.id/api/search/dramabox?action=stream&bookId={bookId}&chapterId={chapterId}`
#>> use new external URL : 'https://kdjekek-usieke-owjejxkek-iwjwjxkod.vercel.app/api/chapters/{bookId}'
# search until get parameter videoPath": "https://hwztvideo.dramaboxdb.com/..............."
