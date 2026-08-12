"""
One-off data prep: turns the user-supplied Kaggle "GoodReads Best Books"
export (books_slim.json — already filtered to English, numRatings>=200,
rating>=3.4, deduped by title+author) into public/data/travel-catalog.json,
matching the app's Book shape.

Not part of the app's runtime — run manually when refreshing the catalog:
    python3 scripts/transform_kaggle.py <path-to-books_slim.json>
"""
import json
import sys
from collections import Counter

from _shared import (
    clean_author, clean_summary, extract_location_tags, map_genres,
    parse_year, slugify, valid_isbn, format_ratings_label, PALETTES,
)


def main():
    src = sys.argv[1] if len(sys.argv) > 1 else 'books_slim.json'
    with open(src, encoding='utf-8') as f:
        rows = json.load(f)

    out = []
    seen_ids = set()
    dropped_no_summary = 0

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
