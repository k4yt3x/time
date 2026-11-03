/**
 * Choices about places that the time zone database leaves open: well-known cities and regions
 * that have no zone of their own, the English names of countries and of zones' cities, and
 * which zone stands for a country that has several.
 */

export interface CuratedPlace {
  /** The English name. */
  name: string
  /** The URL; the name with underscores for spaces when absent. */
  slug?: string
  kind: 'city' | 'region'
  /** The IANA time zone it keeps. */
  zone: string
  /** ISO 3166 country code. */
  country: string
}

const city = (name: string, zone: string, country: string): CuratedPlace => ({
  name,
  kind: 'city',
  zone,
  country,
})
const region = (name: string, zone: string, country: string): CuratedPlace => ({
  name,
  kind: 'region',
  zone,
  country,
})

const newYork = 'America/New_York'
const chicago = 'America/Chicago'
const denver = 'America/Denver'
const losAngeles = 'America/Los_Angeles'

export const curatedPlaces: readonly CuratedPlace[] = [
  // United States
  { name: 'Washington, D.C.', slug: 'Washington', kind: 'city', zone: newYork, country: 'US' },
  ...['Atlanta', 'Baltimore', 'Boston', 'Buffalo', 'Charlotte', 'Cincinnati', 'Cleveland']
    .concat(['Columbus', 'Miami', 'Newark', 'Orlando', 'Philadelphia', 'Pittsburgh', 'Raleigh'])
    .concat(['Richmond', 'Tampa'])
    .map((name) => city(name, newYork, 'US')),
  ...['Austin', 'Dallas', 'Fort Worth', 'Houston', 'Kansas City', 'Memphis', 'Milwaukee']
    .concat(['Minneapolis', 'Nashville', 'New Orleans', 'Oklahoma City', 'Omaha', 'San Antonio'])
    .concat(['Saint Louis'])
    .map((name) => city(name, chicago, 'US')),
  ...['Albuquerque', 'Colorado Springs', 'El Paso', 'Salt Lake City'].map((name) =>
    city(name, denver, 'US'),
  ),
  ...['Mesa', 'Scottsdale', 'Tucson'].map((name) => city(name, 'America/Phoenix', 'US')),
  ...['Las Vegas', 'Oakland', 'Portland', 'Sacramento', 'San Diego', 'San Francisco']
    .concat(['San Jose', 'Seattle'])
    .map((name) => city(name, losAngeles, 'US')),
  city('San Juan', 'America/Puerto_Rico', 'PR'),

  // Canada and Mexico
  ...['Ottawa', 'Quebec City', 'Mississauga'].map((name) => city(name, 'America/Toronto', 'CA')),
  city('Calgary', 'America/Edmonton', 'CA'),
  city('Saskatoon', 'America/Regina', 'CA'),
  city('Guadalajara', 'America/Mexico_City', 'MX'),

  // Central and South America
  ...['Belo Horizonte', 'Brasília', 'Curitiba', 'Porto Alegre', 'Rio de Janeiro'].map((name) =>
    city(name, 'America/Sao_Paulo', 'BR'),
  ),
  city('Salvador', 'America/Bahia', 'BR'),
  city('Quito', 'America/Guayaquil', 'EC'),
  city('Medellín', 'America/Bogota', 'CO'),
  city('Cali', 'America/Bogota', 'CO'),
  city('Panama City', 'America/Panama', 'PA'),
  city('Kingston', 'America/Jamaica', 'JM'),
  city('Guatemala City', 'America/Guatemala', 'GT'),
  city('San Salvador', 'America/El_Salvador', 'SV'),

  // Europe
  ...['Cologne', 'Düsseldorf', 'Frankfurt', 'Hamburg', 'Munich', 'Stuttgart'].map((name) =>
    city(name, 'Europe/Berlin', 'DE'),
  ),
  ...['Barcelona', 'Málaga', 'Seville', 'Valencia'].map((name) =>
    city(name, 'Europe/Madrid', 'ES'),
  ),
  ...['Florence', 'Milan', 'Naples', 'Turin', 'Venice'].map((name) =>
    city(name, 'Europe/Rome', 'IT'),
  ),
  ...['Bordeaux', 'Lyon', 'Marseille', 'Nice', 'Toulouse'].map((name) =>
    city(name, 'Europe/Paris', 'FR'),
  ),
  ...['Birmingham', 'Bristol', 'Cardiff', 'Edinburgh', 'Glasgow', 'Leeds', 'Liverpool']
    .concat(['Manchester'])
    .map((name) => city(name, 'Europe/London', 'GB')),
  city('Porto', 'Europe/Lisbon', 'PT'),
  city('Rotterdam', 'Europe/Amsterdam', 'NL'),
  city('The Hague', 'Europe/Amsterdam', 'NL'),
  city('Antwerp', 'Europe/Brussels', 'BE'),
  ...['Basel', 'Bern', 'Geneva'].map((name) => city(name, 'Europe/Zurich', 'CH')),
  city('Salzburg', 'Europe/Vienna', 'AT'),
  city('Kraków', 'Europe/Warsaw', 'PL'),
  city('Gothenburg', 'Europe/Stockholm', 'SE'),
  city('Bergen', 'Europe/Oslo', 'NO'),
  city('Aarhus', 'Europe/Copenhagen', 'DK'),
  city('Thessaloniki', 'Europe/Athens', 'GR'),
  city('Saint Petersburg', 'Europe/Moscow', 'RU'),
  ...['Ankara', 'Antalya', 'Izmir'].map((name) => city(name, 'Europe/Istanbul', 'TR')),

  // Middle East and Africa
  city('Abu Dhabi', 'Asia/Dubai', 'AE'),
  city('Doha', 'Asia/Qatar', 'QA'),
  city('Manama', 'Asia/Bahrain', 'BH'),
  city('Kuwait City', 'Asia/Kuwait', 'KW'),
  ...['Jeddah', 'Mecca', 'Medina'].map((name) => city(name, 'Asia/Riyadh', 'SA')),
  city('Haifa', 'Asia/Jerusalem', 'IL'),
  city('Sanaa', 'Asia/Aden', 'YE'),
  ...['Cape Town', 'Durban', 'Pretoria'].map((name) => city(name, 'Africa/Johannesburg', 'ZA')),
  city('Abuja', 'Africa/Lagos', 'NG'),
  city('Alexandria', 'Africa/Cairo', 'EG'),
  city('Marrakesh', 'Africa/Casablanca', 'MA'),
  city('Rabat', 'Africa/Casablanca', 'MA'),
  city('Mombasa', 'Africa/Nairobi', 'KE'),
  city('Zanzibar', 'Africa/Dar_es_Salaam', 'TZ'),

  // Asia
  ...['Beijing', 'Chengdu', 'Guangzhou', 'Hangzhou', 'Nanjing', 'Shenzhen', 'Suzhou']
    .concat(['Tianjin', 'Wuhan', "Xi'an"])
    .map((name) => city(name, 'Asia/Shanghai', 'CN')),
  ...['Fukuoka', 'Kobe', 'Kyoto', 'Nagoya', 'Osaka', 'Sapporo', 'Yokohama'].map((name) =>
    city(name, 'Asia/Tokyo', 'JP'),
  ),
  city('Busan', 'Asia/Seoul', 'KR'),
  city('Incheon', 'Asia/Seoul', 'KR'),
  city('Kaohsiung', 'Asia/Taipei', 'TW'),
  ...['Ahmedabad', 'Bangalore', 'Chennai', 'Delhi', 'Hyderabad', 'Mumbai', 'New Delhi']
    .concat(['Pune'])
    .map((name) => city(name, 'Asia/Kolkata', 'IN')),
  ...['Islamabad', 'Lahore'].map((name) => city(name, 'Asia/Karachi', 'PK')),
  city('Chittagong', 'Asia/Dhaka', 'BD'),
  city('Astana', 'Asia/Almaty', 'KZ'),
  city('Hanoi', 'Asia/Ho_Chi_Minh', 'VN'),
  city('Da Nang', 'Asia/Ho_Chi_Minh', 'VN'),
  ...['Chiang Mai', 'Pattaya', 'Phuket'].map((name) => city(name, 'Asia/Bangkok', 'TH')),
  city('Bali', 'Asia/Makassar', 'ID'),
  city('Denpasar', 'Asia/Makassar', 'ID'),
  city('Surabaya', 'Asia/Jakarta', 'ID'),
  city('Bandung', 'Asia/Jakarta', 'ID'),
  city('Cebu', 'Asia/Manila', 'PH'),
  city('Quezon City', 'Asia/Manila', 'PH'),
  city('Penang', 'Asia/Kuala_Lumpur', 'MY'),
  city('Siem Reap', 'Asia/Phnom_Penh', 'KH'),
  city('Mandalay', 'Asia/Yangon', 'MM'),
  city('Malé', 'Indian/Maldives', 'MV'),

  // Oceania
  city('Gold Coast', 'Australia/Brisbane', 'AU'),
  ...['Christchurch', 'Queenstown', 'Wellington'].map((name) =>
    city(name, 'Pacific/Auckland', 'NZ'),
  ),
  city('Suva', 'Pacific/Fiji', 'FJ'),
  city('Papeete', 'Pacific/Tahiti', 'PF'),
  city('Port Vila', 'Pacific/Efate', 'VU'),

  // States, provinces and territories of countries with several zones. Each keeps the zone
  // most of its people live in.
  ...['Connecticut', 'Delaware', 'Florida', 'Maine', 'Maryland', 'Massachusetts']
    .concat(['New Hampshire', 'New Jersey', 'North Carolina', 'Ohio', 'Pennsylvania'])
    .concat(['Rhode Island', 'South Carolina', 'Vermont', 'Virginia', 'West Virginia'])
    .map((name) => region(name, newYork, 'US')),
  ...['Alabama', 'Arkansas', 'Illinois', 'Iowa', 'Kansas', 'Louisiana', 'Minnesota']
    .concat(['Mississippi', 'Missouri', 'Nebraska', 'North Dakota', 'Oklahoma', 'South Dakota'])
    .concat(['Tennessee', 'Texas', 'Wisconsin'])
    .map((name) => region(name, chicago, 'US')),
  ...['Colorado', 'Montana', 'New Mexico', 'Utah', 'Wyoming'].map((name) =>
    region(name, denver, 'US'),
  ),
  ...['California', 'Nevada', 'Oregon', 'Washington State'].map((name) =>
    region(name, losAngeles, 'US'),
  ),
  region('Alaska', 'America/Anchorage', 'US'),
  region('Arizona', 'America/Phoenix', 'US'),
  region('Hawaii', 'Pacific/Honolulu', 'US'),
  region('Idaho', 'America/Boise', 'US'),
  region('Indiana', 'America/Indiana/Indianapolis', 'US'),
  region('Kentucky', 'America/Kentucky/Louisville', 'US'),
  region('Michigan', 'America/Detroit', 'US'),
  region('Ontario', 'America/Toronto', 'CA'),
  region('Quebec', 'America/Toronto', 'CA'),
  region('British Columbia', 'America/Vancouver', 'CA'),
  region('Alberta', 'America/Edmonton', 'CA'),
  region('Northwest Territories', 'America/Edmonton', 'CA'),
  region('Manitoba', 'America/Winnipeg', 'CA'),
  region('Saskatchewan', 'America/Regina', 'CA'),
  region('Nova Scotia', 'America/Halifax', 'CA'),
  region('Prince Edward Island', 'America/Halifax', 'CA'),
  region('New Brunswick', 'America/Moncton', 'CA'),
  region('Newfoundland and Labrador', 'America/St_Johns', 'CA'),
  region('Yukon', 'America/Whitehorse', 'CA'),
  region('Nunavut', 'America/Iqaluit', 'CA'),
  region('New South Wales', 'Australia/Sydney', 'AU'),
  region('Australian Capital Territory', 'Australia/Sydney', 'AU'),
  region('Victoria', 'Australia/Melbourne', 'AU'),
  region('Queensland', 'Australia/Brisbane', 'AU'),
  region('South Australia', 'Australia/Adelaide', 'AU'),
  region('Western Australia', 'Australia/Perth', 'AU'),
  region('Tasmania', 'Australia/Hobart', 'AU'),
  region('Northern Territory', 'Australia/Darwin', 'AU'),
]

