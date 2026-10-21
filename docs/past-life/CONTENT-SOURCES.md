# 내용 출처 (CONTENT-SOURCES)

한 영혼의 여정에 들어간 역사 사실과 그 출처를 줄마다 적는다. 계속 늘어나는 파일이다(다음 작업이 사건·카드 출처를 덧붙인다).

- 형식: `- [칸] 사실 — 출처`. 칸은 `문화권/묶음`, `땅`, `땅 해~해`, `사건 id` 가운데 하나다.
- 출처는 공개 자료의 제목이다. 따로 적지 않으면 영어 위키백과 문서 제목이고, `위키백과 '…'`는 한국어판, `ja:`·`zh:`는 일본어판·중국어판이다. OWID는 Our World in Data다.
- 「넓은 표현」으로 표시한 줄은 연대나 풍습을 하나로 못 박기 어렵다. 그래서 게임 글을 일반적인 말로 썼다.
- 값(의술·기술 수준, 문해율, 품삯 배율, 살림 값)은 모두 「게임용 어림」이다. 이 파일은 그 어림의 근거를 적는다.

## 맥락 표 (context_data.js, Task 2)

### 연대 기준 (모든 문화권)
- [의술 0~5] 종두는 1796년부터, 세균설과 소독은 1860~1870년대, 항생제는 1940년대 — 'Smallpox vaccine', 'Germ theory of disease', 'Antiseptic', 'History of penicillin'
- [의술 아메리카 1803~] 스페인 왕실의 종두 원정이 1803~1806년에 아메리카와 필리핀으로 우두를 날랐다 — 'Balmis Expedition'
- [문해율] 세계 문해율은 1820년 약 12%, 1900년 약 21%, 1950년 약 50%, 2000년 80% 넘음. 땅별 값은 이 곡선 위의 어림이다 — OWID 'Literacy'
- [전쟁 0~3] 0 평화, 1 국경 다툼, 2 전쟁, 3 땅이 전장. 설계 3.2의 게임용 눈금이다 — 설계 문서

### europe (유럽)
- [europe/forager] 중석기 유럽 사람들은 개암을 모으고 붉은사슴을 사냥했다 — 'Mesolithic Europe', 'Red deer'
- [europe/ancient 기원전 600년 전] 신석기·청동기 유럽의 선돌·거석, 동전 이전의 물물교환 — 'Megalith', 'Commodity money'
- [europe/ancient] 철기는 기원전 800년 무렵부터 퍼졌다. 그리스 드라크마와 로마 은화가 쓰였고, 고대 사회에는 노예제가 있었다 — 'Iron Age Europe', 'Denarius', 'Slavery in ancient Rome'
- [europe/ancient] 히포크라테스 학파의 체계 의학(기원전 400년 무렵), 로마 시대 지중해의 학질 — 'Hippocratic Corpus', 'History of malaria'
- [europe/medieval] 봉건제와 농노(봉건제라는 말은 9~10세기 뒤에 더 맞는 넓은 표현), 은화 페니(드니에·페니히), 무거운 쟁기·물레방아, 풍차(유럽의 확실한 첫 기록은 1185년이라 1180년부터) — 'Feudalism', 'Serfdom', 'Penny', 'Heavy plough', 'Watermill', 'Windmill'
- [europe/medieval] 생일보다 이름을 딴 성인의 축일을 지켰다 (넓은 표현) — 'Name day'
- [europe/medieval] 중세 유럽의 한센병 — 'History of leprosy'
- [europe 1347~1720] 흑사병이 되풀이해 돌았다. 서유럽의 마지막 큰 유행은 1720년 마르세유다 — 'Second plague pandemic', 'Great Plague of Marseille'
- [europe/early] 세 신분, 이발사 외과의, 인쇄기(1450년 무렵)·화약·범선 — 'Estates of the realm', 'Barber surgeon', 'Printing press'
- [europe/industrial] 증기 기관·철도·전신, 계급 사회, 콜레라 대유행(1830년대~), 결핵 — 'Industrial Revolution', '1826–1837 cholera pandemic', 'History of tuberculosis'
- [europe/industrial] 아이 생일 케이크에 초를 꽂는 풍습은 18세기 독일 「킨더페스트」에서 퍼졌다. 농가의 첫돌 케이크는 1870년부터, 그 앞은 「빵이 조금 더 하얬다」 줄로 쓴다 (넓은 표현) — 'Birthday cake'
- [europe/modern] 지폐·슈퍼마켓·텔레비전, 유로(2002년 현금) — 'Euro', 'Supermarket'
- [britain] 에이커, 실링(1500년 무렵부터), 파운드 — 'Acre', 'Shilling (British coin)', 'Pound sterling'
- [britain 43~410] 로마의 브리타니아 — 'Roman Britain'
- [britain 1553~1603, 1702~1714, 1837~1901, 1952~2022] 여왕의 재위 — 'List of English monarchs', 'List of British monarchs'
- [britain 1760~] 증기 기관과 방적기가 먼저 쓰였다 — 'Watt steam engine', 'Spinning frame'
- [britain/industrial] 벽돌 연립주택, 1870년 초등교육법 뒤 문해율이 크게 올랐다 — 'Terraced house', 'Elementary Education Act 1870'
- [france] 아르팡, 드니에, 수, 프랑(1795~), 헥타르(미터법), 유로(2002) — 'Arpent', 'French denier', 'Sou', 'French franc', 'Hectare'
- [france 기원전 600~51] 철기 갈리아의 드루이드와 신성한 숲. 게르만·슬라브 땅의 신성한 숲도 철기(기원전 800년 무렵~)부터 쓴다 — 'Druid', 'Gaul', 'Sacred grove'
- [france 기원전 50~476] 로마의 갈리아 — 'Roman Gaul'
- [france 1800~1946] 통치자 칭호의 변화(제정·왕정·공화정·비시) — 'History of France', 'French Third Republic', 'Vichy France'
- [france 1880~] 7월 14일이 국경일이 되었다 — 'Bastille Day'
- [germany] 호밀과 호밀빵, 모르겐, 페니히, 탈러(1518~), 마르크(1873~), 제후 — 'Morgen', 'Pfennig', 'Thaler', 'German gold mark'
- [germany 600~779] 작센 땅의 개종은 8세기 말이다 — 'Saxon Wars'
- [germany 800~1499] 프랑크 황제와 신성 로마 제국 — 'Holy Roman Empire'
- [germany/early·industrial] 프로이센의 의무 교육, 높은 문해율 — 'Prussian education system'
- [germany 1871~1949] 제국, 바이마르 공화국, 독재 정권, 점령 — 'German Empire', 'Weimar Republic', 'Nazi Germany', 'Allied-occupied Germany'
- [italy 기원전 600~599] 로마 공화정(기원전 509~)과 제정(기원전 27~), 유게룸, 포룸, 수도교, 로마 시민과 노예 — 'Roman Republic', 'Roman Empire', 'Jugerum', 'Roman Forum', 'Roman aqueduct'
- [italy 기원전 211~300] 데나리우스, [기원전 500~380] 사투르날리아, [381~] 기독교 국교화 — 'Denarius', 'Saturnalia', 'Edict of Thessalonica'
- [italy/medieval] 도시 공동체(코무네)와 상인 — 'Medieval commune'
- [italy/early~1861] 스쿠도, [1861~] 이탈리아 왕국과 리라, [1922~1943] 독재 정권 — 'Italian scudo', 'Kingdom of Italy', 'Italian lira', 'Italian fascism'
- [east_europe/medieval] 그리브나(은 덩이), 대공, 통나무집, 메밀죽 — 'Grivna', 'Grand prince', 'Izba', 'Kasha'
- [east_europe 600~988] 루스의 개종(988)과 그 전의 신성한 숲 — 'Christianization of Kievan Rus'', 'Slavic paganism'
- [east_europe/early] 차르(1547~), 코페이카(1535~), 데샤티나, 농노제(1649 법전~1861) — 'Tsardom of Russia', 'Kopek', 'Desyatina', 'Serfdom in Russia', 'Emancipation reform of 1861'
- [east_europe 1918~1991] 소비에트 체제, 국영 상점, 집단 농장 농민의 이동 제한(1930~1974) — 'Soviet Union', 'Kolkhoz', 'Propiska in the Soviet Union'
- [east_europe/modern] 새해 전야가 큰 명절이다 (넓은 표현) — 'New Year in Russia'
- [nordic] 바이킹 시대의 해크실버, 율, 긴 집, 개종(1000년 무렵), 크로나(1873~) — 'Hacksilver', 'Yule', 'Longhouse', 'Christianization of Scandinavia', 'Scandinavian Monetary Union'
- [iberia 711~1200] 알안달루스(모스크·디르함·수크), [929~1031] 코르도바 칼리프국 — 'Al-Andalus', 'Caliphate of Córdoba'
- [iberia] 레알, 페세타(1868~), 유로(2002), 20세기 중반 낮은 문해율 — 'Spanish real', 'Spanish peseta', 'Literacy in Spain'
- [balkans 기원전 600~147] 그리스 아고라와 드라크마, [기원전 146~1203] 로마·비잔티움 황제, [1460~1878] 오스만 술탄·악체·쿠루쉬 — 'Agora', 'Ancient drachma', 'Byzantine Empire', 'Ottoman Greece', 'Akçe', 'Kuruş'

