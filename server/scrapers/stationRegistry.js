// Maps full state/province names (as returned by Open-Meteo geocoding) to 2-letter codes.
export const REGION_CODE = {
  'Alabama':'AL','Alaska':'AK','Arizona':'AZ','Arkansas':'AR','California':'CA',
  'Colorado':'CO','Connecticut':'CT','Delaware':'DE','Florida':'FL','Georgia':'GA',
  'Hawaii':'HI','Idaho':'ID','Illinois':'IL','Indiana':'IN','Iowa':'IA',
  'Kansas':'KS','Kentucky':'KY','Louisiana':'LA','Maine':'ME','Maryland':'MD',
  'Massachusetts':'MA','Michigan':'MI','Minnesota':'MN','Mississippi':'MS',
  'Missouri':'MO','Montana':'MT','Nebraska':'NE','Nevada':'NV','New Hampshire':'NH',
  'New Jersey':'NJ','New Mexico':'NM','New York':'NY','North Carolina':'NC',
  'North Dakota':'ND','Ohio':'OH','Oklahoma':'OK','Oregon':'OR','Pennsylvania':'PA',
  'Rhode Island':'RI','South Carolina':'SC','South Dakota':'SD','Tennessee':'TN',
  'Texas':'TX','Utah':'UT','Vermont':'VT','Virginia':'VA','Washington':'WA',
  'West Virginia':'WV','Wisconsin':'WI','Wyoming':'WY',
  // Canadian provinces
  'Alberta':'AB','British Columbia':'BC','Manitoba':'MB','New Brunswick':'NB',
  'Newfoundland and Labrador':'NL','Nova Scotia':'NS','Ontario':'ON',
  'Prince Edward Island':'PE','Quebec':'QC','Saskatchewan':'SK',
}