/**
 * Other names people type for a place, to the name that place goes by here: nicknames, former
 * names, and countries' everyday names.
 */
export const placeAliases: Readonly<Record<string, string>> = {
  NYC: 'New York',
  'New York City': 'New York',
  LA: 'Los Angeles',
  SF: 'San Francisco',
  DC: 'Washington, D.C.',
  'Washington DC': 'Washington, D.C.',
  Bombay: 'Mumbai',
  Bengaluru: 'Bangalore',
  Madras: 'Chennai',
  Peking: 'Beijing',
  Canton: 'Guangzhou',
  Leningrad: 'Saint Petersburg',
  'Nur-Sultan': 'Astana',
  Newfoundland: 'Newfoundland and Labrador',
  ACT: 'Australian Capital Territory',
  NSW: 'New South Wales',
  USA: 'United States',
  US: 'United States',
  America: 'United States',
  'United States of America': 'United States',
  UK: 'United Kingdom',
  GB: 'United Kingdom',
  Britain: 'United Kingdom',
  'Great Britain': 'United Kingdom',
  England: 'United Kingdom',
  Scotland: 'United Kingdom',
  Wales: 'United Kingdom',
  'Northern Ireland': 'United Kingdom',
  Holland: 'Netherlands',
  'The Netherlands': 'Netherlands',
  Korea: 'South Korea',
  ROK: 'South Korea',
  DPRK: 'North Korea',
  UAE: 'United Arab Emirates',
  Emirates: 'United Arab Emirates',
  Czechia: 'Czech Republic',
  Türkiye: 'Turkey',
  Burma: 'Myanmar',
  "Côte d'Ivoire": 'Ivory Coast',
  DRC: 'DR Congo',
  'Democratic Republic of the Congo': 'DR Congo',
  'Congo-Kinshasa': 'DR Congo',
  'Congo-Brazzaville': 'Republic of the Congo',
  'Timor-Leste': 'East Timor',
  Swaziland: 'Eswatini',
  Macedonia: 'North Macedonia',
  'Cabo Verde': 'Cape Verde',
  'Russian Federation': 'Russia',
  'Viet Nam': 'Vietnam',
  PRC: 'China',
  ROC: 'Taiwan',
  NZ: 'New Zealand',
  Aotearoa: 'New Zealand',
  'The Bahamas': 'Bahamas',
  'The Gambia': 'Gambia',
}

