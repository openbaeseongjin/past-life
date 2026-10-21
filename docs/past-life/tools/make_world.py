# OWID 역사 인구(나라별, HYDE 3.x 등) → world.js : 기준 해마다 지역 7개 비율과 지역 안 땅 비율 (설계 3장)
# 사용: python tools/make_world.py   (인터넷 필요. 결과 world.js 는 저장소에 넣는다)
import csv, io, json, os, sys, urllib.request
from collections import defaultdict

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, '..', 'world.js')
UA = {'User-Agent': 'Mozilla/5.0'}
POP = 'https://ourworldindata.org/grapher/population.csv?v=1&csvType=full&useColumnShortNames=true'
CONT = 'https://ourworldindata.org/grapher/continents-according-to-our-world-in-data.csv?v=1&csvType=full&useColumnShortNames=true'

def fetch(url):
    return list(csv.DictReader(io.StringIO(urllib.request.urlopen(urllib.request.Request(url, headers=UA)).read().decode('utf-8'))))

# 땅: 지역 → {땅: 나라 코드}. 목록에 없는 나라는 그 지역의 FALLBACK 땅으로 간다
AREAS = {
    'east': {'china': 'CHN TWN HKG MAC', 'japan': 'JPN', 'korea': 'KOR PRK', 'mongolia': 'MNG'},
    'south': {'india': 'IND', 'bengal': 'BGD', 'indus': 'PAK AFG', 'himalaya': 'NPL BTN', 'lanka': 'LKA MDV'},
    'west': {'anatolia': 'TUR CYP GEO ARM AZE', 'iran': 'IRN', 'nile': 'EGY SDN', 'mesopotamia': 'IRQ SYR LBN ISR PSE JOR',
             'arabia': 'SAU YEM OMN ARE QAT BHR KWT', 'maghreb': 'DZA MAR TUN LBY ESH', 'steppe': 'KAZ UZB TKM KGZ TJK'},
    'europe': {'east_europe': 'RUS UKR BLR POL LTU LVA EST MDA', 'france': 'FRA BEL LUX MCO', 'italy': 'ITA MLT SMR VAT',
               'germany': 'DEU AUT CHE LIE NLD CZE SVK HUN', 'iberia': 'ESP PRT AND GIB', 'britain': 'GBR IRL IMN',
               'nordic': 'SWE NOR DNK FIN ISL FRO', 'balkans': 'ROU BGR GRC SRB HRV BIH ALB MKD MNE SVN XKX'},
    'africa': {'west_africa': 'NGA BEN GHA BFA CIV MLI NER SEN GIN TGO SLE LBR GMB GNB MRT CPV TCD',
               'east_africa': 'ETH TZA UGA KEN SOM RWA BDI ERI DJI SSD MDG COM SYC MUS',
               'congo': 'COD COG CMR CAF GAB GNQ AGO STP', 'south_africa': 'ZAF ZWE ZMB MWI MOZ BWA NAM LSO SWZ'},
    'americas': {'mesoamerica': 'MEX GTM HND SLV NIC CRI PAN BLZ', 'andes': 'PER BOL ECU COL CHL VEN', 'brazil': 'BRA',
                 'north_america': 'USA CAN', 'la_plata': 'ARG URY PRY', 'caribbean': 'CUB HTI DOM JAM PRI TTO BHS BRB'},
    'seaoc': {'indonesia': 'IDN TLS', 'mainland_sea': 'MMR THA VNM KHM LAO', 'philippines': 'PHL', 'malay': 'MYS SGP BRN',
              'australia': 'AUS NZL', 'pacific': 'PNG FJI SLB VUT WSM TON KIR FSM MHL PLW NRU TUV NCL PYF GUM'},
}
FALLBACK = {'east': 'china', 'south': 'india', 'west': 'mesopotamia', 'europe': 'germany', 'africa': 'east_africa',
            'americas': 'caribbean', 'seaoc': 'pacific'}
EXTRA_WEST = 'EGY LBY TUN DZA MAR ESH SDN'.split()   # 북아프리카 → 서아시아 묶음
ORDER = ['east', 'south', 'west', 'europe', 'africa', 'americas', 'seaoc']
YEARS = [-10000, -9000, -8000, -7000, -6000, -5000, -4000, -3000, -2000, -1000, 0, 100, 200, 300, 400, 500, 600, 700, 800,
         900, 1000, 1100, 1200, 1300, 1400, 1500, 1600, 1700, 1750, 1800, 1850, 1900, 1950, 1980, 2000, 2020]

area_of = {}
for g, areas in AREAS.items():
    for a, codes in areas.items():
        for c in codes.split(): area_of[c] = (g, a)

def place(code, cont):
    if code in area_of: return area_of[code]
    if code in EXTRA_WEST: return ('west', 'maghreb')
    g = {'Europe': 'europe', 'Africa': 'africa', 'North America': 'americas', 'South America': 'americas', 'Oceania': 'seaoc'}.get(cont)
    if g is None and cont == 'Asia': g = 'west'
    return (g, FALLBACK[g]) if g else None

def main():
    cont = {r['code']: r['owid_region'] for r in fetch(CONT)}
    pop = defaultdict(lambda: defaultdict(float))   # 해 → (지역, 땅) → 사람
    skipped = set()
    for r in fetch(POP):
        c = r['code']
        if not c or c.startswith('OWID') or int(r['year']) not in YEARS: continue
        p = place(c, cont.get(c))
        if p is None: skipped.add(r['entity']); continue
        pop[int(r['year'])][p] += float(r['population_historical'])
    print('지역 못 정한 곳:', sorted(skipped), file=sys.stderr)
    region = {g: [] for g in ORDER}
    area = {g: {a: [] for a in AREAS[g]} for g in ORDER}
    for y in YEARS:
        tot = sum(pop[y].values())
        for g in ORDER:
            gs = sum(v for (gg, _), v in pop[y].items() if gg == g)
            region[g].append(round(gs / tot, 5))
            for a in AREAS[g]:
                area[g][a].append(round(pop[y][(g, a)] / gs, 4) if gs else 0)
    js = ['// 생성 파일 — tools/make_world.py 가 OWID population.csv (HYDE 3.x 등 나라별 역사 인구)로 만든다. 손으로 고치지 말 것',
          'export const YEARS = ' + json.dumps(YEARS) + ';',
          '// 지역 비율 (기준 해마다, 합 1)',
          'export const REGION_SHARE = ' + json.dumps(region) + ';',
          '// 지역 안 땅 비율 (기준 해마다, 합 1)',
          'export const AREA_SHARE = ' + json.dumps(area) + ';', '']
    open(OUT, 'w', encoding='utf-8', newline='\n').write('\n'.join(js))
    i0, i1600 = YEARS.index(0), YEARS.index(1600)
    print('1년: 동아시아 %.1f%% 남아시아 %.1f%% 유럽 %.1f%% / 1600년 아메리카 %.1f%%' % (
        100 * region['east'][i0], 100 * region['south'][i0], 100 * region['europe'][i0], 100 * region['americas'][i1600]))

if __name__ == '__main__':
    main()
