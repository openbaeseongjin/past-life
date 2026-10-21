// 말 바꿔 끼우기 (설계 4.1): 카드·작은 일 줄 글의 {crop}·{coin:을} 자리를 그 생의 맥락(contextOf().words)으로 채운다.
// three·DOM 없는 순수 모듈 (Node 시험: test/tokens.test.mjs)
//
// 자리 글 규칙
//   {key}        그 땅·시대의 낱말 (WORD_KEYS 가운데 하나)
//   {key:을}     한국어 조사를 받침에 맞춘다. 을/를 · 이/가 · 은/는 · 과/와 · 으로/로(ㄹ 받침은 로) · 이나/나 · 이랑/랑 · 이라/라 · 이라고/라고 · 이에요/예요
//                짝의 어느 쪽을 써도 된다 ({crop:를} 도 「쌀을」이 된다). 영어 글에서는 조사를 버리고 낱말만 넣는다
//   {Key}        첫 글자가 대문자면 영어 낱말의 첫 글자를 대문자로 (문장 첫머리용). 한국어는 그대로
// 영어 낱말 규칙 (context_data.js 와 같다): 소문자, 관사 없음 (고유명사 Christmas·Diwali·Eid·Kaiser 등은 대문자). crop·staple·cloth 는 물질 명사, coin·coinUnit·land·landUnit·beast 는 복수, 나머지는 단수.
//   (crop·staple 표에는 potatoes·tortillas 같은 복수형도 섞여 있다: 템플릿은 이 둘을 주어로 쓰지 않는다)
//   ruler: 관사 없는 단수 칭호나 단수 집합 명사 (king · East India Company · council of elders). 템플릿이 the 를 붙인다
//   school: 배우는 자리 (at/to/in the {school}). 고대의 「elders' circle」·수렵의 「fireside」처럼 학교가 아닌 자리도 있다
//   feast: 이름(대문자로 시작: Christmas · New Year Festival)이나 일반 명사(소문자: hunt feast). 영어 {feast} 자리는 feastEn 으로
//          일반 명사에만 the 를 붙여 넣는다 (the hunt feast). 이미 the 로 시작하는 이름(the Fourth of July)은 그대로라 the the 가 생기지 않는다.
//          그러니 템플릿은 {feast} 앞에 the 를 쓰지 않는다 (시험이 지킨다)
// 모르는 자리: strict(시험)면 던지고, 평소에는 그 낱말을 빼고 이어 쓴다. 어떤 경우에도 날것의 { } 를 내보내지 않는다.
export const WORD_KEYS = ['crop', 'staple', 'coin', 'coinUnit', 'land', 'landUnit', 'beast', 'home', 'holy', 'ruler', 'feast', 'cloth', 'market', 'healer', 'school'];

// [받침 있을 때, 없을 때]. 으로/로만 ㄹ 받침을 「없음」 쪽으로 친다
const PAIRS = [['을', '를'], ['이', '가'], ['은', '는'], ['과', '와'], ['으로', '로'], ['이나', '나'], ['이랑', '랑'], ['이라', '라'], ['이라고', '라고'], ['이에요', '예요']];
const PAIR_OF = new Map();
for (const p of PAIRS) for (const f of p) PAIR_OF.set(f, p);
export const JOSA_FORMS = [...PAIR_OF.keys()];

// 숫자로 끝나면 읽는 소리의 받침 (0 영, 1 일, 2 이, 3 삼, 4 사, 5 오, 6 육, 7 칠, 8 팔, 9 구). 8 = ㄹ
const DIGIT_FINAL = { 0: 21, 1: 8, 2: 0, 3: 16, 4: 0, 5: 0, 6: 1, 7: 8, 8: 8, 9: 0 };
const TRAIL = /[\s)\]}"'」』〉》.,!?·…]+$/u;