/** English names for countries whose name in the time zone database is not the everyday one. */
export const countryNames: Readonly<Record<string, string>> = {
  AS: 'American Samoa',
  BQ: 'Caribbean Netherlands',
  CC: 'Cocos Islands',
  CD: 'DR Congo',
  CF: 'Central African Republic',
  CG: 'Republic of the Congo',
  CI: 'Ivory Coast',
  GB: 'United Kingdom',
  GS: 'South Georgia',
  HM: 'Heard Island',
  KP: 'North Korea',
  KR: 'South Korea',
  MF: 'Saint Martin',
  MM: 'Myanmar',
  SX: 'Sint Maarten',
  SZ: 'Eswatini',
  TC: 'Turks and Caicos Islands',
  TF: 'French Southern Territories',
  UM: 'US Minor Outlying Islands',
  VC: 'Saint Vincent and the Grenadines',
  VG: 'British Virgin Islands',
  VI: 'US Virgin Islands',
  WS: 'Samoa',
}

/**
 * The zone that stands for a country with several, where that is not the first the time zone
 * database lists for it: the zone of its capital.
 */
export const countryZones: Readonly<Record<string, string>> = {
  AU: 'Australia/Sydney',
  BR: 'America/Sao_Paulo',
  CA: 'America/Toronto',
  FM: 'Pacific/Pohnpei',
  PS: 'Asia/Hebron',
  RU: 'Europe/Moscow',
  UA: 'Europe/Kyiv',
  UZ: 'Asia/Tashkent',
}