### southasia (남아시아)
- [southasia/forager] 빔베트카의 바위 그늘과 바위 그림 — 'Bhimbetka rock shelters'
- [southasia/ancient] 바르나 도식은 리그베다 후기(푸루샤 숙타, 기원전 1200~1000년 무렵)에 처음 나오고, 자티 중심의 신분은 그보다 뒤다. 인더스 문명(기원전 2600~1900)에는 카스트 증거가 없다. 그래서 −1200 전은 「씨족과 마을」, −1200~−1001은 「부족과 라자」, −1000~299는 「바르나」, 300년부터 「바르나와 자티」로 쓴다. 「바이샤」처럼 시대마다 뜻이 바뀐 바르나 이름은 신분 이름에 쓰지 않고, 하인 집안도 「가장 낮은 자티」로 묶지 않는다 — 'Varna (Hinduism)', 'Purusha Sukta', 'Jati'
- [southasia/ancient 기원전 501년 전] 조개 화폐, 베다 시대의 불 제단 — 'Shell money', 'Yajna'
- [southasia/ancient] 펀치마크 은화(기원전 6~4세기~), 아유르베다(차라카·수슈루타), 하라파의 구운 벽돌, 구루쿨라 — 'Punch-marked coins', 'Ayurveda', 'Indus Valley Civilisation', 'Gurukula'
- [southasia/ancient −500~] 첫 쌀밥을 먹이는 의례(안나프라샤나)는 보통 생후 여섯 달 무렵이다 — 'Annaprashana'
- [southasia/medieval] 비가, 디왈리, 마을 학교, 페르시아 수차, 물레 — 'Bigha', 'Diwali', 'Education in India', 'Sakia', 'Spinning wheel'
- [southasia/early] 루피(1540년대~), 자민다르 — 'Indian rupee', 'Zamindar'
- [southasia/industrial] 회사 통치와 영국령 인도, 철도(1853~)·전신·방직 공장, 라스카르 선원 — 'Company rule in India', 'British Raj', 'History of rail transport in India', 'Lascar'
- [southasia 1896~1930] 3차 페스트 대유행이 인도를 휩쓸었다 — 'Third plague pandemic'
- [southasia/industrial·modern] 인도 문해율: 1901년 약 5%, 1951년 약 18%, 2011년 약 74% — 'Literacy in India'
- [southasia/modern] 1950년 헌법이 불가촉을 없앴다. 자티는 남아 있다 — 'Constitution of India', 'Untouchability'
- [india 320~550] 굽타의 마하라자, [1206~1525] 델리 술탄국, [1526~1757] 무굴 황제, [1800~1857] 동인도회사, [1858~1947] 총독 — 'Gupta Empire', 'Delhi Sultanate', 'Mughal Empire', 'Company rule in India', 'Viceroy of India'
- [bengal] 밥과 생선, 다카 모슬린, 조개 화폐(19세기 초까지), 하트(마을 장), 카비라지(벵골의 아유르베다 의원) — 'Bengali cuisine', 'Dhaka muslin', 'Cowrie', 'Haat bazaar', 'Ayurveda'
- [bengal 1204~1575] 벵골의 술탄, [1576~1716] 무굴, [1717~1764] 나와브, [1765~] 회사 통치 — 'Bengal Sultanate', 'Bengal Subah', 'Nawabs of Bengal and Murshidabad'
- [bengal 1600~] 동벵골의 이슬람화는 16~17세기에 크게 일어났다 (넓은 표현) — 'Islam in Bangladesh'
- [bengal] 콜레라는 갠지스 하구의 풍토병이다, 타카(1972~) — 'Cholera', 'Bangladeshi taka'
- [indus] 밀과 로티, 하라파 시대(기원전 2600~1900)의 구운 벽돌집, 간다라 불교(기원전 250~500) — 'Roti', 'Indus Valley Civilisation', 'Gandhara'
- [indus 1000~] 가즈나 왕조와 델리 술탄국 아래 이슬람화, [1800~1848] 시크 제국, [1849~1947] 영국령 — 'Ghaznavids', 'Sikh Empire', 'Second Anglo-Sikh War'
- [indus/modern] 파키스탄 문해율 — 'Literacy in Pakistan'
- [lanka] 싱할라 사회는 힌두의 바르나·자티와 다른 신분 위계라 「가문과 신분」 같은 넓은 말과 중립 신분 이름을 쓴다 — 'Caste system in Sri Lanka'
- [lanka −250~] 불교는 기원전 3세기(마힌다, 기원전 247년 무렵)에 들어왔다. 그 앞에는 절이 없다. 웨삭, 영국령 실론(1796~1948) — 'Mahinda (Buddhist monk)', 'Buddhism in Sri Lanka', 'Vesak', 'British Ceylon'

### eastasia (동아시아)
- [eastasia/forager] 조몬 토기와 움집, 도토리 — 'Jōmon period'
- [eastasia/ancient 기원전 501년 전] 상나라의 조개 화폐 — 'Cowrie', 'Ancient Chinese coinage'
- [eastasia/ancient] 황제내경(기원전 1세기 무렵 엮임)의 체계 의학 — 'Huangdi Neijing'
- [china 기원전 600~222] 칼돈, [기원전 221~119] 반량전, [기원전 118~599] 오수전 — 'Knife money', 'Ban Liang', 'Wu Zhu'
- [china 기원전 475~221] 전국 시대, [기원전 221~] 황제 칭호 — 'Warring States period', 'Qin dynasty'
- [china 기원전 400~] 사농공상 — 'Four occupations'
- [china 400~] 불교 사원이 퍼졌다 (넓은 표현) — 'Chinese Buddhism'
- [eastasia/medieval] 동전(문), 목판 인쇄, 종이, 나침반, 화약 — 'Cash (Chinese coin)', 'Woodblock printing', 'Four Great Inventions'
- [china 960~1499] 송의 사대부와 활자 인쇄 — 'Scholar-official', 'Movable type'
- [eastasia/medieval] 첫돌에 물건을 늘어놓고 아이가 집는 것을 보는 풍습(6세기 기록부터) — zh: '抓周'
- [eastasia/early] 은 냥, 일조편법 뒤의 은 경제, 향신 — 'Tael', 'Single whip reforms', 'Landed gentry in China'
- [china 1912~1949] 중화민국, [1914~] 위안 — 'Republic of China (1912–1949)', 'Chinese yuan (1889–1948)'
- [china 1949~] 「춘절」이라는 이름은 1914년에 제안되어 1949년 뒤 자리 잡았다. 그 앞은 「설」 — 'Chinese New Year'
- [china/modern] 호구 제도(1958~), 인민공사(1958~1983), 문해율(1949년 약 20%, 1982년 약 66%) — 'Hukou system', "People's commune", 'Literacy in China'
- [korea/ancient] 삼한의 소도, 고구려 불교 수용(372), 신라의 가배(한가위) — 위키백과 '소도', 위키백과 '한국의 불교', 위키백과 '추석'
- [korea/medieval] 고려의 귀족과 양인·천민, 결, 삼베와 쌀이 화폐 구실을 했다 — 위키백과 '고려', 한국민족문화대백과사전 '경무법'(결부법 설명)
- [korea/medieval] 삼신께 아이를 비는 민속 (넓은 표현) — 위키백과 '삼신할미'
- [korea 1392~1894] 조선의 양천제(양반·상민·노비), 마지기, 서당, 장시, 사당 — 위키백과 '양천제', 위키백과 '양반', 위키백과 '노비', 위키백과 '마지기', 위키백과 '서당', 위키백과 '장시'
- [korea 1400~] 목화가 퍼져 무명을 입었다, [1500~1677] 면포가 화폐 구실을 했다, [1678~] 상평통보 — 위키백과 '목화', 위키백과 '상평통보'
- [korea 1392~] 돌잡이 — 위키백과 '돌잡이'
- [korea 1895~] 갑오개혁(1894)이 신분제와 노비를 없앴다, [1897~1910] 대한제국, [1910~1945] 조선총독부 — 위키백과 '갑오개혁', 위키백과 '대한제국', 위키백과 '조선총독부'
- [korea 1902~] 대한제국 원(1902~1910), 그 뒤 조선은행권 원 — 'Korean Empire won', 'Korean yen'
- [korea/modern] 원, 평, 추석, 돌잔치, 아파트(1970년대~), 문해율이 크게 올랐다 — 위키백과 '평 (단위)', 위키백과 '돌잔치', 'Literacy in South Korea'
- [japan/ancient] 야요이의 벼농사와 움집, 오키미(대왕), 베가 화폐 구실을 했다 — 'Yayoi period', 'Ōkimi'
- [japan/medieval] 율령의 양민·천민, [1150~] 송전을 들여와 썼다, [1185~] 무사, [1192~1867] 쇼군 — 'Ritsuryō', 'Mon (currency)', 'Samurai', 'Shogun'
- [japan 1467~1590] 전국 시대 — 'Sengoku period'
- [japan/early] 단(反), 데라코야, 사민의 신분(학계는 이상화된 틀로 본다), 백성은 마을을 떠나기 어려웠다 — 'Japanese units of measurement', 'Terakoya', 'Four divisions of society'
- [japan] 첫 생일에 한 되 떡을 지우는 풍습 (넓은 표현: 기원 연대 미상) — ja: '一升餅'
- [japan/industrial] 엔(1871~), 사민평등(1871), 화족, 학제(1872) 뒤 취학률 상승, 종두 도입(1849) — 'Japanese yen', 'Meiji Restoration', 'Kazoku', 'Education in the Empire of Japan'
- [japan] 오봉 — 'Bon Festival'

