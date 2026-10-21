// KayKit 육각 타일·나무·중세 건물 (tools/pack_hex.mjs 가 만든 assets/hex.glb). 공유 파일이면 window.__HEX (base64)
// 실패하면 null → 마을은 코드 도형만으로 그린다
const JSM = 'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/';

export async function loadHex() {
  try {
    const [{ GLTFLoader }, { MeshoptDecoder }] = await Promise.all([import(JSM + 'loaders/GLTFLoader.js'), import(JSM + 'libs/meshopt_decoder.module.js')]);
    const loader = new GLTFLoader();
    loader.setMeshoptDecoder(MeshoptDecoder);
    const b64 = typeof window !== 'undefined' ? window.__HEX : null;
    let gltf;
    if (b64) {
      const s = atob(b64), bin = new Uint8Array(s.length);
      for (let i = 0; i < s.length; i++) bin[i] = s.charCodeAt(i);
      gltf = await loader.parseAsync(bin.buffer, './');
    } else gltf = await loader.loadAsync('./assets/hex.glb');
    return Object.fromEntries(gltf.scene.children.map((o) => [o.name, o]));
  } catch (e) {
    console.warn('육각 타일을 못 불러왔다 · 코드 도형으로 그린다', e);
    return null;
  }
}
