"""
Shared helpers for the data-prep scripts (transform_kaggle.py,
transform_recommenders.py). Not part of the app's runtime.
"""
import re
import unicodedata

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
    'biography & autobiography': 'Biography',
    'autobiography': 'Biography',
    'memoir': 'Memoir',
    'history': 'History',
    'war': 'History',
    'philosophy': 'Philosophy',
    'psychology': 'Nonfiction',
    'self help': 'Self-Help',
    'self-help': 'Self-Help',
    'short stories': 'Short Stories',
    'adventure': 'Fiction',
    'poetry': 'Poetry',
    'business': 'Business',
    'business & economics': 'Business',
    'science': 'Science',
    'travel': 'Travel Writing',
    'politics': 'Politics',
    'political science': 'Politics',
    'religion': 'Philosophy',
    'social science': 'Nonfiction',
    'computers': 'Science',
    'body, mind & spirit': 'Self-Help',
    'juvenile fiction': 'Young Adult',
    'family & relationships': 'Self-Help',
    'health & fitness': 'Self-Help',
    'mathematics': 'Science',
    'medical': 'Science',
    'literary collections': 'Literary Fiction',
    'education': 'Nonfiction',
    'language arts & disciplines': 'Nonfiction',
    'literary criticism': 'Literary Fiction',
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
            if place and len(place.split()) <= 3 and place.lower() not in PLACE_STOPWORDS:
                for chunk in place.split(','):
                    chunk = chunk.strip().lower()
                    if chunk and len(chunk.split()) <= 3:
                        tags.add(chunk)
        else:
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


def norm_loose(title: str, author: str) -> str:
    """Looser title/author key for cross-dataset joins: drops subtitles
    after ':' or '(', and only uses the first author on a multi-author
    credit line — trades a little precision for much better recall."""
    t = title.lower()
    t = re.split(r'[:(]', t)[0]
    t = re.sub(r'[^a-z0-9]+', '', t)
    a = author.lower()
    a = re.split(r',|&| and ', a)[0]
    a = re.sub(r'[^a-z0-9]+', '', a)
    return f'{t}|{a}'