### mudbrick (서아시아·북아프리카)
- [mudbrick/forager] 나투프 사람들이 야생 보리를 거두고 가젤을 사냥했다 — 'Natufian culture'
- [mudbrick/ancient 기원전 601년 전] 무게로 단 은과 세켈 — 'Shekel'
- [mudbrick/ancient] 관개 수로, 수레바퀴, 쐐기 문자와 서기 학교, 리디아의 첫 동전(기원전 600년 무렵) — 'Mesopotamia', 'Edubba', 'Lydia'
- [mudbrick] 나쁜 눈을 막는 부적 — 'Evil eye', 'Nazar (amulet)'
- [mudbrick/medieval] 디르함, 무슬림·딤미·노예, 칼리프(632~), 술탄, 하킴과 이슬람 의학, 쿠타브, 수크 — 'Dirham', 'Dhimmi', 'Caliphate', 'Sultan', 'Medicine in the medieval Islamic world', 'Kuttab', 'Souk'
- [mudbrick/medieval] 첫 이가 나면 밀을 삶아 나누는 민속 (넓은 표현) — 'Turkish cuisine'
- [mudbrick 1347~1877] 흑사병이 오스만 땅·이집트·이라크에서 19세기까지 되풀이했다 (이집트 1844, 벵가지 1857, 이라크 1867~77) — 'Second plague pandemic'
- [mudbrick/early] 오스만 제국, 대포, 화약 — 'Ottoman Empire'
- [nile] 파라오(기원전 3100년 무렵~), 데벤, 아루라, 빵과 맥주, 아마포, 주혈흡충증(미라에서 확인) — 'Pharaoh', 'Deben (unit)', 'Aroura', 'Ancient Egyptian cuisine', 'Schistosomiasis'
- [nile 기원전 332~] 프톨레마이오스 왕조의 동전, [기원전 30~639] 로마·비잔티움, [390~] 콥트 교회 — 'Ptolemaic Kingdom', 'Roman Egypt', 'Coptic Orthodox Church'
- [nile 969~1170] 파티마 칼리프, 맘루크 술탄, [1867~1913] 케디브, [1914~1921] 술탄, [1922~1952] 왕, [1953~] 대통령, 페단, 피아스터와 파운드 — 'Fatimid Caliphate', 'Mamluk Sultanate', 'Khedivate of Egypt', 'Sultanate of Egypt', 'Kingdom of Egypt', 'Feddan', 'Egyptian pound'
- [anatolia] 히타이트·리디아 왕(~기원전 547), 아케메네스(기원전 546~334), 로마 속주(기원전 133~), 비잔티움 황제와 교회 — 'Hittites', 'Achaemenid Empire', 'Asia (Roman province)', 'Byzantine Empire'
- [anatolia 1071~] 만지케르트 뒤 셀주크·오스만 술탄, 악체(14세기~), 쿠루쉬(1688~), 라야, 길드(에스나프) — 'Battle of Manzikert', 'Sultanate of Rum', 'Akçe', 'Kuruş', 'Reaya', 'Lonca'
- [anatolia 1923~] 공화국, 리라, 문해율 상승 — 'Turkey', 'Turkish lira', 'Education in Turkey'
- [iran] 아케메네스(기원전 550~)는 불 제단, 확실한 불의 신전은 사산 조(224~651)부터 — 'Fire temple', 'Encyclopaedia Iranica: Fire altars'
- [iran] 아케메네스·사산의 샤(기원전 550~650), 노루즈, 사파비 샤(1501~), 리알(1932~), 1979년 혁명 — 'Achaemenid Empire', 'Fire temple', 'Nowruz', 'Safavid Iran', 'Iranian rial', 'Iranian Revolution'

### africa (사하라 이남 아프리카)
- [africa/ancient] 수수, 철 제련(기원전 500년 무렵~), 나무껍질 천, 성년식 — 'Sorghum', 'Iron metallurgy in Africa', 'Barkcloth', 'Initiation'
- [africa/medieval] 말리·짐바브웨 같은 왕국, 이그보우쿠의 청동 주조, 아프리카 안의 노예제 — 'Mali Empire', 'Great Zimbabwe', 'Igbo-Ukwu', 'Slavery in Africa'
- [africa/early] 황열, 수면병 — 'Yellow fever', 'African trypanosomiasis'
- [africa 1885~1959] 아프리카 분할과 식민 통치, 선교 학교, 실링 — 'Scramble for Africa', 'East African shilling'
- [africa/modern] 1960년 무렵의 독립, 옥수수죽, 에이즈(1980년대~) — 'Decolonisation of Africa', 'Ugali', 'HIV/AIDS in Africa'
- [west_africa] 얌, 푸푸, 얌 축제, 조개 화폐(14세기 기록), 마닐라(15세기 말~1949) — 'Yam (vegetable)', 'Fufu', 'New Yam Festival', 'Cowrie', 'Manilla (money)'
- [west_africa 1200~1896] 땅이 「나이지리아·가나 일대」라 요루바·에도(베냉)·하우사·아칸·사헬의 칭호가 섞인다. 그래서 통치자는 넓게 「왕」, 신분제는 「왕국과 길드」, 장인은 「장인 · 왕의 길드」로 쓴다. 베냉 제국 전성기(1440~1600)의 장인 줄에만 「장인 · 오바의 길드」를 남긴다(설계 2.3 예). 1897년 영국 원정 — 'Kingdom of Benin', 'Oba of Benin', 'Benin Bronzes', 'Sokoto Caliphate', 'Ashanti Empire', 'Benin Expedition of 1897'
- [west_africa] 영국령 서아프리카 파운드·실링(1913~), 나이라(1973~) — 'British West African pound', 'Nigerian naira'

### americas (아메리카)
- [americas/forager] 창던지개. 활은 아메리카에 늦게 퍼졌다 — 'Spear-thrower', 'Bow and arrow'
- [americas/ancient] 카사바와 카사바 빵, 해먹, 접촉 전에도 결핵이 있었다. 학질·황열·천연두는 접촉 뒤에 왔다 — 'Cassava', 'Cassava-based dishes', 'Hammock', 'Columbian exchange'
- [americas/early] 레알, 식민지 카스타, 부왕령, 대부모(콤파드라스고), 쿠란데로, 사탕수수 농장과 노예제 — 'Spanish real', 'Casta', 'Viceroyalty of New Spain', 'Compadrazgo', 'Curandero', 'Sugar plantations in the Caribbean'
- [americas/industrial] 독립 전쟁(1810~1825), 페소, 아시엔다와 페온, 노예제 폐지 연대 — 'Spanish American wars of independence', 'Spanish dollar', 'Hacienda', 'Peonage', 'Abolition of slavery timeline'
- [americas/modern] 카니발, 쌀과 콩 — 'Carnival', 'Rice and beans'
- [mesoamerica 250~] 카카오 콩이 화폐로 쓰인 기록은 마야 고전기와 접촉기다. 그 앞은 조개 구슬 (넓은 표현), 그림 글자는 기원전 300년 무렵부터 — 'History of chocolate', 'Maya script'
- [mesoamerica] 옥수수·토르티야·밀파, 칠면조, 피라미드 신전(기원전 1000년 무렵~), 날 이름 달력 — 'Milpa', 'Tortilla', 'History of chocolate', 'Domestic turkey', 'Mesoamerican pyramids', 'Tonalpohualli'
- [mesoamerica 1428~1521] 틀라토아니, 티앙기스, 텔포치칼리, 피필틴·마세우알틴·틀라코틀리 — 'Tlatoani', 'Tianguis', 'Telpochcalli', 'Aztec society'
- [mesoamerica] 죽은 자의 날, 에히도(1917 헌법~), 피냐타 — 'Day of the Dead', 'Ejido', 'Piñata'
- [andes] 감자와 추뇨, 라마와 알파카, 계단밭, 와카, 아이유, 미타 — 'Chuño', 'Llama', 'Inca agriculture', 'Huaca', 'Ayllu', "Mit'a"
- [andes 1438~1532] 사파 잉카, 야나, 키푸, 인티 라이미(1944년 재현) — 'Sapa Inca', 'Yanakuna', 'Quipu', 'Inti Raymi'
- [andes] 첫 머리 깎기 잔치 (넓은 표현: 루투치쿠이, 나이는 땅마다 다르다) — 'Inca society'
- [andes] 식민지 미타 부역(포토시), 솔(1863~) — 'Potosí', 'Peruvian sol'
- [north_america/ancient·medieval] 호박 같은 동부 작물, 흙 둔덕, 미시시피 문화의 옥수수, 요람판, 호미니, 그린 콘 의식, 조개 구슬 — 'Eastern Agricultural Complex', 'Mound Builders', 'Mississippian culture', 'Cradleboard', 'Hominy', 'Green Corn Ceremony', 'Wampum'
- [north_america 1700~1799] 식민지 신분과 노예제, 계약 하인, 실링, 에이커, 마을 학교 — 'Indentured servitude in British America', 'Slavery in the colonial history of the United States'
- [north_america 1776~] 대륙회의, [1789~] 대통령, 달러(1792~), 독립기념일 — 'Continental Congress', 'President of the United States', 'Coinage Act of 1792', 'Independence Day (United States)'
- [north_america 1800~1865] 노예제, 1865년 폐지 — 'Thirteenth Amendment to the United States Constitution'
- [north_america/modern] 추수감사절(1863년 국경일) — 'Thanksgiving (United States)'
- [brazil] 카사바 가루, 헤이스, 크루제이루(1942~), 헤알(1994~), 브라질 제국(1822~1889), 노예제 폐지(1888) — 'Farofa', 'Brazilian real (old)', 'Brazilian cruzeiro', 'Brazilian real', 'Empire of Brazil', 'Lei Áurea'
- [la_plata] 부에노스아이레스 재건(1580), 소고기와 아사도 — 'Buenos Aires', 'Asado'
- [caribbean] 사탕수수 농장 노예제, 영국령 해방(1834~1838) — 'Sugar plantations in the Caribbean', 'Slavery Abolition Act 1833'