// 낱말 끝 글자의 받침 번호 (0 = 받침 없음, 8 = ㄹ). 한글 음절이 아니면 0
export function finalOf(word) {
  const s = String(word).replace(TRAIL, '');
  if (!s) return 0;
  const c = s.codePointAt(s.length - 1);
  if (c >= 0xac00 && c <= 0xd7a3) return (c - 0xac00) % 28;
  const ch = s[s.length - 1];
  if (ch >= '0' && ch <= '9') return DIGIT_FINAL[ch];
  return 0;
}

// 낱말 뒤에 붙일 조사 (form 은 짝의 어느 쪽이든). 모르는 조사면 null
export function josa(word, form) {
  const pair = PAIR_OF.get(form);
  if (!pair) return null;
  const f = finalOf(word);
  if (pair[0] === '으로') return f === 0 || f === 8 ? '로' : '으로';
  return f === 0 ? pair[1] : pair[0];
}

const TOKEN = /\{([A-Za-z]+)(?::([^{}]*))?\}/g;
const keyOf = (raw) => raw[0].toLowerCase() + raw.slice(1);
const known = (k) => WORD_KEYS.includes(k);

// 글 속의 모르는 자리 이름들 (내용 시험용). 조사가 틀린 자리도 함께 돌려준다
export function checkTokens(text) {
  const bad = [];
  for (const m of String(text).matchAll(TOKEN)) {
    const k = keyOf(m[1]);
    if (!known(k)) bad.push(m[1]);
    else if (m[2] != null && !PAIR_OF.has(m[2])) bad.push(`${m[1]}:${m[2]}`);
  }
  return bad;
}

// 영어 명절 낱말에 관사: 대문자로 시작하면 이름(Christmas · Diwali · New Year Festival), 이미 the 로 시작하면 그대로(the Fourth of July), 아니면 일반 명사라 the 를 붙인다
export const feastEn = (w) => (/^(the |[A-Z])/.test(w) ? w : `the ${w}`);

// 내용 시험용 (content·lines·tokens 시험이 같이 쓴다)
//   hasWordTokens: 말 바꿈 자리({crop}·{coin:을} …)가 하나라도 있는가. {place}(땅 이름 자리, i18n.js fill)는 말 바꿈이 아니다
//   leftoverBraces: {place} 와 바른 말 바꿈 자리를 빼고도 { } 가 남는가 (모르는 자리·틀린 조사·닫히지 않은 괄호)
export const hasWordTokens = (text) => [...String(text).matchAll(TOKEN)].some((m) => known(keyOf(m[1])));
export const leftoverBraces = (text) => /[{}]/.test(String(text).replaceAll('{place}', '').replace(TOKEN, (m) => (checkTokens(m).length ? m : '')));

// fillTokens(text, ctx, lang, strict = false) → 자리를 채운 글
export function fillTokens(text, ctx, lang, strict = false) {
  if (text == null) return '';
  const words = (ctx && ctx.words) || {};
  const out = String(text).replace(TOKEN, (m, raw, form) => {
    const k = keyOf(raw);
    const w0 = known(k) && words[k] ? words[k][lang] : null;
    const w = w0 && lang !== 'ko' && k === 'feast' ? feastEn(w0) : w0;
    if (!w) {
      if (strict) throw new Error(`fillTokens: 모르는 자리 {${raw}}`);
      return '';
    }
    const word = lang !== 'ko' && raw[0] !== raw[0].toLowerCase() ? w[0].toUpperCase() + w.slice(1) : w;
    if (form == null || form === '' || lang !== 'ko') return word;
    const j = josa(word, form);
    if (j === null) {
      if (strict) throw new Error(`fillTokens: 모르는 조사 {${raw}:${form}}`);
      return word + form;
    }
    return word + j;
  });
  if (/[{}]/.test(out)) {
    if (strict) throw new Error(`fillTokens: 닫히지 않은 자리 「${text}」`);
    return out.replace(/[{}]/g, '');
  }
  return out;
}
