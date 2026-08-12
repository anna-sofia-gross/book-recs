/**
 * Current, UN-recognized sovereign states (plus a handful of widely-used
 * observer/territory names travelers actually search for, e.g. Taiwan,
 * Hong Kong). Lowercase to match the app's location-tag convention.
 *
 * This is the baseline for location autocomplete — always offered
 * regardless of whether any book happens to be tagged to that country yet.
 * Kept separate from the crowd-sourced book location tags (which can
 * legitimately include historical names like "Soviet Union" for a book
 * set during that era) so the suggestion list itself stays current.
 */
export const COUNTRIES: string[] = [
  'afghanistan', 'albania', 'algeria', 'andorra', 'angola',
  'antigua and barbuda', 'argentina', 'armenia', 'australia', 'austria',
  'azerbaijan', 'bahamas', 'bahrain', 'bangladesh', 'barbados', 'belarus',
  'belgium', 'belize', 'benin', 'bhutan', 'bolivia',
  'bosnia and herzegovina', 'botswana', 'brazil', 'brunei', 'bulgaria',
  'burkina faso', 'burundi', 'cambodia', 'cameroon', 'canada',
  'cape verde', 'central african republic', 'chad', 'chile', 'china',
  'colombia', 'comoros', 'costa rica', 'croatia', 'cuba', 'cyprus',
  'czech republic', 'democratic republic of the congo', 'denmark',
  'djibouti', 'dominica', 'dominican republic', 'ecuador', 'egypt',
  'el salvador', 'equatorial guinea', 'eritrea', 'estonia', 'eswatini',
  'ethiopia', 'fiji', 'finland', 'france', 'gabon', 'gambia', 'georgia',
  'germany', 'ghana', 'greece', 'grenada', 'guatemala', 'guinea',
  'guinea-bissau', 'guyana', 'haiti', 'honduras', 'hong kong', 'hungary',
  'iceland', 'india', 'indonesia', 'iran', 'iraq', 'ireland', 'israel',
  'italy', 'ivory coast', 'jamaica', 'japan', 'jordan', 'kazakhstan',
  'kenya', 'kiribati', 'kosovo', 'kuwait', 'kyrgyzstan', 'laos', 'latvia',
  'lebanon', 'lesotho', 'liberia', 'libya', 'liechtenstein', 'lithuania',
  'luxembourg', 'macau', 'madagascar', 'malawi', 'malaysia', 'maldives',
  'mali', 'malta', 'marshall islands', 'mauritania', 'mauritius', 'mexico',
  'micronesia', 'moldova', 'monaco', 'mongolia', 'montenegro', 'morocco',
  'mozambique', 'myanmar', 'namibia', 'nauru', 'nepal', 'netherlands',
  'new zealand', 'nicaragua', 'niger', 'nigeria', 'north korea',
  'north macedonia', 'norway', 'oman', 'pakistan', 'palau', 'palestine',
  'panama', 'papua new guinea', 'paraguay', 'peru', 'philippines',
  'poland', 'portugal', 'qatar', 'republic of the congo', 'romania',
  'russia', 'rwanda', 'saint kitts and nevis', 'saint lucia',
  'saint vincent and the grenadines', 'samoa', 'san marino',
  'sao tome and principe', 'saudi arabia', 'senegal', 'serbia',
  'seychelles', 'sierra leone', 'singapore', 'slovakia', 'slovenia',
  'solomon islands', 'somalia', 'south africa', 'south korea',
  'south sudan', 'spain', 'sri lanka', 'sudan', 'suriname', 'sweden',
  'switzerland', 'syria', 'taiwan', 'tajikistan', 'tanzania', 'thailand',
  'timor-leste', 'togo', 'tonga', 'trinidad and tobago', 'tunisia',
  'turkey', 'turkmenistan', 'tuvalu', 'uganda', 'ukraine',
  'united arab emirates', 'united kingdom', 'united states', 'uruguay',
  'uzbekistan', 'vanuatu', 'vatican city', 'venezuela', 'vietnam',
  'yemen', 'zambia', 'zimbabwe',
]