### seaoc (동남아시아·오세아니아)
- [seaoc/ancient] 아웃리거 카누, 동선 청동 북(기원전 600년 무렵~), 고상 가옥, 빚에 묶인 종 — 'Outrigger boat', 'Dong Son drum', 'Stilt house', 'Debt bondage'
- [seaoc/medieval] 인도화된 왕국과 사원, 계단식 논, 중국 동전이 섬들에서 쓰였다 — 'Indianized kingdom', 'Rice-terrace', 'Cash (Chinese coin)'
- [seaoc 1850~1945] 식민 통치 — 'Dutch East Indies', 'British Malaya', 'French Indochina'
- [indonesia·malay] 이슬람화(13~16세기), 술탄, 르바란, 파사르, 두쿤, 바틱, 휠던, 루피아, 해협 달러, 링깃 — 'Spread of Islam in Indonesia', 'Malacca Sultanate', 'Eid al-Fitr', 'Dukun', 'Batik', 'Netherlands Indies gulden', 'Indonesian rupiah', 'Straits dollar', 'Malaysian ringgit'
- [indonesia·malay] 아이가 처음 땅을 밟는 의례(자바의 테닥 시텐, 말레이의 제작 타나) (넓은 표현) — 'Tedak siten'
- [philippines] 다투, 아니토, 스페인 지배(1565~), 피에스타, 아르브랄리오, 페소 — 'Datu', 'Anito', 'Spanish East Indies', 'Albularyo', 'Philippine peso'
- [mainland_sea] 상좌부 불교 사원과 절 학교, 새해 물 축제 — 'Theravada', 'Songkran (Thailand)', 'Thingyan'
- [australia] 부메랑, 불 놓기 농사, 1788년 죄수 식민지, 목장주, 연방(1901), 달러(1966) — 'Boomerang', 'Fire-stick farming', 'Convicts in Australia', 'Squatting (Australian history)', 'Federation of Australia', 'Australian dollar'
- [pacific] 통치자는 넓게 「족장」(빅맨은 멜라네시아 개념, 폴리네시아는 세습 족장). 매인 집안도 동남아식 「빚종」 대신 「족장의 식구」로 쓴다. 금속 연장은 19세기 교역으로 들어왔다 — 'Big man (anthropology)', 'Polynesian chiefs'
- [pacific] 타로, 조개 화폐, 타파 천, 고구마가 뉴기니에 퍼졌다, 키나(1975~) — 'Taro', 'Big man (anthropology)', 'Shell money', 'Tapa cloth', 'Sweet potato', 'Papua New Guinean kina'

### steppe (초원)
- [steppe/ancient] 신타시타의 전차(기원전 2000년 무렵), 복합궁, 펠트, 오보, 초원의 흑사병 균(청동기 시대 고DNA) — 'Sintashta culture', 'Composite bow', 'Felt', 'Ovoo', 'Yersinia pestis'
- [steppe 기원전 209~215] 흉노의 선우. 「칸」 칭호는 3세기 선비·유연 무렵부터라 그 앞 신분제는 「씨족과 족장」·「씨족과 선우」로 쓴다 — 'Chanyu', 'Khan (title)', 'Xianbei', 'Rouran Khaganate'
- [steppe/medieval] 등자, [1206~] 몽골 제국과 노얀, 은 덩이, 나담 — 'Stirrup', 'Mongol Empire', 'Noyan', 'Naadam'
- [steppe/early] 티베트 불교(1570년대~), 라마 의사, 벽돌차 화폐, [1691~1911] 청의 기 제도 — 'Buddhism in Mongolia', 'Traditional Tibetan medicine', 'Tea brick', 'Mongolia under Qing rule'
- [steppe 1924~1990] 몽골 인민 공화국과 협동조합, 투그릭(1925~) — "Mongolian People's Republic", 'Mongolian tögrög'
- [steppe(중앙아시아)] 오아시스 도시, 소그드의 불의 신전, 사만 왕조 디르함, 마드라사, 탕가, 러시아 투르키스탄(1867~), 소비에트 중앙아시아, 플로프 — 'Sogdia', 'Samanid Empire', 'Madrasa', 'Tanga (coin)', 'Russian Turkestan', 'Soviet Central Asia', 'Pilaf'

### 사건 수정 (EVENT_MODS, events.js 사건 id)
- [drought42] 4.2ka 가뭄과 아카드 붕괴 무렵의 혼란: 값 ↑ — '4.2-kiloyear event'
- [bronze] 청동기 말 붕괴: 전쟁 — 'Late Bronze Age collapse'
- [winter536] 536년 화산 겨울: 흉작, 값 ↑ — 'Volcanic winter of 536'
- [justinian] 유스티니아누스 역병: 흑사병 균 — 'Plague of Justinian'
- [blackdeath] 흑사병 동안과 그 뒤 한 세기 동안 일손이 모자라 품삯이 올랐다 — 'Consequences of the Black Death'
- [contact] 접촉 뒤의 천연두·홍역과 정복 전쟁 — 'Columbian exchange', 'Spanish conquest of the Aztec Empire'
- [newcrops] 아메리카 작물이 퍼져 먹을 것이 늘었다: 값 조금 ↓ — 'Columbian exchange'
- [imjin] 임진왜란: 땅이 전장 — 위키백과 '임진왜란'
- [thirty] 30년 전쟁: 땅이 전장, 흑사병과 발진티푸스가 돌았다 — "Thirty Years' War"
- [mingqing] 명·청 교체 전란 — 'Transition from Ming to Qing'
- [slavetrade] 노예사냥 전쟁 — 'Atlantic slave trade'
- [nosummer] 여름이 없던 해: 곡식값 폭등 — 'Year Without a Summer'
- [famine1876] 1876~1878년 대기근과 함께 돈 콜레라 — 'Great Famine of 1876–1878'
- [ww1] 서부 전선(프랑스)·동부 전선·이탈리아 전선·발칸은 땅이 전장 — 'Western Front (World War I)', 'Eastern Front (World War I)', 'Italian front (World War I)'
- [flu1918] 1918년 독감 — 'Spanish flu'
- [ww2] 2차 세계대전 — 'World War II'
- [bengal] 1943년 벵골 기근: 쌀값 폭등, 콜레라·학질 — 'Bengal famine of 1943'
- [koreanwar] 한국전쟁 — 위키백과 '한국 전쟁'
- [greatleap] 대약진 기근 — 'Great Chinese Famine'

## 수정 1차 (검토 2026-10-21, task-2-review.md)

### 농사가 닿은 해 (FARM_FROM)
- [FARM_FROM] 땅마다 농사·목축이 자리 잡은 해. 이 해 전에는 고대·중세·근세 묶음이라도 수렵 무리로 쓴다. 값은 lands.js 옛 표(Task 1 전)의 마을 시작 해를 따르고, 아래 몇 개를 고쳤다 (모두 넓은 어림) — 'Neolithic Revolution'
- [FARM_FROM 고친 것] 몽골 −3000(초원 목축), 뉴기니(pacific) −5000(쿡 습지 농경), 카리브 −500(살라도이드 토기·농경), 북아메리카 −1000(동부 작물과 우드랜드 시대), 라플라타 1580(부에노스아이레스 재건 전 팜파스는 수렵), 오스트레일리아 1788 — 'Kuk Swamp', 'Saladoid', 'Eastern Agricultural Complex', 'Woodland period', 'Pampas'
- [japan −900 전] 조몬: 도토리·움집·조몬 토기·돌 둘레(환상 열석). 벼농사는 규슈 북부 기원전 900~800년 무렵부터 — 'Jōmon period', 'Stone circles in Japan', 'Yayoi period'

