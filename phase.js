// 나이 → 하루의 때, 하루의 때 → 시각. three 없이 읽히는 작은 모듈 (main.js 가 3D 무대를 다 받기 전에도 쓴다. realscene.js 가 다시 내보낸다)
export const phaseOf = (age) => (age < 13 ? 'dawn' : age < 30 ? 'morning' : age < 50 ? 'noon' : age < 65 ? 'afternoon' : 'dusk');
// 하루의 때 → 시각 (england PRESET 의 태양시. 밤은 해가 지평선 아래 14° 남짓)
export const PHASE_TIME = { dawn: 5.1, morning: 7.4, noon: 12.6, afternoon: 16.6, dusk: 19.05, night: 21.7 };
