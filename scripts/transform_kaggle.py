"""
One-off data prep: turns the user-supplied Kaggle "GoodReads Best Books"
export (books_slim.json — already filtered to English, numRatings>=500,
rating>=3.4, deduped by title+author) into public/data/travel-catalog.json,
matching the app's Book shape.

Not part of the app's runtime — run manually when refreshing the catalog:
    python3 scripts/transform_kaggle.py <path-to-books_slim.json>
"""
import json
import re
import sys
import unicodedata
from collections import Counter

GENRE_MAP = {
    'fiction': 'Fiction',
    'fantasy': 'Sci-Fi/Fantasy',
    'science fiction': 'Sci-Fi/Fantasy',
    'science fiction fantasy': 'Sci-Fi/Fantasy',
    'paranormal': 'Sci-Fi/Fantasy',
    'urban fantasy': 'Sci-Fi/Fantasy',
    'high fantasy': 'Sci-Fi/Fantasy',
    'epic fantasy': 'Sci-Fi/Fantasy',
    'supernatural': 'Sci-Fi/Fantasy',
    'magic': 'Sci-Fi/Fantasy',
    'dystopia': 'Sci-Fi/Fantasy',
    'vampires': 'Sci-Fi/Fantasy',
    'romance': 'Romance',
    'chick lit': 'Romance',
    'contemporary romance': 'Romance',
    'paranormal romance': 'Romance',
    'young adult': 'Young Adult',
    'teen': 'Young Adult',
    'juvenile': 'Young Adult',
    'middle grade': 'Young Adult',
    'childrens': 'Young Adult',
    'new adult': 'Young Adult',
    'school': 'Young Adult',
    'young adult fantasy': 'Young Adult',
    'classics': 'Classic',
    'british literature': 'Classic',
    'mystery': 'Mystery/Thriller',
    'thriller': 'Mystery/Thriller',
    'mystery thriller': 'Mystery/Thriller',
    'crime': 'Mystery/Thriller',
    'suspense': 'Mystery/Thriller',
    'historical fiction': 'Historical Fiction',
    'historical': 'Historical Fiction',
    'literature': 'Literary Fiction',
    'literary fiction': 'Literary Fiction',
    'realistic fiction': 'Literary Fiction',
    'drama': 'Literary Fiction',
    'nonfiction': 'Nonfiction',
    'horror': 'Horror',
    'biography': 'Biography',
    'biography memoir': 'Biography',
    'autobiography': 'Biography',
    'memoir': 'Memoir',
    'history': 'History',
    'war': 'History',
    'philosophy': 'Philosophy',
    'psychology': 'Nonfiction',
    'self help': 'Self-Help',
    'short stories': 'Short Stories',
    'adventure': 'Fiction',
    'poetry': 'Poetry',
    'business': 'Business',
    'science': 'Science',
    'travel': 'Travel Writing',
    'politics': 'Politics',
}

PALETTES = [
    ('#8C3A1E', '#D9B463'), ('#B4502A', '#5B6B4F'), ('#B68A2E', '#211C15'),
    ('#3F4A37', '#F4EEE2'), ('#5B6B4F', '#D97B4F'), ('#211C15', '#B4502A'),
    ('#B68A2E', '#3F4A37'), ('#D9B463', '#211C15'), ('#8A7F6A', '#4A4234'),
    ('#B4502A', '#B68A2E'), ('#3F4A37', '#8C3A1E'), ('#5B6B4F', '#211C15'),
]

YEAR_RE = re.compile(r'(1[5-9]\d{2}|20[0-2]\d)')
MMDDYY_RE = re.compile(r'^\d{1,2}/\d{1,2}/(\d{2})$')


def slugify(text: str) -> str:
    text = unicodedata.normalize('NFKD', text).encode('ascii', 'ignore').decode()
    text = re.sub(r'[^a-zA-Z0-9]+', '-', text).strip('-').lower()
    return text[:60]


def clean_author(raw: str) -> str:
    # Strip role annotations like "(Illustrator)" / "(Goodreads Author)" from
    # each comma-separated name, and keep only the primary author.
    parts = [re.sub(r'\s*\([^)]*\)\s*', '', p).strip() for p in raw.split(',')]
    parts = [p for p in parts if p]
    return parts[0] if parts else raw.strip()


def parse_year(raw: str):
    if not raw:
        return None
    m = YEAR_RE.search(raw)
    if m:
        return int(m.group(1))
    m2 = MMDDYY_RE.match(raw.strip())
    if m2:
        yy = int(m2.group(1))
        return 2000 + yy if yy <= 26 else 1900 + yy
    return None