### 고대 묶음의 시대 계단
- [europe] 청동기는 기원전 2200년 무렵, 철기는 기원전 800년 무렵부터. 신석기 성스러운 샘·아마포 — 'Bronze Age Europe', 'Iron Age Europe', 'Linen'
- [mudbrick] 선토기 신석기의 맷돌·흑요석, 에리두 신전(기원전 5400년 무렵), 수레바퀴(기원전 3500년 무렵), 쐐기 문자(기원전 3200년 무렵), 수메르 왕(기원전 2900년 무렵), 은을 달아 쓰는 화폐(기원전 3000년 무렵), 철기(기원전 1200년 무렵) — 'Pre-Pottery Neolithic B', 'Eridu', 'Wheel', 'Cuneiform', 'Early Dynastic Period (Mesopotamia)', 'Shekel', 'Iron Age'
- [mudbrick 600~799] 종이는 8세기 말(바그다드 794), 풍차는 9세기 무렵부터 — 'History of paper', 'Windmill'
- [mudbrick 600~639] 디르함은 7세기 중엽 아랍·사산 주화부터 — 'Dirham'
- [nile −3100 전] 파라오 전의 족장 — 'Predynastic Egypt'
- [nile −2700~] 이집트 의사(고왕국부터) — 'Ancient Egyptian medicine'
- [anatolia −2000~−547] 아시리아 상인 식민지 시기의 도시 왕과 히타이트 왕 — 'Hittites', 'Kültepe'
- [southasia −2600~−1201] 구리·청동 연장과 쟁기(칼리방간 밭고랑), 철은 기원전 1200년 무렵부터 — 'Indus Valley Civilisation', 'Kalibangan', 'Iron Age in India'
- [southasia −2000 전] 남아시아 한센병의 가장 이른 뼈 증거는 기원전 2000년 무렵 — 'History of leprosy'
- [southasia −2000~] 갠지스 쪽 벼농사 (넓은 표현) — 'History of rice cultivation'
- [indus −2600~−1900] 하라파의 구운 벽돌·돌 도장·소 수레 — 'Indus Valley Civilisation'
- [eastasia] 상나라 청동기(기원전 1600년 무렵), 중국 철기(기원전 600~500년 무렵), 목판 인쇄(700년 무렵), 활자(1040년대), 항해 나침반(11세기) — 'Shang dynasty', 'History of metallurgy in China', 'Woodblock printing', 'Movable type', 'Compass'
- [korea] 빗살무늬 토기의 신석기, 청동기와 고인돌(기원전 1000년 무렵~), 철기(기원전 300년 무렵~) — 위키백과 '빗살무늬 토기', 위키백과 '고인돌', 'Mumun pottery period'
- [japan] 야요이의 높은 곳간·반달 돌칼, 철기(기원전 300년 무렵~), 고분 시대(250~), 신사 건물은 고분 시대 뒤 (넓은 표현) — 'Yayoi period', 'Kofun period', 'Shinto shrine'
- [africa] 사하라 이남 철기는 기원전 800~500년 무렵부터 (기원전 600으로 둠) — 'Iron metallurgy in Africa', 'Nok culture'
- [seaoc] 아웃리거 카누(오스트로네시아), 동선 청동 북·철기는 기원전 600년 무렵부터 — 'Austronesian peoples', 'Dong Son culture'
- [steppe] 소 수레(얌나야, 기원전 3000년 무렵), 전차(신타시타, 기원전 2000년 무렵), 철기와 기마 궁수(기원전 800년 무렵~), 비단 교역(한나라, 기원전 200년 무렵~) — 'Yamnaya culture', 'Sintashta culture', 'Scythians', 'Xiongnu'
- [steppe(중앙아시아) 900~] 마드라사는 10~11세기부터, 그 앞은 쿠타브 — 'Madrasa'
- [mesoamerica −1000~−301] 올멕 시기의 옥 — 'Olmecs'
- [andes −1000~] 계단밭 (넓은 표현), 식민지의 포토시 은광(1545~) — 'Andenes', 'Potosí'

### 산업기 물건 계단
- [물건] 방적기 1769, 조면기 1793, 증기선 1807, 철도 1825~1830, 전신 1840년대, 재봉틀 1850년대, 전기 1880년대. 땅마다 철도가 들어온 해(인도 1853, 이집트 1854, 일본 1872, 아프리카 1890년대)에 맞춰 물건 목록을 바꾼다 — 'Spinning frame', 'Cotton gin', 'Steamboat', 'History of rail transport', 'Electrical telegraph', 'Sewing machine'

### 전쟁 수준
- [ww1] 스페인·포르투갈(1916년 참전 전)·스웨덴·노르웨이·덴마크는 중립 — 'Neutral powers during World War I'
- [ww2] 스페인은 비교전국(1940~43) 뒤 중립, 포르투갈·스웨덴 중립, 노르웨이·덴마크 점령, 핀란드 전쟁. 오스트레일리아 본토와 식민지 조선은 전장이 아니다(동원·공습은 있었다) — 'Spain during World War II', 'Neutral powers during World War II', 'Korea under Japanese rule'
- [maghreb 1940~1943 · nile 1940~1942] 북아프리카 전선 — 'North African campaign', 'Western Desert campaign'

### 아프리카
- [congo] 콩고 자유국(1885~1908), 벨기에령 콩고(1908~1960), 콩고 프랑(1887~), 자이르(1967~1997) — 'Congo Free State', 'Belgian Congo', 'Congolese franc', 'Zairean zaire'
- [east_africa 1885~1959] 에티오피아는 분할기에 식민지가 되지 않았고 1936~41년 이탈리아 점령만 있었다 — 'Italian occupation of Ethiopia', 'Scramble for Africa'
- [south_africa] 남아프리카 연방(1910), 원주민 토지법(1913), 아파르트헤이트(1948~1994)와 통행법(1986년 폐지, 그 뒤 1993년까지는 「인종 분류에 묶임」만), 홈랜드 시민법(1970), 랜드(1961), 1994년 첫 보통 선거 — 'Union of South Africa', 'Natives Land Act, 1913', 'Apartheid', 'Pass laws', 'Bantu Homelands Citizenship Act, 1970', 'South African rand', '1994 South African general election'

### 아메리카
- [north_america 1500~1699] 원주민 마을(활·돌괭이·토기). 정복 전쟁은 메소아메리카·안데스 일이다. 식민지 낱말은 1700년부터 (넓은 표현: 동부 해안 정착은 1607년부터지만 대륙 전체로는 원주민이 다수였다) — 'Jamestown, Virginia', 'Population history of Indigenous peoples of the Americas'
- [caribbean 1520~] 히스파니올라의 첫 설탕 공장은 1516년 무렵. 그 앞은 타이노의 땅 — 'Sugar plantations in the Caribbean', 'Taíno'

### 유럽 20세기
- [iberia] 스페인 제2공화국(1931~1939), 프랑코 독재(1939~1975, 포르투갈 신국가 1933~1974와 같은 시기) — 'Second Spanish Republic', 'Francoist Spain', 'Estado Novo (Portugal)'
- [italy 1946~] 이탈리아 공화국 — 'Birth of the Italian Republic'

### 남아시아
- [bengal 1600~] 동벵골 무슬림 집안에는 자티 이름 대신 「농민 집」 같은 중립 이름. 조개 화폐는 1830년대까지 (넓은 표현) — 'Islam in Bangladesh', 'Cowrie'

## 사건 (events.js, Task 5)

사건 id 마다 한 줄이다. 형식은 `- [id 해~해 · 땅] 사실 — 출처`이다. 끝의 「확인함」은 2026-10-21에 웹 검색(standard)으로 연대와 장소를 다시 맞춰 본 줄이다. 「확인함」이 없는 줄은 위키백과 문서 제목을 출처로 둔 일반 연표 지식이다.
- 위험률(hazard)은 「게임용 어림」이다. 땅 하나가 넓은 지역(인도 땅·중국 땅·동유럽 평원 …)이면 한 고장만 겪은 일을 그 땅 사람 전체로 나눠 낮게 잡았다.
- 위 「사건 수정 (EVENT_MODS …)」의 값은 이제 events.js 의 사건 필드(war·warAt·warName·econ·disease·after)에 있다. 값과 출처는 그대로다.
- 사람 이름은 쓰지 않는다. 통치자는 칭호(왕·술탄·대칸·임금·부왕·오바)로만 쓴다.
- 사건 이름 방침 (수정 1차): 사람 이름이 그대로 든 이름은 바꾼다(「유스티니아누스 역병」 → 「541년 역병」). 「안사의 난」처럼 두 사람의 성을 한 자씩 딴 표준 역사 용어는 그대로 둔다. 출처 줄의 위키백과 제목은 출처라서 그대로 적는다.

