"""
Turns the user-supplied books_clean.csv (title/author/recommender(s) from an
aggregated public interview & reading-list dataset) into
public/data/recommender-catalog.json, joined against a real ratings source
(the same books_slim.json shape used by transform_kaggle.py) since the CSV
itself carries no rating.

The CSV's `recommender` column has no per-book citation of *where* someone
recommended a title — just the name. Rather than inventing a specific venue
for every attribution, `context` is deliberately kept generic and honest.
`role` (what the person is known for) is filled in only for names we can
confidently and factually describe; unmapped names fall back to a neutral
"Public figure" rather than a guessed specialty.

Not part of the app's runtime — run manually:
    python3 scripts/transform_recommenders.py <books_clean.csv> <books_slim.json>
"""
import csv
import json
import sys
from collections import Counter, defaultdict

from _shared import (
    clean_summary, format_ratings_label, map_genres, norm_loose, parse_year,
    slugify, valid_isbn, PALETTES,
)

MIN_RATING = 3.4
GENERIC_CONTEXT = "Cited in public interviews, podcasts, or reading lists"

# Factual "known for" tags for the most frequently-appearing recommenders.
# Deliberately terse and uncontroversial (their public role), not a claim
# about which specific book they recommended where.
ROLE_MAP = {
    'Bill Gates': 'Co-founder, Microsoft',
    'Naval Ravikant': 'Entrepreneur, AngelList co-founder',
    'Paul Graham': 'Co-founder, Y Combinator',
    'Ev Williams': 'Co-founder, Twitter and Medium',
    'Tim Ferriss': 'Author, "The 4-Hour Workweek"',
    'Jordan Peterson': 'Psychologist, author',
    'Patrick Collison': 'Co-founder, Stripe',
    'Jocko Willink': 'Retired Navy SEAL, author',
    'Eric Weinstein': 'Mathematician, economist',
    'Stewart Brand': 'Founder, Whole Earth Catalog',
    'Oprah Winfrey': 'Media executive, Oprah’s Book Club',
    'Richard Branson': 'Founder, Virgin Group',
    'Emma Watson': 'Actor, activist',
    'Keith Rabois': 'Investor, entrepreneur',
    'Elon Musk': 'CEO, Tesla/SpaceX',
    'Ryan Holiday': 'Author, "The Daily Stoic"',
    'Marc Andreessen': 'Co-founder, Andreessen Horowitz',
    'Warren Buffett': 'CEO, Berkshire Hathaway',
    'Aubrey Marcus': 'Founder, Onnit',
    'Vinod Khosla': 'Founder, Khosla Ventures',
    'Ray Dalio': 'Founder, Bridgewater Associates',
    'Mark Zuckerberg': 'CEO, Meta',
    'Ben Shapiro': 'Political commentator',
    'Brian Armstrong': 'CEO, Coinbase',
    'Joe Rogan': 'Host, The Joe Rogan Experience',
    'Tim O’Reilly': 'Founder, O’Reilly Media',
    'Malcolm Gladwell': 'Author, journalist',
    'Charlie Munger': 'Vice Chairman, Berkshire Hathaway',
    'Barack Obama': '44th U.S. President',
    'Matt Mullenweg': 'Co-founder, WordPress',
    'Steve Jobs': 'Co-founder, Apple',
    'Dave Ramsey': 'Personal finance author, radio host',
    'Seth Godin': 'Author, entrepreneur',
    'Gretchen Rubin': 'Author, "The Happiness Project"',
    'J.K. Rowling': 'Author, Harry Potter series',
    'Daniel Pink': 'Author, "Drive"',
    'Neil Gaiman': 'Author',
    'Caterina Fake': 'Co-founder, Flickr',
    'Dustin Moskovitz': 'Co-founder, Facebook/Asana',
    'Peter Attia': 'Physician, longevity researcher',
    'Bryan Johnson': 'Entrepreneur, founder Kernel',
    'Derek Sivers': 'Founder, CD Baby',
    'Sam Harris': 'Neuroscientist, author',
    'Taylor Swift': 'Musician',
    'Jack Dorsey': 'Co-founder, Twitter/Square',
    'Barack  Obama': '44th U.S. President',
    'Lisa Ling': 'Journalist',
    'Jason Calacanis': 'Angel investor, podcaster',
    'Chelsea Handler': 'Comedian, author',
    'Ta-Nehisi Coates': 'Author, journalist',
    'Krista Tippett': 'Host, On Being',
    'Daymond John': 'Founder, FUBU; Shark Tank investor',
    'Neil deGrasse Tyson': 'Astrophysicist',
    'Tristan Harris': 'Co-founder, Center for Humane Technology',
    'Jesse Williams': 'Actor, activist',
    'Bill Nye': 'Science educator',
    'Jeff Bezos': 'Founder, Amazon',
    'Larry Ellison': 'Co-founder, Oracle',
    'Larry Page': 'Co-founder, Google',
    'Peter Thiel': 'Co-founder, PayPal',
    'Tony Robbins': 'Author, motivational speaker',
    'Walter Isaacson': 'Biographer',
    'Kara Swisher': 'Journalist, podcaster',
    'Reid Hoffman': 'Co-founder, LinkedIn',
    'Edward Norton': 'Actor',
    'Rick Rubin': 'Music producer',
    'Ashton Kutcher': 'Actor, investor',
    'James Cameron': 'Filmmaker',
    'Brené Brown': 'Researcher, author',
    'LeBron James': 'Professional basketball player',
    'Doris Kearns Goodwin': 'Presidential historian',
    'Arnold Schwarzenegger': 'Actor, former California governor',
    'Yuval Noah Harari': 'Historian, author of "Sapiens"',
    'Steven Pinker': 'Cognitive scientist, author',
    'Will Smith': 'Actor',
    'Arianna Huffington': 'Founder, The Huffington Post',
    'Susan Cain': 'Author, "Quiet"',
    'Gary Vaynerchuk': 'Entrepreneur, media personality',
    'Brian Chesky': 'Co-founder, Airbnb',
    'Michael Pollan': 'Journalist, food/nutrition author',
    'Mark Cuban': 'Entrepreneur, Shark Tank investor',
    'Sebastian Junger': 'Journalist, author',
    'Peter Diamandis': 'Founder, X Prize Foundation',
    'Ezra Klein': 'Journalist, podcaster',
    'Lex Fridman': 'Host, Lex Fridman Podcast',
    'Noah Kagan': 'Founder, AppSumo',
    'Ben Horowitz': 'Co-founder, Andreessen Horowitz',
    'Kevin Systrom': 'Co-founder, Instagram',
    'Terry Crews': 'Actor',
    'Howard Schultz': 'Former CEO, Starbucks',
    'Jimmy Fallon': 'Host, The Tonight Show',
    'Ashton  Kutcher': 'Actor, investor',
    'James Altucher': 'Author, podcaster',
    'Cory Booker': 'U.S. Senator',
    'Ramit Sethi': 'Author, "I Will Teach You to Be Rich"',
    'Alain de Botton': 'Philosopher, author',
    'Mark Bittman': 'Food writer',
    'Chris Sacca': 'Investor',
    'Steven Pressfield': 'Author, "The War of Art"',
    'Jim Collins': 'Author, "Good to Great"',
    'Casey Neistat': 'Filmmaker, YouTuber',
    'Susan  Cain': 'Author, "Quiet"',
    'Alexis Ohanian': 'Co-founder, Reddit',
    'Whitney Wolfe Herd': 'Founder, Bumble',
    'Ayaan Hirsi Ali': 'Author, activist',
    'David Allen': 'Author, "Getting Things Done"',
    'Tim Urban': 'Writer, Wait But Why',
    'Sophia Amoruso': 'Founder, Nasty Gal',
    'Seth Rogen': 'Actor, filmmaker',
    'Vince Vaughn': 'Actor',
    'Joseph Gordon-Levitt': 'Actor',
    'Ben Stiller': 'Actor, filmmaker',
    'Stanley McChrystal': 'Retired U.S. Army general',
    'Wim Hof': 'Extreme athlete, "The Iceman"',
    'David Lynch': 'Filmmaker',
    'Craig Newmark': 'Founder, Craigslist',
    'Alex Honnold': 'Rock climber',
    'Kevin Rose': 'Entrepreneur, founder Digg',
    'A.J. Jacobs': 'Author, journalist',
    'Michael Gervais': 'Sport psychologist',
    'Karlie Kloss': 'Model, entrepreneur',
    'Evan Spiegel': 'Co-founder, Snap Inc.',
    'Ron Conway': 'Angel investor',
    'Howard Marks': 'Co-founder, Oaktree Capital',
    'Jason Fried': 'Co-founder, Basecamp',
    'Stephen Dubner': 'Co-author, "Freakonomics"',
    'Lisa Randall': 'Theoretical physicist',
    'Arianna  Huffington': 'Founder, The Huffington Post',
    'Chip Conley': 'Hospitality entrepreneur, author',
    'Nick Szabo': 'Computer scientist, cryptocurrency pioneer',
    'Rolf Potts': 'Travel writer',
    'David Blaine': 'Illusionist, endurance artist',
    'Jason Silva': 'Media personality, filmmaker',
    'Cal Fussman': 'Journalist, author',
    'David Heinemeier Hansson': 'Co-founder, Basecamp; creator of Ruby on Rails',
    'Peter Diamandis ': 'Founder, X Prize Foundation',
    'Ezra  Klein': 'Journalist, podcaster',
    'Laird Hamilton': 'Big-wave surfer',
    'Ben Horowitz ': 'Co-founder, Andreessen Horowitz',
    'Brandon Stanton': 'Creator, Humans of New York',
    'Ken Block': 'Rally driver, entrepreneur',
    'Terry  Crews': 'Actor',
    'Evan Goldberg': 'Co-founder, NetSuite',
    'Michael McCullough': 'Psychologist, author',
    'Reid  Hoffman': 'Co-founder, LinkedIn',
    'Stanislav Grof': 'Psychiatrist, psychedelic researcher',
    'Kelly Slater': 'Professional surfer',
    'Sarah Lewis': 'Art historian, author',
    'Craig  Newmark': 'Founder, Craigslist',
    'Bob Metcalfe': 'Co-inventor of Ethernet',
    'Charles Koch': 'CEO, Koch Industries',
    'Jerry Colonna': 'Venture capitalist, executive coach',
    'Alexis  Ohanian': 'Co-founder, Reddit',
    'Jimmy Chin': 'Photographer, filmmaker',
    'Danielle Teller': 'Physician, author',
    'James Fadiman': 'Psychologist, psychedelic researcher',
    'Paul Stamets': 'Mycologist, author',
    'Gary  Vaynerchuk': 'Entrepreneur, media personality',
    'Debbie Millman': 'Designer, podcaster',
    'Greg Norman': 'Professional golfer',
    'Maria Sharapova': 'Professional tennis player',
    'Luis von Ahn': 'Co-founder, Duolingo',
    'Sam Kass': 'Chef, food policy advisor',
    'Marc Goodman': 'Author, security expert',
    'Ryan Hoover': 'Founder, Product Hunt',
    'Fedor Holz': 'Professional poker player',
    'Nick Thompson': 'Journalist, former WIRED editor',
    'Mike Shinoda': 'Musician, Linkin Park',
    'Ezra Klein ': 'Journalist, podcaster',
    'Turia Pitt': 'Athlete, author',
    'Kelly Starrett': 'Physical therapist, author',
    'Jonathan Eisen': 'Evolutionary biologist',
    'Adam Robinson': 'Test-prep entrepreneur, author',
    'Safi Bahcall': 'Physicist, author of "Loonshots"',
    'Joel McHale': 'Actor, comedian',
    'M. Sanjayan': 'Conservation scientist',
    'Amelia Boone': 'Obstacle course racer',
    'Joe De Sena': 'Founder, Spartan Race',
    'Dan Engle': 'Physician',
    'Jack Kornfield': 'Meditation teacher, author',
    'Phil Keoghan': 'TV host, "The Amazing Race"',
    'Howard Schultz ': 'Former CEO, Starbucks',
    'Adam Savage': 'Co-host, MythBusters',
    'Kevin Kelly': 'Co-founder, WIRED magazine',
    'Max Levchin': 'Co-founder, PayPal',
    'Neil Strauss': 'Author, journalist',
    'Larry King': 'Broadcaster',
    'Jacqueline Novogratz': 'Founder, Acumen Fund',
    'Rainn Wilson': 'Actor',
    'Tobi Lütke': 'CEO, Shopify',
    'Amanda Palmer': 'Musician, author',
    'Travis Kalanick': 'Co-founder, Uber',
    'Vlad Tenev': 'Co-founder, Robinhood',
    'Whitney Cummings': 'Comedian, actor',
    'Marc Benioff': 'CEO, Salesforce',
    'Daniel Ek': 'Co-founder, Spotify',
    'Esther Perel': 'Psychotherapist, author',
    'Maria Popova': 'Founder, The Marginalian (Brain Pickings)',
    'Drew Houston': 'Co-founder, Dropbox',
    'Scott Adams': 'Creator, Dilbert',
    'Alan Kay': 'Computer scientist, Xerox PARC',
    'Soman Chainani': 'Author, "The School for Good and Evil"',
    'Lewis Cantley': 'Cancer researcher',
    'Bryan Callen': 'Comedian, actor',
    'Brian Koppelman': 'Screenwriter, podcaster',
    'Josh Waitzkin': 'Author, "The Art of Learning"',
    'Steve Jurvetson': 'Venture capitalist',
    'Zooko Wilcox': 'Founder, Zcash',
    'Mike Rowe': 'Host, "Dirty Jobs"',
    'George Raveling': 'Basketball coach',
    'Cheryl Strayed': 'Author, "Wild"',
    'Scott Belsky': 'Founder, Behance',
    'Darren Aronofsky': 'Filmmaker',
    'Shaun White': 'Professional snowboarder',
    'Eric Ripert': 'Chef',
    'Ed Cooke': 'Grandmaster of Memory, co-founder Memrise',
    'Steve Aoki': 'DJ, musician',
    'Caroline Paul': 'Author',
    'Dr. Gabor Maté': 'Physician, author',
    'Mr. Money Mustache': 'Personal finance blogger',
    'Gabby Reece': 'Professional volleyball player',
}


