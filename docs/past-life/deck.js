// 카드 모음 (설계 7장)
import { LIFE_CARDS } from './cards_life.js';
import { ERA_CARDS } from './cards_era.js';
import { TRACE_CARDS } from './cards_trace.js';
import { EVENT_CARDS } from './cards_event.js';
import { LOCAL_CARDS_SA } from './cards_local_sa.js';
import { LOCAL_CARDS_EA } from './cards_local_ea.js';
import { LOCAL_CARDS_EU } from './cards_local_eu.js';
import { LOCAL_CARDS_AM } from './cards_local_am.js';

// 땅·자리 고유 카드는 기본 가중치 3 (시뮬 2.0 작업 7: 시드 1,500개로 재 보니 1이면 본 카드의 7%만 고유, 3이면 11%. 카드에 weight 가 있으면 그것)
export const LOCAL_WEIGHT = 3;
const local = (cards) => { for (const c of cards) if (c.weight == null) c.weight = LOCAL_WEIGHT; return cards; };   // 같은 객체를 쓴다 (묶음 시험이 덱 안의 카드를 객체로 찾는다)
export const DECK = [...LIFE_CARDS, ...ERA_CARDS, ...TRACE_CARDS, ...EVENT_CARDS, ...local([...LOCAL_CARDS_SA, ...LOCAL_CARDS_EA, ...LOCAL_CARDS_EU, ...LOCAL_CARDS_AM])];