### 처음 24개
- [drought42 −2200~−2100 · 서아시아·남아시아] 4.2ka 가뭄 — '4.2-kiloyear event'
- [bronze −1200~−1150 · 서아시아·유럽] 청동기 말 붕괴 — 'Late Bronze Age collapse'
- [winter536 536~541 · 유럽·서아시아·동아시아] 536년 화산 겨울 — 'Volcanic winter of 536'
- [justinian 541~549 · 유럽·서아시아] 페스트균에 의한 541년 역병(게임 이름은 「541년 역병」, 사람 이름을 빼려고 바꿈) — 'Plague of Justinian'
- [blackdeath 1347~1351 · 유럽·서아시아] 흑사병과 그 뒤 한 세기의 품삯 상승 — 'Black Death', 'Consequences of the Black Death'
- [contact 1519~1600 · 아메리카] 천연두·홍역과 정복 전쟁 — 'Columbian exchange', 'Spanish conquest of the Aztec Empire'
- [newcrops 1550~1700 · 유럽·동아시아·남아시아·아프리카] 아메리카 작물의 전파 — 'Columbian exchange'
- [imjin 1592~1598 · 한반도] 임진왜란 — 위키백과 '임진왜란'
- [thirty 1618~1648 · 독일 땅] 30년 전쟁 — "Thirty Years' War"
- [mingqing 1630~1662 · 중국 땅] 명·청 교체 — 'Transition from Ming to Qing'
- [slavetrade 1600~1850 · 서아프리카·콩고] 대서양 노예무역 — 'Atlantic slave trade'
- [nosummer 1816~1817 · 유럽·북아메리카] 여름이 없던 해 — 'Year Without a Summer'
- [famine1876 1876~1879 · 인도·중국] 1876~1879년 대기근 — 'Great Famine of 1876–1878', 'Northern Chinese Famine of 1876–1879'
- [ww1 1914~1918 · 유럽] 1차 세계대전과 중립국 — 'World War I', 'Neutral powers during World War I'
- [flu1918 1918~1920 · 세계] 1918년 독감 — 'Spanish flu'
- [ww2 1939~1945 · 유럽·동아시아·동남아] 2차 세계대전 — 'World War II'
- [bengal 1943~1944 · 벵골·인도] 1943년 벵골 기근 — 'Bengal famine of 1943'
- [koreanwar 1950~1953 · 한반도] 한국전쟁 — 위키백과 '한국 전쟁'
- [greatleap 1959~1961 · 중국 땅] 대약진 기근 — 'Great Chinese Famine'
- [writing −3200~−2000 · 메소포타미아] 쐐기 문자 — 'Cuneiform'
- [printing 1450~1600 · 유럽] 활판 인쇄(마인츠, 1450년 무렵) — 'Printing press', 'Global spread of the printing press'
- [factories 1780~1900 · 유럽] 산업혁명 — 'Industrial Revolution'
- [vaccine 1800~1900 · 유럽] 1796년 우두 종두와 그 전파 — 'Smallpox vaccine'
- [antibiotics 1945~1965 · 세계] 페니실린(1928년 발견, 1940년대 보급) — 'History of penicillin'

### 남아시아
- [harappa_trade −2600~−1900 · 인더스·인도] 인더스 도시와 메소포타미아(멜루하)의 교역. 메소포타미아에서 인더스 도장과 저울추가 나왔다 — 'Meluhha', 'Indus–Mesopotamia relations' (확인함)
- [mahajanapada −600~−321 · 인도·벵골] 갠지스 강가의 「두 번째 도시화」와 도장 찍은 은화(타각 화폐) — 'Mahajanapadas', 'Punch-marked coins' (확인함)
- [macedon −334~−323 · 아나톨리아·메소포타미아·나일·이란·인더스] 마케도니아 원정. 인더스에는 기원전 327~325년 — 'Wars of Alexander the Great', 'Indian campaign of Alexander the Great' (사건 글에는 이름을 쓰지 않음)
- [kalinga −262~−261 · 인도] 칼링가 전쟁(기원전 261년 무렵, 13번 바위 칙령에 기록) — 'Kalinga War', 'Major Rock Edicts' (확인함)
- [dhamma −260~−232 · 인도·인더스·벵골] 마우리아 왕의 다르마 칙령(바위·돌기둥). 재위는 기원전 268~232년 무렵 — 'Major Rock Edicts', 'Edicts of Ashoka' (확인함)
- [lanka_buddhism −250~−210 · 스리랑카] 기원전 3세기 중엽 북인도 승려들이 스리랑카에 불교를 전했다 — 'Buddhism in Sri Lanka', 'Mahavamsa'
- [roman_pepper −30~250 · 인도·스리랑카] 계절풍 항로와 무지리스 후추 무역, 로마 금화 — 'Indo-Roman trade relations', 'Muziris papyrus', 'Periplus of the Erythraean Sea' (확인함)
- [gupta 320~550 · 인도·벵골] 굽타 시대의 천문학·수학, 499년 무렵의 천문서와 자리 값 셈(영 기호는 박샬리 사본의 일이라 카드에 쓰지 않음) — 'Gupta Empire', 'Aryabhatiya', 'Hindu–Arabic numeral system' (499년 천문서는 확인함, 320~550년은 일반 연표)
- [ghazni 1000~1027 · 인더스·인도] 가즈니 왕조의 약탈 원정 약 17번(1000~1027년), 1025년 솜나트 — 'Ghaznavids', 'Mahmud of Ghazni' (확인함)
- [chola_lanka 993~1070 · 스리랑카] 촐라의 아누라다푸라 점령(993년)과 1070년 신할라 왕조의 회복 — 'Chola conquest of Anuradhapura', 'Polonnaruwa'
- [delhi_sultanate 1206~1290 · 인도·인더스·벵골] 1206년 델리 술탄국(맘루크 왕조), 벵골 정복(1204년 무렵). 땅을 재서 매기는 일은 1296년 뒤라 카드는 「거둘 몫」으로 씀 — 'Delhi Sultanate', 'Mamluk dynasty (Delhi)', 'Bengal Sultanate' (확인함)
- [mughal 1556~1605 · 인도·인더스] 1580년 무렵의 자브트(밭을 재고 돈으로 매기는 세금). 벵골(1576년 정복)에는 자브트가 시행되지 않아 이 사건에서 뺐다 — 'Zabt', 'Mughal Empire', Banglapedia 'Akbar' (확인함)
- [deccan1630 1630~1632 · 인도] 데칸·구자라트 대기근(가뭄과 메뚜기, 수백만 명 사망 추정) — 'Deccan famine of 1630–1632' (확인함)
- [gorkha 1743~1775 · 히말라야] 고르카 왕국의 네팔 통일 전쟁 — 'Unification of Nepal'
- [bengal1770 1769~1773 · 벵골] 흉작과 천연두, 동인도 회사의 세금(사망 추정 120만~1천만) — 'Great Bengal famine of 1770' (확인함)
- [cholera1817 1817~1824 · 벵골·인도·동남아·중국·메소포타미아·이란] 갠지스 하구(제소르)에서 시작한 콜레라 첫 대유행 — '1817–1824 cholera pandemic' (확인함)
- [sepoy1857 1857~1858 · 인도] 1857년 5월 10일 메루트 봉기, 1858년 회사 통치가 끝났다 — 'Indian Rebellion of 1857', 'Timeline of the Indian Rebellion of 1857' (확인함)
- [plague1896 1896~1918 · 인도·인더스·벵골] 1896년 봄베이에서 시작한 3차 페스트 대유행, 1918년까지 약 1천만 명 사망 — 'Bombay plague epidemic', 'Third plague pandemic' (확인함)
- [partition 1947~1948 · 인도·인더스·벵골] 인도 분할. 1천만~2천만 명이 옮겨 갔고, 사망은 수십만~200만으로 추정 — 'Partition of India' (확인함)
- [green_revolution 1965~1985 · 인도·인더스·필리핀·인도네시아] 1966년 다수확 품종 계획, 멕시코 밀과 IR8 벼 — 'Green Revolution in India', 'IR8' (확인함)
- [bangladesh1971 1971~1972 · 벵골] 1971년 3월 26일~12월 16일 방글라데시 독립 전쟁 — 'Bangladesh Liberation War' (확인함)
- [lanka_civilwar 1983~2009 · 스리랑카] 스리랑카 내전 — 'Sri Lankan Civil War'