def build_recommendation(name: str) -> dict:
    role = ROLE_MAP.get(name) or ROLE_MAP.get(name.strip()) or 'Public figure'
    return {'name': name, 'role': role, 'context': GENERIC_CONTEXT}


def main():
    csv_path = sys.argv[1] if len(sys.argv) > 1 else 'books_clean.csv'
    ratings_path = sys.argv[2] if len(sys.argv) > 2 else 'books_slim.json'

    with open(ratings_path, encoding='utf-8') as f:
        ratings_rows = json.load(f)
    rating_lookup = {}
    for b in ratings_rows:
        k = norm_loose(b['title'], b['author'])
        if k not in rating_lookup or (b.get('numRatings') or 0) > (rating_lookup[k].get('numRatings') or 0):
            rating_lookup[k] = b

    with open(csv_path, encoding='utf-8') as f:
        csv_rows = list(csv.DictReader(f))

    # Multiple CSV rows can join to the same rated book (different editions);
    # merge their recommenders together under one entry.
    merged = {}  # rating key -> {csv row (first seen), recommender names set}
    for row in csv_rows:
        title = (row.get('title') or '').strip()
        author = (row.get('author') or '').strip()
        if not title or not author:
            continue
        k = norm_loose(title, author)
        match = rating_lookup.get(k)
        if not match or (match.get('rating') or 0) < MIN_RATING:
            continue
        names = [n.strip() for n in row.get('recommender', '').split('|') if n.strip()]
        if not names:
            continue
        if k not in merged:
            merged[k] = {'csv_row': row, 'match': match, 'names': set()}
        merged[k]['names'].update(names)

    out = []
    seen_ids = set()
    unmapped_names = Counter()

    for k, entry in merged.items():
        match = entry['match']
        csv_row = entry['csv_row']
        title = match['title'].strip()
        author = match['author'].strip()

        summary = clean_summary(match.get('description', ''))
        if not summary:
            continue

        base_id = slugify(f'{title}-{author}')
        book_id = base_id
        i = 2
        while book_id in seen_ids:
            book_id = f'{base_id}-{i}'
            i += 1
        seen_ids.add(book_id)

        isbn = valid_isbn(match.get('isbn'))
        google_id = (csv_row.get('google_id') or '').strip()
        num_ratings = int(match.get('numRatings') or 0)
        palette = list(PALETTES[hash(book_id) % len(PALETTES)])

        # Prefer real Goodreads genre data when we have it; otherwise fall
        # back to the CSV's Google Books category.
        raw_genres = match.get('genres') or ([csv_row['category']] if csv_row.get('category') else [])
        genres = map_genres(raw_genres)

        recommended_by = []
        for name in sorted(entry['names']):
            rec = build_recommendation(name)
            if rec['role'] == 'Public figure':
                unmapped_names[name] += 1
            recommended_by.append(rec)

        book_entry = {
            'id': book_id,
            'title': title,
            'author': author,
            'genres': genres,
            'goodreadsRating': round(float(match['rating']), 2),
            'ratingsLabel': format_ratings_label(num_ratings),
            'summary': summary,
            'palette': palette,
            'recommendedBy': recommended_by,
        }
        year = parse_year(str(match.get('publishDate') or ''))
        if year:
            book_entry['year'] = year
        if isbn:
            book_entry['isbn'] = isbn
        if google_id:
            book_entry['googleId'] = google_id
        out.append(book_entry)

    with open('public/data/recommender-catalog.json', 'w', encoding='utf-8') as f:
        json.dump(out, f, ensure_ascii=False, separators=(',', ':'))

    all_recommenders = set()
    for b in out:
        for r in b['recommendedBy']:
            all_recommenders.add(r['name'])

    print(f'wrote {len(out)} books')
    print(f'unique recommenders: {len(all_recommenders)}')
    print(f'recommenders mapped to a real role: {len(all_recommenders) - len(unmapped_names)}')
    if unmapped_names:
        print(f'unmapped (fell back to "Public figure"): {len(unmapped_names)}')
        for name, n in unmapped_names.most_common(30):
            print(f'  {n:3d}  {name}')


if __name__ == '__main__':
    main()