// Curated list of local TV station weather pages with explicit stateCode for filtering.
export const STATIONS = [
  // ── TEGNA Group ───────────────────────────────────────
  { callsign:'KUSA', stateCode:'CO', market:'Denver, CO',        group:'tegna',   lat:39.74, lon:-104.98, url:'https://www.9news.com/weather',     selectors:{temp:'.current-temp,[class*="CurrentTemp"],[data-testid="temp"]',condition:'.condition-text,[class*="Condition"]',narrative:'.forecast-narrative,[class*="ForecastText"]'} },
  { callsign:'KDVR', stateCode:'CO', market:'Denver, CO (FOX)',  group:'nexstar', lat:39.74, lon:-104.98, url:'https://kdvr.com/weather/',          selectors:{temp:'.wx-temp,.current-temperature',condition:'.wx-phrase',narrative:'.wx-forecast-text'} },
  { callsign:'WFAA', stateCode:'TX', market:'Dallas, TX',        group:'tegna',   lat:32.78, lon:-96.80,  url:'https://www.wfaa.com/weather',      selectors:{temp:'.current-temp,[class*="CurrentTemp"]',condition:'.condition-text,[class*="Condition"]',narrative:'.forecast-narrative'} },
  { callsign:'KHOU', stateCode:'TX', market:'Houston, TX',       group:'tegna',   lat:29.76, lon:-95.37,  url:'https://www.khou.com/weather',      selectors:{temp:'.current-temp,[class*="CurrentTemp"]',condition:'.condition-text',narrative:'.forecast-narrative'} },
  { callsign:'KSAT', stateCode:'TX', market:'San Antonio, TX',   group:'hearst',  lat:29.42, lon:-98.49,  url:'https://www.ksat.com/weather/',     selectors:{temp:'[class*="temperature"],.temp-value',condition:'[class*="condition"],[class*="summary"]',narrative:'[class*="forecast-text"],[class*="narrative"]'} },
  { callsign:'KING', stateCode:'WA', market:'Seattle, WA',       group:'tegna',   lat:47.61, lon:-122.33, url:'https://www.king5.com/weather',     selectors:{temp:'.current-temp,[class*="CurrentTemp"]',condition:'.condition-text',narrative:'.forecast-narrative'} },
  { callsign:'KOMO', stateCode:'WA', market:'Seattle, WA (ABC)', group:'sinclair',lat:47.61, lon:-122.33, url:'https://komonews.com/weather',      selectors:{temp:'[class*="temperature"],.temp',condition:'[class*="condition"]',narrative:'[class*="forecast"]'} },
  { callsign:'WTSP', stateCode:'FL', market:'Tampa, FL',         group:'tegna',   lat:27.97, lon:-82.46,  url:'https://www.wtsp.com/weather',      selectors:{temp:'.current-temp,[class*="CurrentTemp"]',condition:'.condition-text',narrative:'.forecast-narrative'} },
  { callsign:'WCTV', stateCode:'FL', market:'Tallahassee, FL',   group:'gray',    lat:30.44, lon:-84.28,  url:'https://www.wctv.tv/weather',       selectors:{temp:'[class*="temperature"],.current-temp',condition:'[class*="condition"]',narrative:'[class*="forecast"]'} },
  { callsign:'WPTV', stateCode:'FL', market:'West Palm Beach, FL',group:'scripps',lat:26.71, lon:-80.05,  url:'https://www.wptv.com/weather',      selectors:{temp:'[class*="temperature"],.temp',condition:'[class*="condition"]',narrative:'[class*="forecast"]'} },
  { callsign:'WXIA', stateCode:'GA', market:'Atlanta, GA',       group:'tegna',   lat:33.75, lon:-84.39,  url:'https://www.11alive.com/weather',   selectors:{temp:'.current-temp,[class*="CurrentTemp"]',condition:'.condition-text',narrative:'.forecast-narrative'} },
  { callsign:'KARE', stateCode:'MN', market:'Minneapolis, MN',   group:'tegna',   lat:44.98, lon:-93.27,  url:'https://www.kare11.com/weather',    selectors:{temp:'.current-temp,[class*="CurrentTemp"]',condition:'.condition-text',narrative:'.forecast-narrative'} },
  { callsign:'KSDK', stateCode:'MO', market:'St. Louis, MO',     group:'tegna',   lat:38.63, lon:-90.20,  url:'https://www.ksdk.com/weather',      selectors:{temp:'.current-temp,[class*="CurrentTemp"]',condition:'.condition-text',narrative:'.forecast-narrative'} },
  { callsign:'WDAF', stateCode:'MO', market:'Kansas City, MO',   group:'nexstar', lat:39.10, lon:-94.58,  url:'https://fox4kc.com/weather/',        selectors:{temp:'.wx-temp,.current-temperature',condition:'.wx-phrase',narrative:'.wx-forecast-text'} },
  { callsign:'KSHB', stateCode:'MO', market:'Kansas City, MO',   group:'scripps', lat:39.10, lon:-94.58,  url:'https://www.41actionnews.com/weather',selectors:{temp:'[class*="temperature"],.temp',condition:'[class*="condition"]',narrative:'[class*="forecast"]'} },
  { callsign:'WCNC', stateCode:'NC', market:'Charlotte, NC',     group:'tegna',   lat:35.23, lon:-80.84,  url:'https://www.wcnc.com/weather',      selectors:{temp:'.current-temp,[class*="CurrentTemp"]',condition:'.condition-text',narrative:'.forecast-narrative'} },
  { callsign:'WBTV', stateCode:'NC', market:'Charlotte, NC',     group:'gray',    lat:35.23, lon:-80.84,  url:'https://www.wbtv.com/weather',      selectors:{temp:'[class*="temperature"],.current-temp',condition:'[class*="condition"]',narrative:'[class*="forecast"]'} },
  { callsign:'KPNX', stateCode:'AZ', market:'Phoenix, AZ',       group:'tegna',   lat:33.45, lon:-112.07, url:'https://www.12news.com/weather',    selectors:{temp:'.current-temp,[class*="CurrentTemp"]',condition:'.condition-text',narrative:'.forecast-narrative'} },
  { callsign:'KNXV', stateCode:'AZ', market:'Phoenix, AZ (ABC)', group:'scripps', lat:33.45, lon:-112.07, url:'https://www.abc15.com/weather',     selectors:{temp:'[class*="temperature"],.temp',condition:'[class*="condition"]',narrative:'[class*="forecast"]'} },
  { callsign:'KOLD', stateCode:'AZ', market:'Tucson, AZ',        group:'gray',    lat:32.22, lon:-110.97, url:'https://www.kold.com/weather',      selectors:{temp:'[class*="temperature"],.current-temp',condition:'[class*="condition"]',narrative:'[class*="forecast"]'} },
  { callsign:'KTLA', stateCode:'CA', market:'Los Angeles, CA',   group:'nexstar', lat:34.05, lon:-118.24, url:'https://ktla.com/weather/',          selectors:{temp:'.wx-temp,.current-temperature',condition:'.wx-phrase',narrative:'.wx-forecast-text'} },
  { callsign:'KGW',  stateCode:'OR', market:'Portland, OR',      group:'tegna',   lat:45.52, lon:-122.68, url:'https://www.kgw.com/weather',       selectors:{temp:'.current-temp,[class*="CurrentTemp"]',condition:'.condition-text',narrative:'.forecast-narrative'} },
  { callsign:'WGN',  stateCode:'IL', market:'Chicago, IL',       group:'nexstar', lat:41.88, lon:-87.63,  url:'https://wgntv.com/weather/',         selectors:{temp:'.wx-temp,.current-temperature',condition:'.wx-phrase',narrative:'.wx-forecast-text'} },
  { callsign:'WBAL', stateCode:'MD', market:'Baltimore, MD',     group:'hearst',  lat:39.29, lon:-76.61,  url:'https://www.wbaltv.com/weather',    selectors:{temp:'[class*="temperature"],.temp-value',condition:'[class*="condition"]',narrative:'[class*="forecast-text"]'} },
  { callsign:'WBFF', stateCode:'MD', market:'Baltimore, MD (FOX)',group:'sinclair',lat:39.29, lon:-76.61,  url:'https://foxbaltimore.com/weather',  selectors:{temp:'[class*="temperature"],.temp',condition:'[class*="condition"]',narrative:'[class*="forecast"]'} },
  { callsign:'WJLA', stateCode:'VA', market:'Washington DC area', group:'sinclair',lat:38.91, lon:-77.04,  url:'https://wjla.com/weather',          selectors:{temp:'[class*="temperature"],.temp',condition:'[class*="condition"]',narrative:'[class*="forecast"]'} },
  { callsign:'WISN', stateCode:'WI', market:'Milwaukee, WI',     group:'hearst',  lat:43.04, lon:-87.91,  url:'https://www.wisn.com/weather',      selectors:{temp:'[class*="temperature"],.temp-value',condition:'[class*="condition"]',narrative:'[class*="forecast-text"]'} },
  { callsign:'WKBT', stateCode:'WI', market:'La Crosse, WI',     group:'gray',    lat:43.80, lon:-91.24,  url:'https://www.wkbt.com/weather',      selectors:{temp:'[class*="temperature"],.current-temp',condition:'[class*="condition"]',narrative:'[class*="forecast"]'} },
  { callsign:'KETV', stateCode:'NE', market:'Omaha, NE',         group:'hearst',  lat:41.26, lon:-95.94,  url:'https://www.ketv.com/weather',      selectors:{temp:'[class*="temperature"],.temp-value',condition:'[class*="condition"]',narrative:'[class*="forecast-text"]'} },
  { callsign:'WKRN', stateCode:'TN', market:'Nashville, TN',     group:'nexstar', lat:36.17, lon:-86.78,  url:'https://www.wkrn.com/weather/',     selectors:{temp:'.wx-temp,[class*="wx-temp"],.current-temperature',condition:'.wx-phrase,[class*="wx-phrase"]',narrative:'.wx-forecast-text,.forecast-discussion'} },
  { callsign:'WVLT', stateCode:'TN', market:'Knoxville, TN',     group:'gray',    lat:35.96, lon:-83.92,  url:'https://www.wvlt.tv/weather',       selectors:{temp:'[class*="temperature"],.current-temp',condition:'[class*="condition"]',narrative:'[class*="forecast"]'} },
  { callsign:'WEWS', stateCode:'OH', market:'Cleveland, OH',     group:'scripps', lat:41.50, lon:-81.69,  url:'https://www.newsnet5.com/weather',  selectors:{temp:'[class*="temperature"],.temp',condition:'[class*="condition"]',narrative:'[class*="forecast"]'} },
  { callsign:'WXYZ', stateCode:'MI', market:'Detroit, MI',       group:'scripps', lat:42.33, lon:-83.05,  url:'https://www.wxyz.com/weather',      selectors:{temp:'[class*="temperature"],.temp',condition:'[class*="condition"]',narrative:'[class*="forecast"]'} },
  { callsign:'WMUR', stateCode:'NH', market:'Manchester, NH',    group:'hearst',  lat:42.99, lon:-71.46,  url:'https://www.wmur.com/weather',      selectors:{temp:'[class*="temperature"],.temp-value',condition:'[class*="condition"]',narrative:'[class*="forecast-text"]'} },
  { callsign:'WBRE', stateCode:'PA', market:'Wilkes-Barre, PA',  group:'nexstar', lat:41.25, lon:-75.88,  url:'https://www.pahomepage.com/weather/', selectors:{temp:'.wx-temp,.current-temperature',condition:'.wx-phrase',narrative:'.wx-forecast-text'} },
  { callsign:'WIVB', stateCode:'NY', market:'Buffalo, NY',       group:'nexstar', lat:42.89, lon:-78.88,  url:'https://www.wivb.com/weather/',      selectors:{temp:'.wx-temp,.current-temperature',condition:'.wx-phrase',narrative:'.wx-forecast-text'} },
  { callsign:'WAPT', stateCode:'MS', market:'Jackson, MS',       group:'hearst',  lat:32.30, lon:-90.18,  url:'https://www.wapt.com/weather',      selectors:{temp:'[class*="temperature"],.temp-value',condition:'[class*="condition"]',narrative:'[class*="forecast-text"]'} },
  { callsign:'KHBS', stateCode:'AR', market:'Fort Smith, AR',    group:'hearst',  lat:35.39, lon:-94.42,  url:'https://www.khbs.com/weather',      selectors:{temp:'[class*="temperature"],.temp-value',condition:'[class*="condition"]',narrative:'[class*="forecast-text"]'} },
]

// Haversine distance in miles
function distanceMiles(lat1, lon1, lat2, lon2) {
  const R = 3958.8
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

// Return up to `count` nearest stations within maxMiles, optionally restricted to the same state/province.
// admin1: full state/province name from geocoding (e.g. "Colorado")
export function findNearestStations(lat, lon, { admin1, maxMiles = 100, count = 3 } = {}) {
  const targetCode = admin1 ? REGION_CODE[admin1] : null

  let pool = STATIONS.map((s) => ({
    ...s,
    distance: Math.round(distanceMiles(lat, lon, s.lat, s.lon)),
  }))

  if (targetCode) {
    pool = pool.filter((s) => s.stateCode === targetCode && s.distance <= maxMiles)
  } else {
    pool = pool.filter((s) => s.distance <= maxMiles)
  }

  return pool.sort((a, b) => a.distance - b.distance).slice(0, count)
}