### 동아시아
- [oracle_bones −1250~−1046 · 중국 땅] 상나라 후기의 갑골 점과 갑골문 — 'Oracle bone', 'Oracle bone script'
- [iron_plow −500~−221 · 중국 땅] 기원전 5세기 무렵부터 주철 보습과 괭이가 퍼졌다 — 'History of metallurgy in China', 'Plough' (확인함)
- [qin −230~−207 · 중국 땅] 진의 통일 전쟁(기원전 230~221년), 도량형과 화폐 통일, 큰 공사 — "Qin's wars of unification", 'Qin dynasty', 'Banliang' (확인함)
- [xiongnu −209~−60 · 몽골 초원·중국 땅] 흉노 연맹(기원전 209년~)과 한·흉노 전쟁 — 'Xiongnu', 'Han–Xiongnu War'
- [silk_road −130~200 · 중국·몽골·중앙아시아·이란·메소포타미아] 한나라 사신의 서역 길(기원전 138~126년)과 비단길 — 'Silk Road', 'Zhang Qian' (확인함, 사건 글에는 이름을 쓰지 않음)
- [yellow_turban 184~205 · 중국 땅] 황건의 난(184년). 205년까지 잔존 세력을 누르고 삼국 시대로 이어졌다 — 'Yellow Turban Rebellion' (확인함)
- [asuka 538~645 · 일본 열도] 백제에서 불교가 전해졌다(538년설) — 'Buddhism in Japan', 'Asuka period'
- [grand_canal 605~611 · 중국 땅] 수나라 대운하(605년 통제거~610년 무렵) — 'Grand Canal (China)', 'Sui dynasty' (확인함)
- [ritsuryo 646~710 · 일본 열도] 다이카 개신(645·646년 조서), 호적과 반전, 다이호 율령(701년) — 'Taika Reform', 'Taihō Code' (확인함)
- [silla_unify 660~676 · 한반도] 백제 멸망(660년)·고구려 멸망(668년)·나당 전쟁 끝(676년) — 'Unified Silla', 'Silla–Tang War' (확인함)
- [smallpox735 735~737 · 일본 열도] 덴표 천연두. 인구 약 3분의 1 사망 추정, 규슈 다자이후에서 시작. 일손이 모자란 뒤 743년 간전영년사재법 — '735–737 Japanese smallpox epidemic', 'Konden Einen Shizai Hō' (확인함)
- [anlushan 755~763 · 중국 땅] 안사의 난, 두 도읍 함락과 남쪽 이주 — 'An Lushan rebellion', 'Tang dynasty' (확인함)
- [champa_rice 1012~1100 · 중국 땅] 1012년 가뭄 때 참파 볍씨를 나눠 줬다. 일찍 여물고 가뭄에 강하다 — 'Champa rice' (확인함)
- [song_print 1040~1127 · 중국 땅] 1040년대 흙 활자 인쇄, 과거 응시자 증가 — 'Movable type', 'Imperial examination' (확인함)
- [song_gunpowder 1044~1127 · 중국 땅] 1044년 병서(무경총요)의 화약 제조법 — 'Wujing Zongyao', 'Gunpowder' (확인함)
- [mongol_jin 1211~1234 · 중국 땅] 몽골의 금나라 정복, 1215년 중도 함락 — 'Mongol conquest of the Jin dynasty', 'Siege of Zhongdu' (확인함)
- [mongol_korea 1231~1259 · 한반도] 몽골의 고려 침입, 1232년 강화 천도, 1259년 강화 — 'Mongol invasions of Korea', 'Goryeo under Mongol rule' (확인함)
- [mongol_japan 1274~1281 · 일본 열도] 1274년과 1281년 몽골·고려 연합군의 일본 원정 — 'Mongol invasions of Japan'
- [yuan_ming 1351~1368 · 중국 땅] 홍건적 봉기(황하 둑 공사 노역이 계기)와 1368년 명 건국, 원 조정은 북으로 — 'Red Turban Rebellions', 'Northern Yuan' (확인함)
- [joseon_found 1392~1400 · 한반도] 조선 건국(1392년), 한양 천도(1394년), 과전법(1391년) — 'Joseon', 위키백과 '과전법' (1392·1394년은 일반 연표)
- [ming_voyages 1405~1433 · 중국·말레이·인도네시아·스리랑카·인도·아라비아·동아프리카] 명나라 보물선 함대 일곱 번(캘리컷·호르무즈·말린디) — 'Ming treasure voyages' (확인함)
- [hangul 1446~1500 · 한반도] 훈민정음 창제(1443년)·반포(1446년), 해례의 「슬기로운 이는 아침나절」 — 'Hunminjeongeum', 'History of Hangul' (확인함)
- [sengoku 1467~1590 · 일본 열도] 오닌의 난(1467년)으로 시작한 전국 시대, 1590년 무렵 통일 — 'Sengoku period', 'Ōnin War' (확인함)
- [nanban 1543~1639 · 일본 열도] 1543년 다네가시마의 포르투갈인과 화승총, 1639년 포르투갈 배 금지 — 'Nanban trade', 'Tanegashima (gun)', 'Sakoku' (1543년은 확인함)
- [daedong 1608~1708 · 한반도] 대동법. 1608년 경기도에서 시작해 1708년 전국 — 'Daedong law', 위키백과 '대동법' (확인함)
- [byeongja 1636~1637 · 한반도] 병자호란, 남한산성, 1637년 1월 항복과 포로 몸값 — 'Qing invasion of Joseon' (확인함)
- [gyeongsin 1670~1671 · 한반도] 경신 대기근(냉해·우박·우역·돌림병, 100만 명 사망 추정) — 'Kyŏngsin Famine', 위키백과 '경신 대기근' (확인함)
- [opium 1839~1842 · 중국 땅] 1차 아편 전쟁과 난징 조약(홍콩 할양, 다섯 항구) — 'First Opium War', 'Treaty of Nanking' (확인함)
- [taiping 1850~1864 · 중국 땅] 태평천국 운동(사망 2천만~3천만 추정) — 'Taiping Rebellion' (확인함)
- [meiji 1868~1890 · 일본 열도] 메이지 유신, 사족 폐지·징병·학제 — 'Meiji Restoration', 'Abolition of the han system'
- [korea_colony 1910~1945 · 한반도] 한국 병합(1910년)과 일제 강점기. 카드는 없다 — 'Korea under Japanese rule' (확인함)
- [korea_land_survey 1910~1918 · 한반도] 토지 조사 사업. 신고하지 못한 땅이 총독부로 넘어가기도 했다 — 'Korea under Japanese rule', 'Oriental Development Company', 위키백과 '토지 조사 사업' (확인함)
- [cultural_rev 1966~1976 · 중국 땅] 문화 대혁명과 홍위병 — 'Cultural Revolution', 'Red Guards'
- [reform_china 1978~1992 · 중국 땅] 개혁 개방과 가족 단위 생산 책임제 — 'Chinese economic reform', 'Household responsibility system'

### 서아시아·북아프리카 (mudbrick)
- [pyramids −2600~−2500 · 나일] 기자 피라미드(기원전 2600~2500년 무렵)와 일꾼 마을 헤이트 엘구라브 — 'Giza pyramid complex', 'Heit el-Ghurab' (확인함)
- [law_stele −1755~−1700 · 메소포타미아] 함무라비 법전 돌기둥(기원전 1754년 무렵) — 'Code of Hammurabi' (확인함, 사건 글에는 이름을 쓰지 않음)
- [antonine 165~180 · 로마 제국 땅] 안토니누스 역병(천연두로 추정, 500만~1천만 사망) — 'Antonine Plague' (확인함)
- [arab_conquest 633~651 · 메소포타미아·이란·나일] 아랍의 사산 왕조 정복(633~651년)과 이집트 정복(639~642년) — 'Early Muslim conquests', 'Muslim conquest of Persia'
- [abbasid_baghdad 762~900 · 메소포타미아·이란] 762년 바그다드 건설, 794년 무렵 종이 공방 — 'Baghdad', 'History of paper', 'House of Wisdom' (확인함)
- [crusades 1096~1291 · 메소포타미아(레반트)·아나톨리아] 1차 십자군(1096년)부터 아크레 함락(1291년)까지 — 'Crusades', 'Siege of Acre (1291)'
- [mongol_baghdad 1256~1260 · 메소포타미아·이란] 1258년 바그다드 함락과 아바스 칼리파국의 끝 — 'Siege of Baghdad (1258)' (확인함)
- [timur 1370~1405 · 중앙아시아·이란·메소포타미아·아나톨리아] 사마르칸트 군주의 원정 — 'Timurid Empire' (사건 글에는 이름을 쓰지 않음)
- [constantinople 1453~1454 · 아나톨리아·발칸] 1453년 4월 6일~5월 29일 포위와 함락, 강제 이주(쉬르귄)가 섞인 재정착. 포위는 도시 하나라 땅 전체는 전쟁 수준 2 — 'Fall of Constantinople', 'Sürgün' (확인함)
- [algeria_war 1954~1962 · 마그레브] 알제리 독립 전쟁. 모로코·튀니지는 전장이 아니라 땅 전체는 전쟁 수준 2 — 'Algerian War'
- [oil_boom 1950~1980 · 아라비아] 걸프 석유 붐 — 'History of the oil industry in Saudi Arabia', '1973 oil crisis'

### 유럽
- [athens_plague −430~−426 · 발칸] 아테네 역병(인구 4분의 1~3분의 1 사망, 장티푸스설) — 'Plague of Athens' (확인함)
- [punic2 −218~−201 · 이탈리아·이베리아] 2차 포에니 전쟁(코끼리를 데리고 알프스를 넘음) — 'Second Punic War'
- [gallic −58~−50 · 프랑스 땅] 갈리아 전쟁 — 'Gallic Wars'
- [viking 793~1000 · 브리튼·프랑스] 793년 린디스판 수도원 습격으로 시작한 바이킹 습격 — 'Viking Age', 'Lindisfarne'
- [great_famine 1315~1317 · 북유럽] 1315~1317년 대기근(북유럽 인구 5~12% 사망 추정) — 'Great Famine of 1315–1317' (확인함)
- [hundred_years 1337~1453 · 프랑스·브리튼] 백년 전쟁. 싸움은 주로 프랑스 땅에서 — "Hundred Years' War"
- [reformation 1517~1555 · 독일·브리튼·북유럽·프랑스] 1517년 반박문부터 1555년 아우크스부르크 화의까지, 인쇄 소책자 — 'Reformation', 'Peace of Augsburg'
- [revolution1789 1789~1799 · 프랑스 땅] 프랑스 혁명과 봉건 공납 폐지(1789년) — 'French Revolution', 'Abolition of feudalism in France'
- [french_empire_wars 1803~1815 · 유럽] 나폴레옹 전쟁(이베리아 반도 전쟁, 독일 땅 전장) — 'Napoleonic Wars', 'Peninsular War' (사건 글에는 이름을 쓰지 않음)
- [irish_famine 1845~1849 · 브리튼(아일랜드)] 감자 마름병 대기근(약 100만 명 사망, 100만 명 이주), 발진티푸스·콜레라 — 'Great Famine (Ireland)' (확인함)
- [serf_emancipation 1861~1870 · 동유럽 평원] 1861년 농노 해방 칙령과 땅값 상환 — 'Emancipation reform of 1861'
- [depression 1929~1934 · 북아메리카·독일·브리튼·프랑스·라플라타] 대공황 — 'Great Depression'
- [soviet_famine 1932~1933 · 동유럽 평원] 1932~33년 소련 기근(홀로도모르 포함), 곡식 징발 — 'Soviet famine of 1930–1933', 'Holodomor'

