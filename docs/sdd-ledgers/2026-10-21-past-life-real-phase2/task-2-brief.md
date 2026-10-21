### Task 2: 동아시아 세트 (출생 19%)

**Files:** Task 1과 같은 꼴이다(`kit_eastasia.py` 등).

**Interfaces:**
- Produces:
  - 건물: `house_thatch_ea`(초가), `house_tile_ea`(기와집), `house_town_ea`(가게 딸린 집), `temple_ea`(목조 법당), `pagoda_small`, `gate_ea`, `well_ea`, `granary_ea`
  - 땅별 변형 `variant`:
    - china: 회벽·회색 기와
    - korea: 초가·기와 곡선·돌담
    - japan: 판벽·초가 지붕 경사
    - 지붕 곡선·벽 색·담 재료를 바꾼다.
  - 소품·가축: `cart_ea`, `jangdok`(항아리)·`rice_rack`, `ox_ea`, `pig`, `chicken`, `ducks`
  - 나무: 소나무·감나무·대나무·버드나무
  - 옷: 한푸·한복·기모노풍 평민복(땅 변형별), 삿갓·두건
  - 레시피: 개울을 따라 늘어선 마을, 뒷산, 계단 논

- [ ] **Step 1~4:** Task 1과 같은 차례로 한다. 확인 시드는 1410 중국(`T4-39`)과 조선 시드 하나다.