def valid_isbn(raw: str):
    s = re.sub(r'[^0-9Xx]', '', str(raw or ''))
    if len(s) not in (10, 13):
        return None
    if len(set(s)) <= 1:  # placeholder like 9999999999999
        return None
    return s


def map_genres(raw_genres):
    mapped = []
    for g in raw_genres:
        key = g.strip().lower()
        if key in GENRE_MAP and GENRE_MAP[key] not in mapped:
            mapped.append(GENRE_MAP[key])
    return mapped[:4] if mapped else ['Fiction']


PLACE_STOPWORDS = {'usa', 'united states', 'united states of america', 'earth'}


def extract_location_tags(settings):
    tags = set()
    for raw in settings:
        s = raw.strip()
        if not s:
            continue
        m = re.match(r'^(.*?)\s*\(([^)]+)\)\s*$', s)
        if m:
            place, country = m.group(1).strip(), m.group(2).strip()
            country_l = country.lower()
            if country_l not in PLACE_STOPWORDS:
                tags.add(country_l)
            # only keep the specific place if it reads like a real, short
            # geographic name (city/state), not a fictional venue
            if place and len(place.split()) <= 3 and place.lower() not in PLACE_STOPWORDS:
                # split "City, State" into both parts
                for chunk in place.split(','):
                    chunk = chunk.strip().lower()
                    if chunk and len(chunk.split()) <= 3:
                        tags.add(chunk)
        else:
            # No trailing "(Country)" — split "City, State, Country"-style
            # fragments into atomic place names instead of keeping them as
            # one multi-word blob (which caused false substring matches,
            # e.g. "York, Yorkshire, England" matching a "New York" search).
            for chunk in s.split(','):
                chunk_l = chunk.strip().lower()
                if chunk_l and chunk_l not in PLACE_STOPWORDS and len(chunk_l.split()) <= 3:
                    tags.add(chunk_l)
    return sorted(tags)


def format_ratings_label(n: int) -> str:
    if n >= 1_000_000:
        return f'{n / 1_000_000:.1f}M ratings'
    if n >= 1_000:
        return f'{round(n / 1000)}K ratings'
    return f'{n} ratings'


def clean_summary(desc: str) -> str:
    desc = (desc or '').strip()
    if not desc:
        return ''
    if len(desc) >= 290:
        cut = desc.rfind(' ', 0, 280)
        desc = (desc[:cut] if cut > 0 else desc[:280]).rstrip('.,;: ') + '…'
    return desc


def main():
    src = sys.argv[1] if len(sys.argv) > 1 else 'books_slim.json'
    with open(src, encoding='utf-8') as f:
        rows = json.load(f)

    out = []
    seen_ids = set()
    dropped_no_summary = 0
    heuristic_flagged = []

    for row in rows:
        title = (row.get('title') or '').strip()
        author_raw = (row.get('author') or '').strip()
        if not title or not author_raw:
            continue
        author = clean_author(author_raw)

        summary = clean_summary(row.get('description', ''))
        if not summary:
            dropped_no_summary += 1
            continue

        base_id = slugify(f'{title}-{author}')
        book_id = base_id
        i = 2
        while book_id in seen_ids:
            book_id = f'{base_id}-{i}'
            i += 1
        seen_ids.add(book_id)

        location_tags = extract_location_tags(row.get('setting') or [])
        if not location_tags:
            # This catalog only feeds "Literary Travels" — a book with no
            # real-world setting can never match a location query, so
            # keeping it would only bloat the fetched file for no benefit.
            continue

        isbn = valid_isbn(row.get('isbn'))
        year = parse_year(str(row.get('publishDate') or ''))
        genres = map_genres(row.get('genres') or [])
        num_ratings = int(row.get('numRatings') or 0)
        palette = list(PALETTES[hash(book_id) % len(PALETTES)])

        entry = {
            'id': book_id,
            'title': title,
            'author': author,
            'year': year,
            'genres': genres,
            'goodreadsRating': round(float(row['rating']), 2),
            'ratingsLabel': format_ratings_label(num_ratings),
            'summary': summary,
            'palette': palette,
            'locationTags': location_tags,
        }
        if isbn:
            entry['isbn'] = isbn
        out.append(entry)

    with open('public/data/travel-catalog.json', 'w', encoding='utf-8') as f:
        json.dump(out, f, ensure_ascii=False, separators=(',', ':'))

    with_isbn = sum(1 for b in out if b.get('isbn'))
    genre_counts = Counter(g for b in out for g in b['genres'])

    print(f'wrote {len(out)} books (dropped {dropped_no_summary} with no summary)')
    print(f'with isbn: {with_isbn}')
    print('genre distribution:', dict(genre_counts.most_common()))


if __name__ == '__main__':
    main()