/** How the cities in zone names are written, where that takes more than spaces for underscores. */
export const zoneCityNames: Readonly<Record<string, string>> = {
  Araguaina: 'Araguaína',
  Asuncion: 'Asunción',
  Bahia_Banderas: 'Bahía de Banderas',
  Belem: 'Belém',
  Bogota: 'Bogotá',
  Busingen: 'Büsingen',
  Cancun: 'Cancún',
  Chisinau: 'Chișinău',
  Ciudad_Juarez: 'Ciudad Juárez',
  Cordoba: 'Córdoba',
  Cuiaba: 'Cuiabá',
  Curacao: 'Curaçao',
  Dumont_DUrville: "Dumont d'Urville",
  Eirunepe: 'Eirunepé',
  El_Aaiun: 'El Aaiún',
  Ho_Chi_Minh: 'Ho Chi Minh City',
  Maceio: 'Maceió',
  Mazatlan: 'Mazatlán',
  Merida: 'Mérida',
  Ndjamena: "N'Djamena",
  Noumea: 'Nouméa',
  Reykjavik: 'Reykjavík',
  Santarem: 'Santarém',
  Sao_Paulo: 'São Paulo',
  Sao_Tome: 'São Tomé',
  St_Barthelemy: 'St. Barthélemy',
  St_Helena: 'St. Helena',
  St_Johns: "St. John's",
  St_Kitts: 'St. Kitts',
  St_Lucia: 'St. Lucia',
  St_Thomas: 'St. Thomas',
  St_Vincent: 'St. Vincent',
  Tucuman: 'Tucumán',
  Urumqi: 'Ürümqi',
  Zurich: 'Zürich',
}

