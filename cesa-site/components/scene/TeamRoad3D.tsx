"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import * as THREE from "three";

import type { Member } from "@/lib/content";
import { clamp, useReducedMotion } from "@/lib/motion";

/**
 * The courtyard walk — a one-to-one port of the road scene from
 * aditya-portfolio (github.com/AdityaThombe/aditya-portfolio, src/road.js +
 * the HUD in src/main.js/index.html), restyled into the Hanami palette.
 * Ported exactly, not approximated: the gate, lamps, mile markers, dust,
 * sun halo + ground streak, velocity-driven camera roll and FOV widen, the
 * sign's wobble and reflection, and the HUD (odometer, progress bar,
 * scramble-in title, flipping hint) are all here — the only things that
 * changed are the palette, the card face, and the copy on the signage.
 * `DRIFT` still applies with opposite sign per shoulder — that opposition
 * is what makes scrolling read as passing between two rows rather than one
 * flat list moving by.
 */

const SPACING = 6.2;
const FIRST_Z = -9;
const DRIFT = 3.0;
const CARD_W = 640;
const CARD_H = 800;
const SCRAMBLE_CHARS = "ABCDEFGHIKMNORSTUVYZ#%*·";

function cssVar(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

function pad2(n: number): string {
  return String(n + 1).padStart(2, "0");
}

function speckle(ctx: CanvasRenderingContext2D, w: number, h: number, n: number) {
  for (let i = 0; i < n; i++) {
    ctx.fillStyle = Math.random() > 0.5 ? "rgba(42,26,46,0.05)" : "rgba(255,255,255,0.05)";
    ctx.fillRect(Math.random() * w, Math.random() * h, 1.3, 1.3);
  }
}

/**
 * The original road surface, carried over from the portfolio's
 * textures.js/makeGroundCanvas: a flat tone with a fine two-tone speckle.
 *
 * The portfolio drew shoulders and a centre strip into one texture because
 * its plane was 90 units wide with the road occupying the middle 10. Here
 * the plane IS the path (16 units) and the shoulders are their own grass
 * field mesh, so this fills edge to edge with the tarmac tone alone.
 */
function makeRoadCanvas(): HTMLCanvasElement {
  const S = 256;
  const c = document.createElement("canvas");
  c.width = S;
  c.height = S;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = "#dad7d2";
  ctx.fillRect(0, 0, S, S);
  speckle(ctx, S, S, 900);
  return c;
}

/**
 * "THE END" sign, ported from the portfolio's textures.js/makeSignCanvas:
 * clay ground, speckle, a heavy ink rule inset 6px, the wordmark, a star, and
 * a spaced-out subtitle. Only ever drawn in the debug "Original" dressing —
 * our own walk closes on the painted end wall instead.
 */
function makeEndSignCanvas(displayFont: string, monoFont: string): HTMLCanvasElement {
  const W = 1024, H = 640;
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const ctx = c.getContext("2d")!;

  ctx.fillStyle = "#e07a4f";
  ctx.fillRect(0, 0, W, H);
  speckle(ctx, W, H, 1600);

  ctx.strokeStyle = "#141312";
  ctx.lineWidth = 12;
  ctx.strokeRect(6, 6, W - 12, H - 12);

  ctx.fillStyle = "#141312";
  ctx.textAlign = "center";
  ctx.font = `400 190px ${displayFont}`;
  ctx.fillText("THE END", W / 2, 300);

  // eight-point star, the original's punctuation between the two lines
  ctx.beginPath();
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2 - Math.PI / 2;
    const r = i % 2 === 0 ? 34 : 13;
    const x = W / 2 + Math.cos(a) * r, y = 400 + Math.sin(a) * r;
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#f4e9e2";
  ctx.font = `500 27px ${monoFont}`;
  try { ctx.letterSpacing = "4px"; } catch { /* older browsers */ }
  ctx.fillText("THANKS FOR DRIVING — FULL INDEX BELOW", W / 2, 528);
  try { ctx.letterSpacing = "0px"; } catch { /* older browsers */ }
  return c;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/** Same layout as components/ui/MemberCard.tsx (the Figma "Member Card"
 *  pull), redrawn on canvas since a WebGL texture can't render a React
 *  component. Every number here is the same percentage-of-698x894 used
 *  there — this is the second surface, not a second design. Icons are
 *  dropped: at road scale they'd be a handful of pixels and aren't
 *  clickable in the 3D scene anyway. */
function drawCard(
  canvas: HTMLCanvasElement,
  member: Member,
  plethoraImg: HTMLImageElement,
  tornImg: HTMLImageElement,
  displayFont: string,
  bodyFont: string,
) {
  canvas.width = CARD_W;
  canvas.height = CARD_H;
  const ctx = canvas.getContext("2d")!;
  const washi = "#ede2cf";

  const radius = { x: CARD_W * 0.0716, y: CARD_H * 0.0559 };
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(0, 0, CARD_W, CARD_H, [radius.x]);
  ctx.clip();

  ctx.fillStyle = washi;
  ctx.fillRect(0, 0, CARD_W, CARD_H);
  speckle(ctx, CARD_W, CARD_H, 500);

  ctx.drawImage(plethoraImg, -0.39255 * CARD_W, 0, 1.846705 * CARD_W, 0.805369 * CARD_H);

  // Silhouette standing in for a real photo — same shape and placement as
  // MemberCard.tsx's <svg>, redrawn on canvas since a WebGL texture can't
  // use an actual SVG element.
  ctx.save();
  const silH = 0.42 * CARD_H;
  const silScale = silH / 130;
  ctx.translate(CARD_W / 2 - 50 * silScale, 0.32 * CARD_H);
  ctx.scale(silScale, silScale);
  ctx.fillStyle = "rgba(42,26,46,0.62)";
  ctx.beginPath();
  ctx.arc(50, 30, 28, 0, Math.PI * 2);
  ctx.fill();
  ctx.fill(new Path2D("M50 62c-30 0-46 20-46 50v18h92v-18c0-30-16-50-46-50z"));
  ctx.restore();

  // top seam, ragged edge pointing down
  ctx.save();
  ctx.translate(CARD_W / 2, CARD_H * 0.09145);
  ctx.rotate(Math.PI);
  ctx.drawImage(tornImg, -CARD_W / 2, -CARD_H * 0.09284, CARD_W, CARD_H * 0.185682);
  ctx.restore();

  // bottom seam, ragged edge pointing up
  ctx.drawImage(
    tornImg,
    -0.379656 * CARD_W, 0.714765 * CARD_H,
    1.710602 * CARD_W, 0.313199 * CARD_H,
  );

  ctx.fillStyle = "#c36866";
  ctx.textBaseline = "top";
  ctx.font = `${0.07 * CARD_W}px ${displayFont}, sans-serif`;
  ctx.fillText(member.name, 0.073066 * CARD_W, 0.805369 * CARD_H, 0.78 * CARD_W);

  ctx.fillStyle = "#555";
  ctx.font = `${0.05 * CARD_W}px ${bodyFont}, sans-serif`;
  ctx.fillText(member.role, 0.073066 * CARD_W, 0.805369 * CARD_H + 0.07 * CARD_W * 1.05 + 0.008 * CARD_W);

  ctx.restore();
}

function makeGlowCanvas(stops: [number, string][]): HTMLCanvasElement {
  const s = 256;
  const c = document.createElement("canvas");
  c.width = c.height = s;
  const ctx = c.getContext("2d")!;
  const g = ctx.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
  for (const [at, color] of stops) g.addColorStop(at, color);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, s, s);
  return c;
}

const makeShadowCanvas = () => makeGlowCanvas([[0, "rgba(42,26,46,0.45)"], [1, "rgba(42,26,46,0)"]]);
const makeSunCanvas = () => makeGlowCanvas([
  [0, "#ffe3ce"], [0.28, "#f6a0a0"], [0.62, "rgba(244,121,111,0.5)"], [1, "rgba(244,121,111,0)"],
]);

function makeMarkerCanvas(i: number, displayFont: string, monoFont: string): HTMLCanvasElement {
  const W = 200, H = 260;
  const c = document.createElement("canvas");
  c.width = W; c.height = H;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = "#f4ecdd";
  ctx.fillRect(0, 0, W, H);
  speckle(ctx, W, H, 250);
  ctx.strokeStyle = "#2a1a2e";
  ctx.lineWidth = 8;
  ctx.strokeRect(4, 4, W - 8, H - 8);
  ctx.fillStyle = "#f4796f";
  ctx.beginPath();
  ctx.arc(W / 2, 52, 14, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#2a1a2e";
  ctx.textAlign = "center";
  ctx.font = `86px ${displayFont}, sans-serif`;
  ctx.fillText(pad2(i), W / 2, 165);
  ctx.font = `20px ${monoFont}, monospace`;
  ctx.fillText("NO.", W / 2, 220);
  return c;
}

function makeBeamCanvas(monoFont: string): HTMLCanvasElement {
  const W = 1024, H = 96;
  const c = document.createElement("canvas");
  c.width = W; c.height = H;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = "#2a1a2e";
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = "#ede2cf";
  ctx.font = `29px ${monoFont}, monospace`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("CESA — COMMITTEE 2025", W / 2, H / 2 + 2);
  return c;
}

export default function TeamRoad3D({ members }: { members: Member[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const duskRef = useRef<HTMLDivElement>(null);
  const hudWrapRef = useRef<HTMLDivElement>(null);
  const hudCountRef = useRef<HTMLSpanElement>(null);
  const hudNumRef = useRef<HTMLParagraphElement>(null);
  const hudTitleRef = useRef<HTMLHeadingElement>(null);
  const hudMetaRef = useRef<HTMLParagraphElement>(null);
  const hudHintRef = useRef<HTMLParagraphElement>(null);
  const hudOdoRef = useRef<HTMLParagraphElement>(null);
  const hudFillRef = useRef<HTMLSpanElement>(null);
  const reduced = useReducedMotion();

  /* Debug switcher. Off unless the page is opened with ?debug — this is a
     comparison harness for choosing the dressing, not a user-facing control.
     State is mirrored into a ref because the WebGL effect must not re-run (and
     re-download every texture) when a toggle flips; the rAF loop reads the ref. */
  const [debugOn, setDebugOn] = useState(false);
  // Defaults to the original road, with its own faithful backdrop (none).
  // This drives the scene whether or not the panel is on screen.
  const [dressing, setDressing] = useState<"garden" | "road">("road");
  const [horizon, setHorizon] = useState<"mountains" | "none">("none");
  const debugRef = useRef({ dressing, horizon });
  debugRef.current = { dressing, horizon };

  useEffect(() => {
    // ?debug only — never on the page as it is normally viewed, including in
    // dev. `d` toggles it once you are there, guarded so it doesn't fire while
    // typing into a field.
    setDebugOn(new URLSearchParams(window.location.search).has("debug"));
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "d" && e.key !== "D") return;
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
      setDebugOn((v) => !v);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (hudCountRef.current) hudCountRef.current.textContent = `(${String(members.length).padStart(2, "0")})`;
  }, [members.length]);

  useEffect(() => {
    if (reduced) return;
    const canvas = canvasRef.current;
    const wrapper = wrapperRef.current;
    if (!canvas || !wrapper) return;

    // Card faces now paint the real scene image + torn seams (see drawCard),
    // which means an actual image has to finish loading before any card
    // texture can be drawn — everything below waits on that, whereas the
    // old gradient-arch cards needed nothing but canvas primitives and
    // could draw synchronously.
    let cancelled = false;
    let cleanup = () => {};

    (async () => {
      const [
        plethoraImg, tornImg, mountainsImg, sidePlantsImg,
        groundLanternImg, ropedLanternsImg, fieldGrassImg, fenceImg, treeAImg, treeBImg, sunImg,
        endWallImg,
        petalImg1, petalImg2, petalImg3,
      ] = await Promise.all([
        loadImage("/scene/plethora.webp"),
        loadImage("/scene/torn-edge.webp"),
        loadImage("/scene/mountains-temple.webp"),
        loadImage("/scene/side-plants.webp"),
        loadImage("/scene/ground-lantern.webp"),
        loadImage("/scene/roped-lanterns.webp"),
        loadImage("/scene/field-grass.webp"),
        loadImage("/scene/fence.webp"),
        loadImage("/scene/tree-a.webp"),
        loadImage("/scene/tree-b.webp"),
        loadImage("/scene/sun.webp"),
        loadImage("/scene/end-wall.webp"),
        loadImage("/petals/petal-1.webp"),
        loadImage("/petals/petal-5.webp"),
        loadImage("/petals/petal-7.webp"),
      ]);
      if (cancelled) return;

    const displayFont = cssVar("--font-reggae") || "serif";
    const bodyFont = cssVar("--font-inter") || "sans-serif";
    const monoFont = cssVar("--font-jetbrains") || "monospace";

    const count = members.length;
    const lastZ = FIRST_Z - SPACING * (count - 1);
    const travel = SPACING * (count - 1) + 12;
    const signZ = lastZ - 7.2;
    const sunZ = lastZ - 15.5;

    const WASHI = new THREE.Color("#ede2cf");
    const DUSK = new THREE.Color("#e79a8a");
    /* the original road's own fog pair (road.js BONE/DUSK) */
    const BONE = new THREE.Color("#d8d5d1");
    const ORIG_DUSK = new THREE.Color("#eec3a4");

    /* Objects that belong to exactly one dressing. Garden props are picked up
       later by texture, but these two sets are procedural geometry with no
       source image to match on, so they are collected as they are built. */
    const oursOnly: THREE.Object3D[] = [];
    const origOnly: THREE.Object3D[] = [];
    const INK = 0x2a1a2e;

    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(WASHI.clone(), 12, 44);

    const camera = new THREE.PerspectiveCamera(64, 1, 0.1, 150);
    camera.position.set(0, 1.6, 0);

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setClearColor(0x000000, 0);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    const srgb = (tex: THREE.Texture) => {
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
      return tex;
    };
    const OVER_GROUND = 2;

    /* Real light + shadows, replacing the painted-overlay "light shaft"
       attempt entirely — everything else in this scene is unlit
       MeshBasicMaterial, which is why that overlay had to fake a source;
       a real THREE.DirectionalLight with shadows lets the trees actually
       block light and cast dappled shade onto the path, which is what
       "sun penetrating between the trees" really means. Only the ground,
       field and trees are switched to a lit material (Lambert — cheap,
       no need for real-time specular here) since those are the only
       surfaces that need to visibly show it; cards, lanterns, and the
       gate/sign text stay MeshBasicMaterial so they read as evenly lit,
       legible surfaces rather than going dark in their own shadow.
       The light follows the camera down the path each frame (see tick())
       instead of trying to cover the whole ~100-unit walk in one shadow
       frustum, which would blur the shadow resolution into uselessness. */
    const hemi = new THREE.HemisphereLight(0xffdcc0, 0x2a2038, 0.28);
    scene.add(hemi);
    const sunLight = new THREE.DirectionalLight(0xffdcb0, 4.3);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.set(1024, 1024);
    sunLight.shadow.camera.left = -16;
    sunLight.shadow.camera.right = 16;
    sunLight.shadow.camera.top = 12;
    sunLight.shadow.camera.bottom = -2;
    sunLight.shadow.camera.near = 1;
    sunLight.shadow.camera.far = 45;
    sunLight.shadow.bias = -0.0015;
    scene.add(sunLight, sunLight.target);

    /* The light itself has no visible form — a DirectionalLight is just a
       direction vector, nothing to look at. This is the actual painted
       sun plate (same asset the hero scene uses), meant to visually match
       the direction the shadows fall from. It's a real WORLD-SPACE object
       (not a camera child like the mountains skybox) and gets repositioned
       each frame in tick() to keep a fixed offset ahead of the camera,
       low and to the left among the near trees — a camera-child sprite is
       screen-locked forever at the same spot, which is exactly why it read
       as "stuck to the mountain": it never moved relative to the receding
       tree line the way a real object at that position would. */
    const sunDiscTex = srgb(new THREE.Texture(sunImg));
    sunDiscTex.needsUpdate = true;
    // depthTest stays ON. A Sprite is always in the transparent pass, which
    // runs after every opaque object, so with depthTest off the disc painted
    // straight over the gate beam and its "CESA — COMMITTEE 2025" lettering
    // no matter how far behind them it actually sat. The horizon plate can't
    // wrongly occlude it in return: mountains have depthWrite off, so they
    // leave no depth for the disc to fail against.
    const sunDisc = new THREE.Sprite(new THREE.SpriteMaterial({
      map: sunDiscTex, transparent: true, depthWrite: false, fog: false,
    }));
    sunDisc.scale.set(5, 5 * (sunImg.height / sunImg.width), 1);
    sunDisc.renderOrder = -1;
    scene.add(sunDisc);
    // Ours only. This is the painted sun plate hung off to the left; the
    // original's sun is the procedural glow centred on the road at y4.4
    // (built further down and kept in both), so showing both put two suns
    // in frame.
    oursOnly.push(sunDisc);

    /* Mountains + temple horizon — a true "universal" background, not a
       plate parked at one spot on the path (that only filled the screen
       once the camera got close to it, i.e. "the last portion"). Instead
       it's a child of the camera itself, hung far in front at a fixed
       relative offset, so it always fills the whole frame at every scroll
       position, the way a skybox would. depthTest and depthWrite are off
       and renderOrder is negative so it always paints first and every
       other opaque object (ground, cards, gate) simply draws over it where
       they overlap. Its size is recomputed on resize() (see sizeSky below)
       from the actual vertical FOV, not a guessed constant — sized to the
       frustum height means the full image (ridge to sky) stays in frame
       instead of the plane being so oversized only its flat sky region
       shows, cropping the ridge out entirely. */
    const mountainsTex = srgb(new THREE.Texture(mountainsImg));
    mountainsTex.needsUpdate = true;
    const SKY_DIST = 90;
    const mountains = new THREE.Mesh(
      new THREE.PlaneGeometry(1, 1),
      // Drawn LAST with depth testing on, not first with it off. As a
      // paint-first backdrop it could not be occluded by anything, so once
      // the road became transparent for its reflections, 14% of this plate —
      // which is fog:false and so still fully saturated at 90 units, while
      // the fog has flattened the road to cream by 44 — bled straight up
      // through the road surface. Sitting it at the end of the transparent
      // queue lets the road's own depth reject it wherever the road is
      // nearer, which is exactly how a skybox is normally drawn.
      new THREE.MeshBasicMaterial({
        map: mountainsTex, fog: false, transparent: true, depthTest: true, depthWrite: false,
      }),
    );
    mountains.position.set(0, 0, -SKY_DIST);
    // Between the road (-3) and the props (0): late enough that the road has
    // already written depth and can reject it, early enough that the trees,
    // lanterns and fences still draw over it. Last in the queue is wrong —
    // the foliage is transparent with depthWrite off, so it leaves no depth
    // behind and the plate simply painted over the whole tree line.
    mountains.renderOrder = -2;
    camera.add(mountains);
    scene.add(camera);
    function sizeSky() {
      const vFovDeg = Math.max(baseFov, camera.fov) + 14;
      const h = 2 * SKY_DIST * Math.tan(THREE.MathUtils.degToRad(vFovDeg) / 2) * 1.08;
      const w = h * (mountainsImg.width / mountainsImg.height);
      mountains.geometry.dispose();
      mountains.geometry = new THREE.PlaneGeometry(w, h);
      // The ground plane occupies the lower half of the frame in perspective,
      // so a vertically-centred sky plate has its ridge/temple silhouette
      // sitting right at the horizon line where the ground already covers
      // it. Shifting the plate up in camera space (not in the texture — the
      // plate is the texture, full-bleed) moves the ridge well clear of
      // that occlusion, into the top 60-70% of the screen instead.
      mountains.position.y = h * 0.32;
    }

    /* field — a wide painted meadow plane under the mud path, filling what
       was empty space (straight through to the sky, then flat green)
       beyond the path's own 16-unit width. Sits a hair below the mud
       plane so it only shows in the strip the mud doesn't cover, no seam
       to line up. */
    const GROUND_LEN = travel + 60;
    const fieldTex = srgb(new THREE.Texture(fieldGrassImg));
    fieldTex.needsUpdate = true;
    fieldTex.wrapS = fieldTex.wrapT = THREE.RepeatWrapping;
    const FIELD_TILE = 7;
    const FIELD_W = 62;
    fieldTex.repeat.set(FIELD_W / FIELD_TILE, GROUND_LEN / FIELD_TILE);
    // MeshLambertMaterial, not MeshBasicMaterial: an unlit material simply
    // can't display a received shadow at all, regardless of receiveShadow
    // — shadows are a modulation of light contribution, and Basic has none
    // to modulate. This is the one material swap that actually matters
    // for "sun through the trees" to be visible at all.
    //
    // TWO shoulder strips, not one 140-wide sheet under everything. The path
    // is transparent now so the reflections can show through it, which also
    // means anything underneath shows through — and a full-width field put
    // grass right across the road surface. Stopping the strips at the path's
    // own edge (x +/-8) leaves nothing beneath it but the reflections.
    const fieldMat = new THREE.MeshLambertMaterial({ map: fieldTex });
    const fieldGeo = new THREE.PlaneGeometry(FIELD_W, GROUND_LEN);
    for (const x of [-(8 + FIELD_W / 2), 8 + FIELD_W / 2]) {
      const field = new THREE.Mesh(fieldGeo, fieldMat);
      field.rotation.x = -Math.PI / 2;
      field.position.set(x, -0.01, FIRST_Z - travel / 2);
      field.receiveShadow = true;
      scene.add(field);
    }

    /* ground — the path itself, a single tiled plane running the length of
       the walk. Back on the original procedural surface from the portfolio's
       road (textures.js/makeGroundCanvas): a flat tone with a fine two-tone
       speckle, drawn rather than painted, in place of the mud-and-petals
       plate. The plate is still in the pipeline as /scene/path-ground if it
       is wanted back. */
    const groundTex = srgb(new THREE.CanvasTexture(makeRoadCanvas()));
    groundTex.needsUpdate = true;
    groundTex.wrapS = groundTex.wrapT = THREE.RepeatWrapping;
    const GROUND_TILE = 6;
    groundTex.repeat.set(16 / GROUND_TILE, GROUND_LEN / GROUND_TILE);
    // Transparent at the original's 0.86 so the card reflections underneath
    // ghost up through it. Still Lambert rather than Basic: the tree shadows
    // have to keep landing on it, and an unlit material cannot show a
    // received shadow at all. It keeps depthWrite on, which is what lets the
    // sky plate be depth-rejected where the road covers it (see mountains).
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(16, GROUND_LEN),
      new THREE.MeshLambertMaterial({ map: groundTex, transparent: true, opacity: 0.86 }),
    );
    ground.renderOrder = -3;
    ground.rotation.x = -Math.PI / 2;
    ground.position.set(0, 0, FIRST_Z - travel / 2);
    ground.receiveShadow = true;
    scene.add(ground);
    oursOnly.push(ground);

    /* path edges + centre dashes — the road's own lane markings, restyled */
    const edgeMat = new THREE.LineBasicMaterial({ color: INK, transparent: true, opacity: 0.32 });
    for (const x of [-4.4, 4.4]) {
      const geo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(x, 0.012, 4),
        new THREE.Vector3(x, 0.012, lastZ - 10),
      ]);
      const line = new THREE.Line(geo, edgeMat);
      scene.add(line);
      oursOnly.push(line);
    }
    const dashMat = new THREE.LineBasicMaterial({ color: INK, transparent: true, opacity: 0.22 });
    for (let z = 4; z > lastZ - 10; z -= 1.6) {
      const geo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, 0.012, z),
        new THREE.Vector3(0, 0.012, z - 0.7),
      ]);
      const line = new THREE.Line(geo, dashMat);
      scene.add(line);
      oursOnly.push(line);
    }

    /* ---- the original road's own dressing, for debug "Original" mode ----
       Numbers straight out of aditya-portfolio/src/road.js, not approximated:
       a 90-wide bone ground at opacity 0.86 sitting at renderOrder 1 so the
       card REFLECTIONS (renderOrder 0, already built below) ghost up through
       it — that wet-road look is the whole signature of the original, and our
       opaque lit ground was burying it. Lane markings are solid quads, not
       lines: ink edges at 0.45 and vermilion #e07a4f dashes at 0.9. */
    const origGroundTex = srgb(new THREE.CanvasTexture(makeRoadCanvas()));
    origGroundTex.wrapS = origGroundTex.wrapT = THREE.RepeatWrapping;
    origGroundTex.repeat.set(1, 60);
    const origGround = new THREE.Mesh(
      new THREE.PlaneGeometry(90, travel + 200),
      new THREE.MeshBasicMaterial({ map: origGroundTex, transparent: true, opacity: 0.86 }),
    );
    origGround.rotation.x = -Math.PI / 2;
    origGround.position.set(0, 0, FIRST_Z - travel / 2);
    origGround.renderOrder = -3;
    scene.add(origGround);
    origOnly.push(origGround);

    const origLineMat = new THREE.MeshBasicMaterial({
      color: 0x141312, transparent: true, opacity: 0.45,
    });
    const origEdgeGeo = new THREE.PlaneGeometry(0.07, travel + 90);
    for (const x of [-5, 5]) {
      const edge = new THREE.Mesh(origEdgeGeo, origLineMat);
      edge.rotation.x = -Math.PI / 2;
      edge.position.set(x, 0.011, -(travel + 90) / 2 + 8);
      edge.renderOrder = OVER_GROUND;
      scene.add(edge);
      origOnly.push(edge);
    }
    const origDashMat = new THREE.MeshBasicMaterial({
      color: 0xe07a4f, transparent: true, opacity: 0.9,
    });
    const origDashGeo = new THREE.PlaneGeometry(0.16, 2.3);
    for (let z = 6; z > lastZ + 3; z -= 4.6) {
      const dash = new THREE.Mesh(origDashGeo, origDashMat);
      dash.rotation.x = -Math.PI / 2;
      dash.position.set(0, 0.012, z);
      dash.renderOrder = OVER_GROUND;
      scene.add(dash);
      origOnly.push(dash);
    }

    /* grass/flower clumps along both shoulders — the path-edge greenery
       the ground texture alone doesn't provide. Flat billboards facing
       forward (no per-frame look-at needed: the camera only dollies along
       Z with a small sway, so a fixed slight inward yaw reads as "facing
       the path" the whole walk, same trick the mile markers already use).
       One shared geometry/material, per-instance variation from scale and
       jitter only, since a size like this doesn't need unique buffers. */
    const plantsTex = srgb(new THREE.Texture(sidePlantsImg));
    plantsTex.needsUpdate = true;
    const plantsMat = new THREE.MeshBasicMaterial({ map: plantsTex, transparent: true, depthWrite: false });
    const PLANT_W = 1.7;
    const PLANT_H = PLANT_W * (sidePlantsImg.height / sidePlantsImg.width);
    const plantGeo = new THREE.PlaneGeometry(PLANT_W, PLANT_H);
    for (let z = 3; z > lastZ - 9; z -= 0.9) {
      for (const side of [-1, 1]) {
        // two rows per side (near + far from the path edge) so the shoulder
        // reads as a dense bed of growth rather than a single sparse file
        // of clumps — each row seeded independently so they don't repeat
        // in visible lockstep.
        for (const row of [0, 1]) {
          const seed = z * 12.9 + side * 3.7 + row * 51.3;
          const jitter = Math.sin(seed) * 0.5 + 0.5;
          const scale = 0.65 + jitter * 0.65;
          const plant = new THREE.Mesh(plantGeo, plantsMat);
          plant.scale.setScalar(scale);
          plant.position.set(
            side * (4.6 + row * 1.3 + jitter * 0.9),
            (PLANT_H * scale) / 2 - 0.03,
            z + (jitter - 0.5) * 1.2,
          );
          plant.rotation.y = -side * 0.15;
          scene.add(plant);
        }
      }
    }

    /* the same clumps again, scattered wider out across the meadow field
       so the flat tiled texture out there isn't bare either — sparser and
       bigger since they're meant to read as background dressing, not the
       path-edge detail the tighter rows above are. */
    for (let z = 4; z > lastZ - 12; z -= 3.4) {
      for (const side of [-1, 1]) {
        for (let i = 0; i < 3; i++) {
          const seed = z * 7.3 + side * 5.1 + i * 91.7;
          const jitter = Math.sin(seed) * 0.5 + 0.5;
          const scale = 1.1 + jitter * 1.1;
          const plant = new THREE.Mesh(plantGeo, plantsMat);
          plant.scale.setScalar(scale);
          plant.position.set(
            side * (7.5 + i * 6 + jitter * 4),
            (PLANT_H * scale) / 2 - 0.03,
            z + (jitter - 0.5) * 3,
          );
          plant.rotation.y = -side * 0.15;
          scene.add(plant);
        }
      }
    }

    /* low wooden fence lining the mud path's own edge (x = ±8, where the
       16-unit-wide mud plane ends and the meadow field begins) — segments
       butted end to end, not overlapped, so the crossed rails read as one
       continuous rail rather than a repeat. */
    const fenceTex = srgb(new THREE.Texture(fenceImg));
    fenceTex.needsUpdate = true;
    const FENCE_W = 2.3;
    const FENCE_H = FENCE_W * (fenceImg.height / fenceImg.width);
    const fenceGeo = new THREE.PlaneGeometry(FENCE_W, FENCE_H);
    const fenceMat = new THREE.MeshBasicMaterial({ map: fenceTex, transparent: true, side: THREE.DoubleSide, depthWrite: false });
    for (let z = 4; z > lastZ - 6; z -= FENCE_W) {
      for (const side of [-1, 1]) {
        const fence = new THREE.Mesh(fenceGeo, fenceMat);
        fence.rotation.y = Math.PI / 2;
        fence.position.set(side * 8.05, FENCE_H / 2 - 0.02, z);
        scene.add(fence);
      }
    }

    /* cherry trees behind the fence, two painted variants alternated (and
       occasionally skipped) so the tree line doesn't read as one asset
       stamped on repeat — same jittered-seed trick as the grass clumps. */
    const treeATex = srgb(new THREE.Texture(treeAImg));
    treeATex.needsUpdate = true;
    const treeBTex = srgb(new THREE.Texture(treeBImg));
    treeBTex.needsUpdate = true;
    // Sized against the gate (4.1 tall) and cards (~3.8), not arbitrarily —
    // at the old 6.5 a max-scale tree's canopy reached in past x=2, well
    // past the roped-lantern wall at x=6 and even toward the cards, which
    // is what was blanking out the ropes near the start of the walk.
    const TREE_H = 4.6;
    const treeAGeo = new THREE.PlaneGeometry(TREE_H * (treeAImg.width / treeAImg.height), TREE_H);
    const treeBGeo = new THREE.PlaneGeometry(TREE_H * (treeBImg.width / treeBImg.height), TREE_H);
    // alphaTest (not just transparent) matters for the shadow pass
    // specifically: without it, the shadow map's depth-only render ignores
    // alpha entirely and every tree casts a solid rectangle instead of its
    // actual canopy silhouette.
    const treeAMat = new THREE.MeshBasicMaterial({ map: treeATex, transparent: true, depthWrite: false, alphaTest: 0.5 });
    const treeBMat = new THREE.MeshBasicMaterial({ map: treeBTex, transparent: true, depthWrite: false, alphaTest: 0.5 });
    for (let z = 2; z > lastZ - 16; z -= 4.4) {
      for (const side of [-1, 1]) {
        const seed = z * 5.7 + side * 8.3;
        const jitter = Math.sin(seed) * 0.5 + 0.5;
        const useA = Math.sin(seed * 1.7) > 0;
        const scale = 0.85 + jitter * 0.4;
        const tree = new THREE.Mesh(useA ? treeAGeo : treeBGeo, useA ? treeAMat : treeBMat);
        // Both paintings lean/spread asymmetrically one way. Left side as
        // generated; mirrored on the right so that lean points outward,
        // away from the path, instead of both sides leaning the same real
        // -world direction and the right side's canopy crowding inward
        // over the cards.
        tree.scale.set(side === 1 ? -scale : scale, scale, scale);
        tree.position.set(side * (8.3 + jitter * 2), (TREE_H * scale) / 2 - 0.1, z + (jitter - 0.5) * 3);
        tree.rotation.y = -side * 0.1;
        tree.castShadow = true;
        scene.add(tree);
      }
    }

    /* cards + shadows + reflections */
    const shadowTex = new THREE.CanvasTexture(makeShadowCanvas());
    const shadowMat = new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, opacity: 0.28, depthWrite: false });
    const shadowGeo = new THREE.PlaneGeometry(3.2, 1.5);
    // 2.7 x 3.4562 — the real 698:894 aspect of the Member Card, not the
    // old card's own rounder 2.7:3.4.
    const CARD_ASPECT_H = 2.7 * (894 / 698);
    const cardGeo = new THREE.PlaneGeometry(2.7, CARD_ASPECT_H);

    type Card = {
      mesh: THREE.Mesh; shadow: THREE.Mesh; refl: THREE.Mesh;
      baseZ: number; side: number; baseRotY: number; baseRotZ: number; baseY: number;
      phase: number; lift: number; liftTarget: number; scale: number; scaleTarget: number;
      tiltX: number; tiltXTarget: number; tiltY: number; tiltYTarget: number;
    };
    const cards: Card[] = [];
    const cardMeshes: THREE.Mesh[] = [];
    // A soft warm halo behind each card — with the path this dense now
    // (grass, fence, trees, lanterns all repeating), the cards need
    // something to visually separate them from the background clutter
    // besides just being flat rectangles among it.
    const cardGlowTex = new THREE.CanvasTexture(makeSunCanvas());
    const cardGlowMat = new THREE.SpriteMaterial({
      map: cardGlowTex, transparent: true, opacity: 0.5, depthWrite: false, fog: false,
    });

    members.forEach((m, i) => {
      const cardCanvas = document.createElement("canvas");
      drawCard(cardCanvas, m, plethoraImg, tornImg, displayFont, bodyFont);
      const tex = srgb(new THREE.CanvasTexture(cardCanvas));
      // transparent:true so the rounded corners drawn into the texture
      // (everything outside the clipped roundRect) actually show as
      // transparent instead of opaque black. alphaTest so the real cast
      // shadow (below) respects the rounded-corner cutout instead of
      // casting a plain rectangle.
      const mesh = new THREE.Mesh(
        cardGeo,
        new THREE.MeshBasicMaterial({ map: tex, transparent: true, alphaTest: 0.5 }),
      );
      const side = i % 2 === 0 ? -1 : 1;
      const baseZ = FIRST_Z - i * SPACING;
      const rand = Math.sin(i * 999.7) * 0.5 + 0.5;
      const baseRotY = -side * 0.36;
      const baseRotZ = (rand - 0.5) * 0.04;
      mesh.position.set(side * 3.3, CARD_ASPECT_H / 2 + 0.32, baseZ);
      mesh.rotation.set(0, baseRotY, baseRotZ);
      mesh.userData = { index: i };
      mesh.castShadow = true;

      const glow = new THREE.Sprite(cardGlowMat);
      glow.scale.set(4.4, 4.4, 1);
      glow.position.set(mesh.position.x, mesh.position.y, baseZ - 0.15);
      glow.renderOrder = -1;

      // The existing contact-shadow blob stays — it's a constant "grounds
      // the card to the floor" cue that doesn't depend on light direction,
      // complementing rather than replacing the new real cast shadow.
      // Strengthened a bit since the ground itself is busier now too.
      const shadow = new THREE.Mesh(shadowGeo, shadowMat.clone());
      (shadow.material as THREE.MeshBasicMaterial).opacity = 0.4;
      shadow.rotation.x = -Math.PI / 2;
      shadow.position.set(mesh.position.x, 0.015, baseZ);
      shadow.renderOrder = OVER_GROUND;

      const refl = new THREE.Mesh(cardGeo, (mesh.material as THREE.MeshBasicMaterial).clone());
      const reflMat = refl.material as THREE.MeshBasicMaterial;
      reflMat.transparent = true;
      // MUST clear the alphaTest carried over in the clone. The card face
      // uses alphaTest 0.5 to keep its torn edges crisp, but alphaTest
      // discards any fragment whose FINAL alpha is under the threshold — and
      // a reflection's alpha is its 0.32 opacity, which never reaches 0.5.
      // Every pixel of every card reflection was being discarded, which is
      // why the road had none while the sign (no alphaTest) reflected fine.
      reflMat.alphaTest = 0;
      reflMat.opacity = 0.32;
      reflMat.depthWrite = false;
      reflMat.side = THREE.DoubleSide;
      refl.scale.set(1, -1, 1);
      refl.rotation.set(0, baseRotY, -baseRotZ);
      refl.position.set(mesh.position.x, -mesh.position.y, baseZ);
      // renderOrder/depthTest are set per frame from the dressing: Original
      // keeps the faithful arrangement (reflection UNDER a 0.86 road, seen
      // through it), while ours paints the reflection ON the opaque road.
      refl.renderOrder = -4;

      scene.add(mesh, glow, shadow, refl);
      // The soft bloom behind each card is ours — road.js floats its posters
      // with no glow at all.
      oursOnly.push(glow);
      cardMeshes.push(mesh);
      cards.push({
        mesh, shadow, refl, baseZ, side, baseRotY, baseRotZ, baseY: mesh.position.y,
        phase: i * 1.37, lift: 0, liftTarget: 0, scale: 1, scaleTarget: 1,
        tiltX: 0, tiltXTarget: 0, tiltY: 0, tiltYTarget: 0,
      });
    });

    /* mile markers on the shoulder opposite each card */
    const markerGeo = new THREE.PlaneGeometry(0.68, 0.9);
    members.forEach((_m, i) => {
      const side = i % 2 === 0 ? 1 : -1;
      const marker = new THREE.Mesh(
        markerGeo,
        new THREE.MeshBasicMaterial({ map: srgb(new THREE.CanvasTexture(makeMarkerCanvas(i, displayFont, monoFont))) }),
      );
      marker.position.set(side * 5.5, 0.48, FIRST_Z - i * SPACING - 1.4);
      marker.rotation.y = -side * 0.3;
      scene.add(marker);
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.52, 0.05), new THREE.MeshBasicMaterial({ color: INK }));
      post.position.set(side * 5.5, 0.13, FIRST_Z - i * SPACING - 1.42);
      scene.add(post);
    });

    /* gate — a torii-flavoured entrance rather than a straight lintel */
    const inkMat = new THREE.MeshBasicMaterial({ color: INK });
    const postGeo = new THREE.BoxGeometry(0.12, 4.1, 0.12);
    // The gate is a CESA addition — the original road has no arch over it —
    // so it belongs to our dressing only.
    for (const x of [-5.0, 5.0]) {
      const post = new THREE.Mesh(postGeo, inkMat);
      post.position.set(x, 2.05, -8.5);
      scene.add(post);
      oursOnly.push(post);
    }
    const beam = new THREE.Mesh(
      new THREE.PlaneGeometry(10, 0.6),
      new THREE.MeshBasicMaterial({ map: srgb(new THREE.CanvasTexture(makeBeamCanvas(monoFont))) }),
    );
    beam.position.set(0, 3.75, -8.5);
    scene.add(beam);
    oursOnly.push(beam);

    /* THE END sign — road.js's closer, straddling the road out of the fog,
       with its own reflection, two posts and a ground shadow. Geometry and
       offsets are the original's: 4.6x2.88 at y1.98 with a 0.015 tilt, the
       reflection mirrored at -1.98 on 0.3 opacity, posts at x +/-1.9. Only in
       "Original" — our walk closes on the painted end wall. */
    const origSignGeo = new THREE.PlaneGeometry(4.6, 2.88);
    const origSignMat = new THREE.MeshBasicMaterial({
      map: srgb(new THREE.CanvasTexture(makeEndSignCanvas(displayFont, monoFont))),
    });
    const origSign = new THREE.Mesh(origSignGeo, origSignMat);
    origSign.position.set(0, 1.98, signZ);
    origSign.rotation.z = 0.015;
    scene.add(origSign);
    origOnly.push(origSign);

    const origSignReflMat = origSignMat.clone();
    origSignReflMat.transparent = true;
    origSignReflMat.opacity = 0.3;
    origSignReflMat.depthWrite = false;
    origSignReflMat.side = THREE.DoubleSide;
    const origSignRefl = new THREE.Mesh(origSignGeo, origSignReflMat);
    origSignRefl.scale.set(1, -1, 1);
    origSignRefl.rotation.z = -0.015;
    origSignRefl.position.set(0, -1.98, signZ);
    scene.add(origSignRefl);
    origOnly.push(origSignRefl);

    const origSignPostGeo = new THREE.BoxGeometry(0.1, 0.6, 0.1);
    for (const x of [-1.9, 1.9]) {
      const p = new THREE.Mesh(origSignPostGeo, inkMat);
      p.position.set(x, 0.3, signZ - 0.02);
      scene.add(p);
      origOnly.push(p);
    }
    const origSignShadow = new THREE.Mesh(new THREE.PlaneGeometry(5.2, 1.8), shadowMat.clone());
    origSignShadow.rotation.x = -Math.PI / 2;
    origSignShadow.position.set(0, 0.014, signZ);
    origSignShadow.renderOrder = OVER_GROUND;
    scene.add(origSignShadow);
    origOnly.push(origSignShadow);

    /* sun texture shared by every glow, incl. lamp heads */
    const sunTex = srgb(new THREE.CanvasTexture(makeSunCanvas()));

    /* lamps — the painted stone lantern (toro), replacing the procedural
       pole+bulb. A soft glow sprite still sits behind the lit window for
       light-bleed onto the ground/grass around it, since the painted glow
       alone doesn't illuminate neighbouring geometry. */
    const lanternTex = srgb(new THREE.Texture(groundLanternImg));
    lanternTex.needsUpdate = true;
    const LANTERN_H = 2.0;
    const LANTERN_W = LANTERN_H * (groundLanternImg.width / groundLanternImg.height);
    const lanternMat = new THREE.MeshBasicMaterial({ map: lanternTex, transparent: true });
    const lanternGeo = new THREE.PlaneGeometry(LANTERN_W, LANTERN_H);
    const glowMat = new THREE.SpriteMaterial({ map: sunTex, transparent: true, opacity: 0.5, depthWrite: false });
    for (let z = -12.5; z > lastZ - 3; z -= 8.6) {
      for (const x of [-6.1, 6.1]) {
        const lantern = new THREE.Mesh(lanternGeo, lanternMat);
        lantern.position.set(x, LANTERN_H / 2 - 0.05, z);
        lantern.rotation.y = -Math.sign(x) * 0.2;
        scene.add(lantern);
        const glow = new THREE.Sprite(glowMat);
        glow.scale.set(0.7, 0.7, 1);
        glow.position.set(x, LANTERN_H * 0.62, z);
        glow.renderOrder = OVER_GROUND;
        scene.add(glow);
        // Tagged here rather than matched by texture: these share the
        // procedural sun texture with the sun and halo, which the original
        // road has too, so classifying by map would take those out with them.
        oursOnly.push(lantern, glow);
      }
    }

    /* roped lantern garland — used as-is, as continuous "walls" flanking
       the path rather than separate floating patches: RepeatWrapping on
       the texture's U axis literally attaches its right edge back onto
       its left edge, so one strip repeats the whole length of the walk
       with no manual seam-matching needed. Transparent background means
       there's no wall *surface* for a seam to show on the way the old
       corridor-wall painting had — just lanterns on invisible rope, so
       any tiny mismatch in the rope's exact slope at the repeat point is
       effectively invisible.
       Built as discrete butted segments (like the fence), not one giant
       UV-tiled plane — a single long plane nearly edge-on to the camera
       is far more sensitive to the camera's side-sway and roll than a
       frontal object is, which read as the lanterns drifting at a
       different speed than everything else even though the underlying
       world-space motion was identical. Real per-segment objects move
       exactly like the fence/trees/lamps do. */
    const ROPE_W = 5.6;
    const ROPE_H = ROPE_W * (ropedLanternsImg.height / ropedLanternsImg.width);
    const ropedTex = srgb(new THREE.Texture(ropedLanternsImg));
    ropedTex.needsUpdate = true;
    const ropedGeo = new THREE.PlaneGeometry(ROPE_W, ROPE_H);
    const ropedMat = new THREE.MeshBasicMaterial({
      map: ropedTex, transparent: true, side: THREE.DoubleSide, depthWrite: false,
    });
    for (let z = 3; z > lastZ - 6; z -= ROPE_W) {
      for (const x of [-6.0, 6.0]) {
        const segment = new THREE.Mesh(ropedGeo, ropedMat);
        segment.rotation.y = Math.PI / 2;
        segment.position.set(x, 3.4, z);
        scene.add(segment);
      }
    }

    /* the closing wall — spans the full width of the walk at the far end,
       past the last card, replacing the old sign board as the thing the
       path visually resolves into. Green-screened (not a painted sky
       plate like the earlier corridor-wall attempt), so it sits correctly
       in front of the mountains/sky instead of showing a seam between two
       different painted skies. */
    const endWallTex = srgb(new THREE.Texture(endWallImg));
    endWallTex.needsUpdate = true;
    // Width and height are no longer tied to the source image's own
    // aspect ratio — scaling the whole plate down to fit under the tree
    // height was also shrinking it too narrow to fill the screen, since
    // one number (an aspect-locked scale) can't satisfy two independent
    // targets (a width and a height that don't share that aspect). Instead
    // the plane is sized directly to what's wanted, and the TEXTURE is
    // cropped (repeat/offset) to keep it from looking stretched: only the
    // upper ~74% of the source (the roofline + blossoms, the most
    // distinctive part) is sampled, dropping some of the plain lower wall
    // panel rather than squashing the whole image into a shorter box.
    // 32, not 18: the camera only gets close enough to the wall for an
    // 18-wide plane to fill the screen edge to edge in the last ~4% of
    // scroll (progress ~0.955+) — which is already inside the 0.93 fade
    // start, so it was never actually visible at full width before it
    // began dissolving. Wide enough that the fill happens by ~progress
    // 0.90, with real margin before the fade begins.
    const END_WALL_W = 32;
    const END_WALL_H = 3.6;
    endWallTex.repeat.set(1, 0.74);
    endWallTex.offset.set(0, 0.26);
    const endWall = new THREE.Mesh(
      new THREE.PlaneGeometry(END_WALL_W, END_WALL_H),
      new THREE.MeshBasicMaterial({ map: endWallTex, transparent: true }),
    );
    // Pulled in closer to the last card (and further into the tail end of
    // the tree rows, which now run a bit past it — see TREE range below)
    // so there are visibly trees behind the wall, not just at its edges.
    endWall.position.set(0, END_WALL_H / 2, lastZ - 6);
    scene.add(endWall);

    /* sun + glow streak down the path */
    const sun = new THREE.Mesh(
      new THREE.PlaneGeometry(10.6, 10.6),
      new THREE.MeshBasicMaterial({ map: sunTex, transparent: true, depthWrite: false, fog: false }),
    );
    sun.position.set(0, 4.3, sunZ);
    sun.renderOrder = OVER_GROUND;
    const halo = sun.clone();
    halo.material = (sun.material as THREE.MeshBasicMaterial).clone();
    (halo.material as THREE.MeshBasicMaterial).opacity = 0.5;
    halo.scale.setScalar(2.1);
    halo.position.z = sunZ - 1.5;
    halo.renderOrder = OVER_GROUND;
    scene.add(halo, sun);

    const streak = new THREE.Mesh(
      new THREE.PlaneGeometry(2.5, 28),
      new THREE.MeshBasicMaterial({ map: sunTex, transparent: true, opacity: 0.5, depthWrite: false, fog: false }),
    );
    streak.rotation.x = -Math.PI / 2;
    streak.position.set(0, 0.013, sunZ + 15);
    streak.renderOrder = OVER_GROUND;
    scene.add(streak);


    /* dust — soft round motes drifting the length of the walk */
    const N = 240;
    const dustPos = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) {
      dustPos[i * 3] = (Math.random() - 0.5) * 34;
      dustPos[i * 3 + 1] = Math.random() * 6.5;
      dustPos[i * 3 + 2] = 4 - Math.random() * (travel + 28);
    }
    const dustGeo = new THREE.BufferGeometry();
    dustGeo.setAttribute("position", new THREE.BufferAttribute(dustPos, 3));
    const dotCanvas = document.createElement("canvas");
    dotCanvas.width = dotCanvas.height = 64;
    const dctx = dotCanvas.getContext("2d")!;
    const dg = dctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    dg.addColorStop(0, "rgba(255,255,255,1)");
    dg.addColorStop(0.5, "rgba(255,255,255,0.6)");
    dg.addColorStop(1, "rgba(255,255,255,0)");
    dctx.fillStyle = dg;
    dctx.fillRect(0, 0, 64, 64);
    const dust = new THREE.Points(
      dustGeo,
      new THREE.PointsMaterial({
        color: 0xc9a5a0, size: 0.07, alphaMap: new THREE.CanvasTexture(dotCanvas),
        transparent: true, opacity: 0.4, depthWrite: false,
      }),
    );
    dust.renderOrder = OVER_GROUND;
    scene.add(dust);

    /* falling petals — real 3D sprites positioned in world space (not a
       flat 2D canvas laid over the whole screen), so they have genuine
       depth/parallax as the camera moves through them instead of sticking
       to the viewport like a screen-space overlay. The actual petal art
       (same files the hero's PetalCanvas uses), not a procedural shape —
       three variants cycled so it doesn't look like one sprite stamped
       everywhere. Sprite.material.rotation gives them a real tumble even
       though a sprite always faces the camera. */
    const petalVariants = [petalImg1, petalImg2, petalImg3].map((img) => {
      const tex = srgb(new THREE.Texture(img));
      tex.needsUpdate = true;
      return {
        aspect: img.height / img.width,
        mat: new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false }),
      };
    });
    type Petal = { sprite: THREE.Sprite; vy: number; vx: number; seed: number; spin: number };
    // Spawn only at the right-side tree canopy's upper branches (matching
    // where the right-side trees actually sit, x = 8.3 to 10.3, near the
    // top of TREE_H) and drift left the full width of the path toward the
    // left tree line's base, not just to wherever they happen to hit the
    // road — vy is deliberately slow relative to vx (roughly matching the
    // ~4-unit drop against the ~18-unit crossing) so a petal reaches
    // near-ground height right around when it reaches the left side,
    // instead of landing abruptly in the middle of the path right in
    // front of the camera.
    function spawnPetal(p: Petal, atCanopy: boolean) {
      p.sprite.position.set(
        8.3 + Math.random() * 2,
        atCanopy ? 3.9 + Math.random() * 0.6 : Math.random() * 4.4,
        4 - Math.random() * (travel + 24),
      );
      p.seed = Math.random() * Math.PI * 2;
      p.vy = 0.06 + Math.random() * 0.06;
      p.vx = -(0.45 + Math.random() * 0.35);
      p.spin = (Math.random() - 0.5) * 1.4;
    }
    const petals: Petal[] = [];
    const PETAL_N = 75;
    for (let i = 0; i < PETAL_N; i++) {
      const variant = petalVariants[i % petalVariants.length];
      const size = 0.3 + Math.random() * 0.22;
      // Each sprite needs its OWN material instance, not the shared one —
      // material.rotation (used below for tumble) is a property of the
      // material, not the sprite, so sprites sharing one material all
      // showed the exact same rotation at every instant. That was the
      // actual cause of "they all look the same", not just the count.
      const sprite = new THREE.Sprite(variant.mat.clone());
      sprite.material.rotation = Math.random() * Math.PI * 2;
      sprite.scale.set(size, size * variant.aspect, 1);
      sprite.renderOrder = OVER_GROUND;
      scene.add(sprite);
      const p: Petal = { sprite, vy: 0, vx: 0, seed: 0, spin: 0 };
      spawnPetal(p, false);
      petals.push(p);
    }

    /* Debug dressing groups.
     *
     * Classified by walking the finished scene and matching each material's
     * texture back to the image it was built from, rather than tagging every
     * mesh at its creation site. The props are added across ~400 lines in a
     * dozen loops, so tagging inline would mean touching all of them and
     * would rot the moment a prop moves; the source image is the thing that
     * actually defines what a prop IS. `scene.traverse` reaches the camera's
     * children too, since the camera is parented into the scene for the sky.
     *
     * The road furniture (edges, dashes, dust, sun, halo, streak) and the
     * cards are in BOTH modes — they are the original road, which this walk
     * was ported from. "Road" mode is this scene with the garden dressing
     * taken away, not a different scene. */
    const gardenImages = new Set<unknown>([
      sidePlantsImg, groundLanternImg, ropedLanternsImg, fieldGrassImg,
      fenceImg, treeAImg, treeBImg, endWallImg,
    ]);
    const gardenObjects: THREE.Object3D[] = [];
    const horizonObjects: THREE.Object3D[] = [];
    scene.traverse((o) => {
      const map = (o as THREE.Mesh & { material?: { map?: THREE.Texture } }).material?.map;
      const img = map?.image as unknown;
      if (!img) return;
      if (gardenImages.has(img)) gardenObjects.push(o);
      else if (img === mountainsImg) horizonObjects.push(o);
    });

    /* state */
    let target = 0, progress = 0, vel = 0, velSm = 0, mouseX = 0, swayX = 0;
    let activeIdx = -1, running = true, hintFlipped = false;
    let baseFov = 64, fovCur = 64;
    let hoveredCard: Card | null = null;

    const raycaster = new THREE.Raycaster();
    const pointerNDC = new THREE.Vector2();
    let pointerOnCanvas = false;

    // Driven from the SAME rAF loop as everything else below, advanced by
    // elapsed time rather than a separate setInterval. The previous version
    // stored its running timer on the DOM node itself (`el._scrambler`) —
    // that is exactly the kind of state that gets orphaned when an effect
    // is torn down and re-run (React's dev-mode double-invoke does this on
    // every mount), which is what caused the title to visibly stick on an
    // old member while the number and role kept updating correctly right
    // next to it. Keeping the scramble's state in this closure means the
    // effect's own cleanup is the only thing that can end it.
    const SCRAMBLE_DURATION = 0.4;
    let scrambleText = "";
    let scrambleElapsed = SCRAMBLE_DURATION;

    function setHudMember(i: number) {
      const m = members[i];
      if (hudNumRef.current) hudNumRef.current.textContent = pad2(i);
      if (hudMetaRef.current) hudMetaRef.current.textContent = m.role.toUpperCase();
      scrambleText = m.name;
      scrambleElapsed = 0;
    }

    function tickScramble(dt: number) {
      const el = hudTitleRef.current;
      if (!el || scrambleElapsed >= SCRAMBLE_DURATION) return;
      scrambleElapsed = Math.min(SCRAMBLE_DURATION, scrambleElapsed + dt);
      const len = scrambleText.length;
      const settled = Math.floor((scrambleElapsed / SCRAMBLE_DURATION) * len);
      if (scrambleElapsed >= SCRAMBLE_DURATION) {
        el.textContent = scrambleText;
        return;
      }
      let out = "";
      for (let i = 0; i < len; i++) {
        out += i < settled || scrambleText[i] === " "
          ? scrambleText[i]
          : SCRAMBLE_CHARS[(Math.random() * SCRAMBLE_CHARS.length) | 0];
      }
      el.textContent = out;
    }

    function updateHover() {
      if (!running || !pointerOnCanvas) return;
      raycaster.setFromCamera(pointerNDC, camera);
      const hits = raycaster.intersectObjects(cardMeshes, false);
      const hit = hits.length ? hits[0] : null;
      const mesh = hit && (hit.object as THREE.Mesh);
      if (hoveredCard && mesh === hoveredCard.mesh) {
        hoveredCard.tiltYTarget = (hit!.uv!.x - 0.5) * -0.22;
        hoveredCard.tiltXTarget = (hit!.uv!.y - 0.5) * 0.16;
        return;
      }
      if (hoveredCard) {
        hoveredCard.liftTarget = 0; hoveredCard.scaleTarget = 1;
        hoveredCard.tiltXTarget = 0; hoveredCard.tiltYTarget = 0;
      }
      hoveredCard = mesh ? cards[(mesh.userData as { index: number }).index] : null;
      if (hoveredCard) { hoveredCard.liftTarget = 0.16; hoveredCard.scaleTarget = 1.07; }
    }

    function onPointerMove(e: PointerEvent) {
      const r = canvas!.getBoundingClientRect();
      pointerNDC.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
      pointerOnCanvas = true;
      updateHover();
    }
    function onPointerLeave() {
      pointerOnCanvas = false;
      if (hoveredCard) {
        hoveredCard.liftTarget = 0; hoveredCard.scaleTarget = 1;
        hoveredCard.tiltXTarget = 0; hoveredCard.tiltYTarget = 0;
        hoveredCard = null;
      }
    }
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerleave", onPointerLeave);

    function onWindowPointerMove(e: PointerEvent) {
      mouseX = (e.clientX / window.innerWidth) * 2 - 1;
    }
    window.addEventListener("pointermove", onWindowPointerMove);

    function resize() {
      const w = canvas!.clientWidth || 1;
      const h = canvas!.clientHeight || 1;
      camera.aspect = w / h;
      baseFov = w / h < 0.75 ? 76 : 64;
      camera.updateProjectionMatrix();
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(w, h, false);
      sizeSky();
    }
    resize();
    window.addEventListener("resize", resize);

    let frame = 0;
    const clock = new THREE.Clock();
    let lastScrollY = window.scrollY;

    function tick() {
      if (!running) { frame = requestAnimationFrame(tick); return; }
      const dt = Math.min(clock.getDelta(), 0.05);
      const t = clock.elapsedTime;

      // Read straight off the ref each frame rather than rebuilding the scene
      // on change: flipping `visible` is free, and it makes the debug toggles
      // instant instead of tearing down and reloading every texture.
      const dbg = debugRef.current;
      const showGarden = dbg.dressing === "garden";
      for (const o of gardenObjects) o.visible = showGarden;
      for (const o of oursOnly) o.visible = showGarden;
      for (const o of origOnly) o.visible = !showGarden;
      // Cherry petals are ours; the original drives through dust, which stays
      // in both because road.js has it too.
      for (const p of petals) p.sprite.visible = showGarden;
      if (!showGarden) {
        origSign.position.y = 1.98 + Math.sin(t * 0.55) * 0.03;
        origSignRefl.position.y = -origSign.position.y;
      }
      // Independent of the dressing: road.js has no horizon plate of its own,
      // but this is a comparison harness, so both combinations have to be
      // reachable. Original defaults to none (see the panel), which is the
      // faithful pairing — this just doesn't force it.
      for (const o of horizonObjects) o.visible = dbg.horizon !== "none";

      const rect = wrapper!.getBoundingClientRect();
      const total = rect.height - window.innerHeight;
      target = total > 0 ? clamp(-rect.top / total, 0, 1) : 0;

      const rawVel = dt > 0 ? (window.scrollY - lastScrollY) / dt : 0;
      lastScrollY = window.scrollY;
      vel = rawVel;

      const k = Math.min(1, dt * 4.5);
      progress += (target - progress) * k;

      const camZ = -progress * travel;
      swayX += (mouseX * 0.55 - swayX) * Math.min(1, dt * 2.2);
      camera.position.set(swayX, 1.6 + Math.sin(t * 0.4) * 0.03, camZ);
      camera.lookAt(swayX * 0.35, 1.45, camZ - 9);

      // Shadow-casting light rides along with the camera — a single static
      // frustum can't cover the whole ~100-unit walk at usable resolution,
      // so instead it keeps a fixed offset (low, from the left, matching
      // the evening-sun direction) and only the near few tree rows around
      // the player actually get sharp shadows, which is the only part
      // ever on screen anyway.
      sunLight.position.set(swayX - 12, 9, camZ + 6);
      sunLight.target.position.set(swayX + 2, 0, camZ - 6);
      sunLight.target.updateMatrixWorld();
      // High and far enough left that it sits above the mountain ridge
      // in the sky, not overlapping the silhouette shape — a transparent
      // object always draws after (on top of) the opaque mountain plate
      // in this renderer's queue regardless of actual distance, so the
      // only real fix for "sun in front of the mountain" is keeping them
      // apart in screen space rather than fighting draw order.
      // swayX is heavily damped (not applied 1:1 like it is for near
      // objects) because something this far away should barely seem to
      // move at all as the camera sways side to side — full 1:1 sway on a
      // "distant" object is what was reading as wobble.
      sunDisc.position.set(swayX * 0.12 - 15, 10.5, camZ - 20);

      velSm += (vel - velSm) * Math.min(1, dt * 3);
      camera.rotation.z += THREE.MathUtils.clamp(velSm * 0.00002, -0.035, 0.035);

      const speed = Math.min(Math.abs(velSm) / 2600, 1);
      fovCur += (baseFov + speed * 9 - fovCur) * Math.min(1, dt * 5);
      if (Math.abs(camera.fov - fovCur) > 0.03) { camera.fov = fovCur; camera.updateProjectionMatrix(); }

      // Original mode fogs to the road's own BONE (#d8d5d1), a greyer, cooler
      // base than our cream washi — the pale high-key haze is a large part of
      // why that scene reads the way it does.
      (scene.fog as THREE.Fog).color
        .copy(showGarden ? WASHI : BONE)
        .lerp(showGarden ? DUSK : ORIG_DUSK, progress * 0.8);

      const lerpK = Math.min(1, dt * 8);
      for (const c of cards) {
        const z = c.baseZ + c.side * progress * DRIFT;
        c.lift += (c.liftTarget - c.lift) * lerpK;
        c.scale += (c.scaleTarget - c.scale) * lerpK;
        c.tiltX += (c.tiltXTarget - c.tiltX) * lerpK;
        c.tiltY += (c.tiltYTarget - c.tiltY) * lerpK;
        const y = c.baseY + Math.sin(t * 0.7 + c.phase) * 0.045 + c.lift;
        c.mesh.position.z = z;
        c.mesh.position.y = y;
        c.mesh.scale.setScalar(c.scale);
        c.mesh.rotation.set(c.tiltX, c.baseRotY + c.tiltY, c.baseRotZ);
        c.shadow.position.z = z;
        (c.shadow.material as THREE.MeshBasicMaterial).opacity = 0.4 + c.lift * 0.9;
        const sc = 1 + c.lift * 0.55;
        c.shadow.scale.set(sc, sc, 1);
        c.refl.position.z = z;
        c.refl.position.y = -y;
        c.refl.scale.set(c.scale, -c.scale, 1);
        c.refl.rotation.set(-c.tiltX, c.baseRotY + c.tiltY, -c.baseRotZ);
      }
      if (target !== progress) updateHover();

      sun.scale.setScalar(1 + Math.sin(t * 0.8) * 0.02);

      // Real fall: move each sprite's actual position every frame rather
      // than faking motion with a texture scroll, so parallax against the
      // trees/ground stays correct from every camera angle.
      for (const p of petals) {
        // Floored at 0.03, not left to go negative — a sprite has no
        // actual floor collision, so without this it kept sinking straight
        // through the visible ground plane instead of resting on it.
        p.sprite.position.y = Math.max(0.03, p.sprite.position.y - p.vy * dt);
        p.sprite.position.x += p.vx * dt + Math.sin(t * 0.5 + p.seed) * dt * 0.15;
        p.sprite.material.rotation += p.spin * dt;
        // Respawns once it actually reaches the left tree line's base —
        // the only trigger now, since y can no longer go low enough on
        // its own to signal "done".
        if (p.sprite.position.x < -8.3) spawnPetal(p, true);
      }

      /* Closing transition — the sign board used to mark "the end", now
         the scene itself dissolves back to plain washi paper over the
         last stretch of scroll instead, which reads as a real transition
         out of the 3D walk rather than just stopping. */
      const endFade = 1 - THREE.MathUtils.clamp((progress - 0.93) / 0.07, 0, 1);
      canvas!.style.opacity = String(endFade);
      // The HUD text is a separate DOM overlay, not part of the canvas —
      // fading the canvas alone left the name/role/hint text fully opaque
      // and floating over blank washi once the 3D scene had dissolved out.
      if (hudWrapRef.current) hudWrapRef.current.style.opacity = String(endFade);

      /* HUD */
      // The coral dusk wash over the canvas is ours; the original road never
      // warms the frame like this, it only lerps its fog. Held at 0 there.
      if (duskRef.current) {
        duskRef.current.style.setProperty("--dusk", showGarden ? (progress * 0.55).toFixed(3) : "0");
      }
      if (hudFillRef.current) hudFillRef.current.style.width = `${(progress * 100).toFixed(2)}%`;
      if (hudOdoRef.current) hudOdoRef.current.textContent = `${(progress * travel).toFixed(1).padStart(5, "0")} M`;
      const flip = progress > 0.92;
      if (flip !== hintFlipped) {
        hintFlipped = flip;
        if (hudHintRef.current) {
          hudHintRef.current.innerHTML = flip
            ? "THAT'S EVERYONE —<br/>SEE YOU AROUND ↓"
            : "KEEP SCROLLING —<br/>MEET THE TEAM";
        }
      }
      const idx = THREE.MathUtils.clamp(Math.round((-camZ - 4.5) / SPACING), 0, count - 1);
      if (idx !== activeIdx) { activeIdx = idx; setHudMember(idx); }
      tickScramble(dt);

      renderer.render(scene, camera);
      frame = requestAnimationFrame(tick);
    }
    frame = requestAnimationFrame(tick);

    const observer = new IntersectionObserver(([entry]) => { running = entry.isIntersecting; }, { threshold: 0 });
    observer.observe(wrapper);

      cleanup = () => {
        cancelAnimationFrame(frame);
        observer.disconnect();
        window.removeEventListener("resize", resize);
        window.removeEventListener("pointermove", onWindowPointerMove);
        canvas.removeEventListener("pointermove", onPointerMove);
        canvas.removeEventListener("pointerleave", onPointerLeave);
        renderer.dispose();
      };
    })();

    return () => {
      cancelled = true;
      cleanup();
    };
  }, [reduced, members]);

  // +100, not +60 — the wall-approach and fade-out at the tail end take a
  // fixed amount of world distance regardless of member count, so without
  // extra scroll buffer here they were eating into the last card's own
  // dwell time instead of getting room of their own.
  const heightVh = members.length * 55 + 100;

  if (reduced) {
    return (
      <div className="grid grid-cols-2 gap-6 px-8 py-16 sm:grid-cols-3">
        {members.map((m) => (
          <div key={m.name} className="text-center">
            <p className="font-display text-ink">{m.name}</p>
            <p className="font-mono text-xs text-muted">{m.role.toUpperCase()}</p>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div ref={wrapperRef} className="relative" style={{ height: `${heightVh}vh` }}>
      {/* The canvas is transparent, so this is the sky wherever no geometry
          covers it. Our washi cream is warmer than the road's bone, which is
          most of why Original still read pink even with the ridge hidden. */}
      <div
        className="sticky top-0 h-screen w-full overflow-hidden bg-washi"
        style={dressing === "road" ? { backgroundColor: "#d8d5d1" } : undefined}
      >
        <div
          ref={duskRef}
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            background: "radial-gradient(70% 60% at 50% 55%, rgba(244,121,111,0.55), rgba(244,121,111,0) 72%)",
            opacity: "var(--dusk, 0)",
          }}
        />
        <canvas ref={canvasRef} className="absolute inset-0 block h-full w-full" />

        {debugOn && (
          <div className="absolute right-4 top-4 z-[9] w-[13rem] rounded-md border border-washi/25 bg-ink/80 p-3 font-mono text-[0.625rem] text-washi backdrop-blur-sm">
            <p className="mb-2 tracking-[0.18em] text-washi/60">
              SCENE DEBUG <span className="text-washi/35">· D</span>
            </p>

            <p className="mb-1 text-washi/60">Dressing</p>
            <div className="mb-3 flex gap-1">
              {(["garden", "road"] as const).map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => {
                    setDressing(v);
                    // Default each dressing to its own faithful backdrop:
                    // road.js has no horizon plate at all, ours is built
                    // around one. Still overridable afterwards.
                    setHorizon(v === "road" ? "none" : "mountains");
                  }}
                  className={
                    "flex-1 rounded-sm border px-2 py-1 capitalize transition-colors " +
                    (dressing === v
                      ? "border-torii bg-torii/25 text-washi"
                      : "border-washi/25 text-washi/65 hover:border-washi/50")
                  }
                >
                  {v === "garden" ? "new" : "original"}
                </button>
              ))}
            </div>

            <p className="mb-1 text-washi/60">Background</p>
            <div className="flex gap-1">
              {(["mountains", "none"] as const).map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setHorizon(v)}
                  className={
                    "flex-1 rounded-sm border px-2 py-1 capitalize transition-colors " +
                    (horizon === v
                      ? "border-torii bg-torii/25 text-washi"
                      : "border-washi/25 text-washi/65 hover:border-washi/50")
                  }
                >
                  {v}
                </button>
              ))}
            </div>
          </div>
        )}

        <div
          ref={hudWrapRef}
          className="pointer-events-none absolute inset-0 z-[3]"
          style={{
            // Fades the chip's own blur+tint out toward its edges instead
            // of cutting off in a hard rectangle — a radial mask, not a
            // background gradient, since it's the backdrop-blur itself
            // that needs to taper, not just the tint colour on top of it.
            "--chip-mask": "radial-gradient(ellipse 100% 100% at center, black 55%, transparent 100%)",
          } as CSSProperties}
        >
          {/* Frosted-glass chips instead of text-shadow tricks — a shadow
              or outline only ever approximates contrast against whatever
              happens to be behind it, and kept reading as blurry/messy at
              small sizes no matter how it was tuned. A real translucent
              backdrop-blur panel guarantees legibility against any part of
              the scene, the same way a HUD overlay would in a real game.
              The mask lives on a separate absolutely-positioned layer
              BEHIND the text, not on the same element as the text — a mask
              fades everything it's applied to, so putting it directly on
              the text element was fading the words themselves at the
              edges, not just the backdrop tint. */}
          {/* Clears the site nav's CESA badge, which hangs ~150/1920 of the
              width down over the walk's first screen on /team. */}
          <div className="absolute left-[clamp(18px,3vw,40px)] top-[max(64px,9.4vw)] px-3 py-2">
            <div
              className="absolute inset-0 bg-ink/18 backdrop-blur-sm"
              style={{ WebkitMaskImage: "var(--chip-mask)", maskImage: "var(--chip-mask)" }}
            />
            <p className="relative font-mono text-[0.6875rem] tracking-[0.2em] text-washi">
              CESA COMMITTEE <span ref={hudCountRef} className="text-washi/70" />
            </p>
          </div>

          <div className="absolute bottom-[80px] left-[clamp(18px,3vw,40px)] max-w-[44vw] px-5 py-4">
            <div
              className="absolute inset-0 bg-ink/18 backdrop-blur-sm"
              style={{ WebkitMaskImage: "var(--chip-mask)", maskImage: "var(--chip-mask)" }}
            />
            <p
              ref={hudNumRef}
              className="relative font-display leading-none text-transparent"
              style={{ fontSize: "clamp(40px, 5.4vw, 84px)", WebkitTextStroke: "1.5px var(--color-torii)" }}
            >
              01
            </p>
            <div className="relative overflow-hidden">
              <h2 ref={hudTitleRef} className="mt-2 font-display text-[clamp(1.5rem,3.2vw,3rem)] leading-[1.04] text-washi">
                —
              </h2>
            </div>
            <p ref={hudMetaRef} className="relative mt-2.5 font-mono text-[0.75rem] tracking-[0.12em] text-washi/70">
              —
            </p>
          </div>

          <div className="absolute bottom-[80px] right-[clamp(18px,3vw,40px)] px-4 py-3">
            <div
              className="absolute inset-0 bg-ink/18 backdrop-blur-sm"
              style={{ WebkitMaskImage: "var(--chip-mask)", maskImage: "var(--chip-mask)" }}
            />
            <p ref={hudHintRef} className="relative text-right font-mono text-[0.6875rem] tracking-[0.14em] text-washi/80">
              KEEP SCROLLING —<br />MEET THE TEAM
            </p>
          </div>
          <div className="absolute bottom-[54px] right-[clamp(18px,3vw,40px)] px-4 py-2.5">
            <div
              className="absolute inset-0 bg-ink/18 backdrop-blur-sm"
              style={{ WebkitMaskImage: "var(--chip-mask)", maskImage: "var(--chip-mask)" }}
            />
            <p
              ref={hudOdoRef}
              className="relative font-mono text-[0.6875rem] tracking-[0.14em] text-washi/80"
              style={{ fontVariantNumeric: "tabular-nums" }}
            >
              000.0 M
            </p>
          </div>
          <div
            className="absolute bottom-[44px] left-[clamp(18px,3vw,40px)] right-[clamp(18px,3vw,40px)] h-[2px]"
            style={{ background: "rgba(42,26,46,0.14)" }}
          >
            <span ref={hudFillRef} className="block h-full w-0 bg-torii" />
          </div>
        </div>
      </div>
    </div>
  );
}