### 사하라 이남 아프리카
- [bantu −500~0 · 콩고·동아프리카] 큰 호수 둘레의 우레웨 철기 문화(기원전 600~500년 무렵부터)와 반투 이동 — 'Urewe', 'Bantu expansion' (확인함)
- [aksum 300~600 · 동아프리카] 악숨 왕국의 동전과 4세기 기독교 수용 — 'Kingdom of Aksum', 'Aksumite currency'
- [saharan_trade 800~1500 · 서아프리카·마그레브] 낙타 대상의 금·소금 교역, 8세기 시질마사 — 'Trans-Saharan trade', 'Sijilmasa' (확인함)
- [mali_hajj 1324~1325 · 서아프리카·나일·아라비아] 말리 왕의 메카 순례와 카이로 금값 하락(알우마리의 기록) — 'Mansa Musa' (확인함, 사건 글에는 「말리 왕」으로만 씀)
- [benin_portugal 1487~1600 · 서아프리카] 포르투갈의 우고톤 상관(1487년~), 후추·상아와 놋쇠 마닐라, 베냉 청동판 — 'Kingdom of Benin', 'Manilla (money)', 'Benin Bronzes' (확인함, 1486년 첫 사절은 일반 연표)
- [scramble 1884~1914 · 서아프리카·콩고·아프리카 남부] 베를린 회의 뒤의 분할, 오두막세와 강제 노동. 1914년에는 에티오피아·라이베리아만 독립국. 에티오피아(동아프리카 땅)는 넣지 않았다 — 'Scramble for Africa', 'Berlin Conference', 'Hut tax' (확인함)
- [rinderpest 1889~1897 · 동아프리카·아프리카 남부] 1890년대 우역과 대기근(에티오피아 인구 3분의 1 사망 추정) — '1890s African rinderpest epizootic' (확인함)
- [congo_rubber 1891~1908 · 콩고] 콩고 자유국의 고무 할당과 무장 단속의 처벌, 수면병. 사인은 전쟁(무장 단속의 폭력) — 'Congo Free State', 'Atrocities in the Congo Free State', 'Force Publique'
- [independence 1957~1975 · 서아프리카·콩고] 가나(1957년)·나이지리아(1960년)·콩고(1960년) 독립 — 'Decolonisation of Africa'
- [hiv_africa 1985~2005 · 동아프리카·아프리카 남부·콩고] 사하라 이남 에이즈 유행 — 'HIV/AIDS in Africa'

### 아메리카
- [teotihuacan 100~550 · 메소아메리카] 테오티우아칸 전성기와 흑요석 교역 — 'Teotihuacan'
- [maya_collapse 800~950 · 메소아메리카] 고전기 마야의 쇠퇴와 가뭄 — 'Classic Maya collapse'
- [tenochtitlan 1428~1519 · 메소아메리카] 1428년 삼각 동맹, 공물, 치남파 — 'Aztec Empire', 'Aztec Triple Alliance', 'Chinampa' (확인함)
- [inca_roads 1438~1532 · 안데스] 1438년 무렵부터의 잉카 팽창, 미타 노역으로 지은 길·창고·역참 — 'Inca road system', "Mit'a" (확인함)
- [inca_conquest 1532~1572 · 안데스] 1532년 잉카 통치자가 사로잡힘부터 1572년 빌카밤바 함락까지 — 'Spanish conquest of the Inca Empire'
- [cocoliztli 1545~1548 · 메소아메리카] 코코리스틀리 유행. 옛 유골 연구는 살모넬라 파라티푸스 C를 지목했고, 게임에서는 장티푸스로 둔다 — 'Cocoliztli epidemics'
- [brazil_sugar 1550~1700 · 브라질] 노예 노동의 사탕수수 농장과 설탕 공장 — 'Sugar cane in Brazil', 'Slavery in Brazil'
- [potosi_mita 1573~1700 · 안데스] 1573년 부왕이 정한 포토시 미타 제도, 식구가 함께 따라감. 사인은 폐병(광부의 규폐·수은 중독) — "Mit'a", 'Potosí', 'Silicosis' (확인함)
- [haiti 1791~1804 · 카리브] 아이티 혁명과 프랑스군의 황열 — 'Haitian Revolution'
- [latam_independence 1810~1825 · 메소아메리카·안데스·라플라타·브라질] 스페인령 아메리카 독립 전쟁(브라질의 1822년 독립은 국경 다툼 수준으로 둠) — 'Spanish American wars of independence'
- [us_civil_war 1861~1865 · 북아메리카] 미국 남북 전쟁(사망 62만~75만) — 'American Civil War'
- [mexican_revolution 1910~1920 · 메소아메리카] 멕시코 혁명과 토지 요구 — 'Mexican Revolution'

### 동남아시아·오세아니아
- [lapita −1200~−800 · 태평양 섬] 라피타 사람들의 바누아투(기원전 1200년 무렵)·피지·통가·사모아 정착 — 'Lapita culture' (확인함)
- [funan 100~550 · 동남아 대륙] 푸난과 옥에오 항구(로마 주화 출토) — 'Funan', 'Óc Eo'
- [srivijaya 670~1025 · 인도네시아·말레이] 스리위자야 해상 왕국과 1025년 촐라의 습격 — 'Srivijaya', 'Chola invasion of Srivijaya'
- [angkor_build 1113~1150 · 동남아 대륙] 12세기 전반의 앙코르 와트 공사 — 'Angkor Wat'
- [islam_malacca 1400~1511 · 말레이·인도네시아] 1400년 무렵 믈라카 건설, 1511년 포르투갈 점령 — 'Malacca Sultanate', 'Capture of Malacca (1511)'
- [manila_galleon 1565~1815 · 필리핀] 마닐라–아카풀코 갤리언 무역 — 'Manila galleon'
- [spice_voc 1602~1799 · 인도네시아] 네덜란드 동인도 회사(1602~1799년)와 1621년 반다 제도 정복 — 'Dutch East India Company', 'Dutch conquest of the Banda Islands' (확인함, 1799년 해산은 일반 연표)
- [tambora 1815~1816 · 인도네시아] 1815년 탐보라 화산 폭발과 기근 — '1815 eruption of Mount Tambora'
- [first_fleet 1788~1792 · 오스트레일리아] 1788년 첫 함대와 1789년 시드니 일대의 천연두. 땅에 뉴질랜드가 끼어 위험률을 0.005로 낮춤 — 'First Fleet', '1789 smallpox epidemic in New South Wales'
- [vietnam_war 1955~1975 · 동남아 대륙] 베트남 전쟁. 라오스·캄보디아로 번졌고 1975년 사이공 함락으로 끝났다. 땅(미얀마·타이·베트남 일대) 전체로는 전쟁 수준 2로 둔다 — 'Vietnam War'

### 초원
- [chariot −2000~−1700 · 중앙아시아] 신타시타의 바퀴살 전차(기원전 2000년 무렵) — 'Sintashta culture', 'Chariot'
- [mongol_rise 1206~1227 · 몽골 초원] 1206년 쿠릴타이와 대칸 추대, 십진 편제 — 'Mongol Empire', 'Kurultai' (확인함)
- [khwarazm 1219~1221 · 중앙아시아·이란] 몽골의 호라즘 정복(부하라 1220년, 사마르칸트 1220년, 메르브 1221년) — 'Mongol invasion of the Khwarazmian Empire' (확인함)
- [russian_turkestan 1865~1885 · 중앙아시아] 러시아의 중앙아시아 정복(타슈켄트 1865년) — 'Russian conquest of Central Asia'
- [kazakh_famine 1930~1933 · 중앙아시아] 카자흐 대기근(150만~230만 사망, 가축 징발과 강제 정착) — 'Kazakh famine of 1930–1933' (확인함)

### 세계
- [covid 2020~2022 · 세계] 코로나19 대유행. 2020~2021년 초과 사망 약 1,490만(세계보건기구 추정) — 'COVID-19 pandemic', WHO '14.9 million excess deaths associated with the COVID-19 pandemic in 2020 and 2021' (확인함)

## 땅·자리 고유 묶음 (시뮬 2.0 작업 7)

카드·줄 묶음마다 출처는 작성자별 파일에 있다.
- `CONTENT-SOURCES-local-sa.md`: 남아시아
- `CONTENT-SOURCES-local-ea.md`: 동아시아
- `CONTENT-SOURCES-local-eu.md`: 유럽·서아시아·북아프리카
- `CONTENT-SOURCES-local-am.md`: 아메리카·아프리카·동남아·오세아니아