/** Zone names whose last part is not a place. */
export const notPlaces: ReadonlySet<string> = new Set([
  'Australia/North',
  'Australia/South',
  'Australia/West',
  'Australia/ACT',
  'Australia/NSW',
  'Australia/LHI',
])

/**
 * The places people most often mean, most likely first: the largest countries and cities, and
 * other cities known the world over. A search that matches several equally well lists these
 * first, so "tok" finds Tokyo before Tokelau.
 */
export const prominentPlaces: readonly string[] = [
  ...['China', 'India', 'United States', 'Tokyo', 'Indonesia', 'Delhi', 'Shanghai']
    .concat(['Pakistan', 'Nigeria', 'Brazil', 'São Paulo', 'Mexico City', 'Cairo'])
    .concat(['Mumbai', 'Beijing', 'Bangladesh', 'Dhaka', 'Russia', 'Mexico', 'Osaka'])
    .concat(['New York', 'Karachi', 'Buenos Aires', 'Japan', 'Philippines', 'Istanbul'])
    .concat(['Kolkata', 'Manila', 'Lagos', 'Rio de Janeiro', 'Ethiopia', 'Egypt', 'Vietnam'])
    .concat(['Kinshasa', 'Guangzhou', 'Los Angeles', 'Moscow', 'Shenzhen', 'Lahore'])
    .concat(['Bangalore', 'Paris', 'Bogotá', 'Jakarta', 'Chennai', 'Lima', 'Bangkok', 'Seoul'])
    .concat(['Germany', 'Turkey', 'Iran', 'Thailand', 'United Kingdom', 'France', 'Italy'])
    .concat(['London', 'Tehran', 'Chicago', 'Ho Chi Minh City', 'Hong Kong', 'Toronto'])
    .concat(['South Africa', 'Kenya', 'South Korea', 'Colombia', 'Spain', 'Argentina'])
    .concat(['Ukraine', 'Canada', 'Poland', 'Australia', 'Saudi Arabia', 'Malaysia', 'Peru'])
    .concat(['Singapore', 'Sydney', 'Dubai', 'Berlin', 'Madrid', 'Rome', 'San Francisco'])
    .concat(['Washington, D.C.', 'Melbourne', 'Santiago', 'Riyadh', 'Taipei', 'Kuala Lumpur'])
    .concat(['Netherlands', 'Amsterdam', 'Vancouver', 'Montreal', 'Houston', 'Dallas'])
    .concat(['Miami', 'Atlanta', 'Boston', 'Seattle', 'Denver', 'Phoenix', 'Honolulu'])
    .concat(['Taiwan', 'New Zealand', 'Auckland', 'Israel', 'Jerusalem', 'Switzerland'])
    .concat(['Zurich', 'Sweden', 'Stockholm', 'Vienna', 'Austria', 'Portugal', 'Lisbon'])
    .concat(['Greece', 'Athens', 'Ireland', 'Dublin', 'Kyiv', 'Warsaw', 'Prague', 'Brussels'])
    .concat(['Nepal', 'Kathmandu', 'Sri Lanka', 'Afghanistan', 'Iraq', 'Baghdad', 'Qatar'])
    .concat(['United Arab Emirates', 'Hawaii', 'California', 'Texas', 'Florida', 'Brisbane'])
    .concat(['Perth', 'Adelaide', 'Calgary', 'Edmonton', 'Winnipeg', 'Halifax', 'Anchorage'])
    .concat(['Manaus', 'Novosibirsk', 'Yekaterinburg', 'Vladivostok']),
]
