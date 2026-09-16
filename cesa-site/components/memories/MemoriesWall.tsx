"use client";

import gsap from "gsap";
import { useEffect, useRef, useState } from "react";
import type * as THREE from "three";

import { clamp, lerp, useHasPointer, useReducedMotion } from "@/lib/motion";

const vw = (px: number) => `${(px / 19.2).toFixed(4)}vw`;

/** Four cards per deck; each flip turns the wall over to the next deck. */
const DECKS = 3;
const PER_DECK = 4;
const FLIPS = DECKS - 1;

/** Soft tints for the placeholder photo wells, from the sky ramp. */
const TINTS = ["#f3c9cf", "#f6d2bd", "#dcc6dc", "#f7dfc0"];

/* ------------------------------------------------------------------------
 * The space, in world units (roughly metres).
 *
 * Cards stand on an arc of a circle centred on the camera, so the wall curves
 * round the viewer and the outer pair turn in to face them. The arc rides
 * with the camera; everything else — lanterns, dust, petals, the floor — is
 * fixed in the world, so scrolling carries the wall forward through the room
 * and the room passes by on both sides.
 * ---------------------------------------------------------------------- */

const CARD_W = 1.7;
/** Portrait, like a print — the old 1.3 read as square at this size. */
const CARD_H = CARD_W * 1.42;
/** Corner radius. Cards are rounded shapes, not boxes. */
const CARD_R = 0.09;
/** Real thickness: an edge you can see while a card is turning. */
const CARD_T = 0.035;
/** Gap between the floor and a card's bottom edge. */
const CARD_LIFT = 0.14;
const RADIUS = 9;
const ANGLES = [-26, -8.5, 8.5, 26].map((d) => (d * Math.PI) / 180);

/** World units the camera travels over the whole section. */
const TRAVEL = 30;
/** The camera looks level at the middle of the wall; framing is done in the
 *  projection (see `fit` below), not by tilting the camera. */
const WALL_Y = CARD_LIFT + CARD_H / 2;

/*
 * Portrait screens stack the same four cards two by two instead of stretching
 * one row across a narrow screen, where each card came out a thumbnail. Below
 * this aspect ratio the wall is a 2x2 grid; above it, the curved row.
 */
const GRID_BELOW_ASPECT = 0.9;
/** Gaps between grid cards, in world units. */
const GRID_GAP_X = 0.16;
const GRID_GAP_Y = 0.28;
const GRID_COL_X = CARD_W / 2 + GRID_GAP_X / 2;
const GRID_ROW_Y = [CARD_LIFT + CARD_H * 1.5 + GRID_GAP_Y, CARD_LIFT + CARD_H / 2];
const GRID_WALL_Y = (GRID_ROW_Y[0] + GRID_ROW_Y[1]) / 2;
const LAMP_GAP = 5.5;
const LAMP_X = 5.6;
/** A second, sparser row further out, so depth reads between the cards. */
const LAMP_X_FAR = 10.5;

const FOG = "#2a1d33";

type Three = typeof import("./three");

/*
 * Scroll choreography, in flips of progress. Scrolling down, the cards start
 * leaning at WIND_START and slam over at FLIP_AT. Scrolling up they turn back
 * once progress drops under RETURN_AT, a little lower than FLIP_AT so a reader
 * resting on the threshold doesn't set them flapping.
 */
const WIND_START = 0.08;
const FLIP_AT = 0.62;
const RETURN_AT = 0.5;
const DEG = Math.PI / 180;
/** How far a card leans back by the time it gives way. Only a tell. */
const MAX_LEAN = 7 * DEG;
/** Extra lean a hard scroll pushes into the cards, either direction. */
const SHOVE = 3 * DEG;

type CardMotion = { angle: number; lean: number; kick: number; lift: number; liftTarget: number };

/* ---------------------------------------------------------------- textures */

const TEX_W = 640;
const TEX_H = Math.round(TEX_W * 1.42);

function fontFamily(variable: string, fallback: string) {
  const v = getComputedStyle(document.documentElement).getPropertyValue(variable).trim();
  return v ? `${v}, ${fallback}` : fallback;
}

/** A placeholder memory, drawn once per card into its own canvas. */
function drawCard(canvas: HTMLCanvasElement, index: number) {
  const ctx = canvas.getContext("2d")!;
  const n = String(index + 1).padStart(2, "0");
  const hand = fontFamily("--face-hand", "cursive");
  const mono = fontFamily("--font-jetbrains", "monospace");

  // Paper, with a fine fleck so it doesn't read as flat plastic under light.
  ctx.fillStyle = "#ede2cf";
  ctx.fillRect(0, 0, TEX_W, TEX_H);
  let seed = index * 7919 + 17;
  const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < 1400; i++) {
    ctx.fillStyle = rand() > 0.5 ? "rgba(42,26,46,0.05)" : "rgba(255,255,255,0.18)";
    ctx.fillRect(rand() * TEX_W, rand() * TEX_H, 1.6, 1.6);
  }

  // The photo well.
  const x = 34;
  const y = 34;
  const w = TEX_W - 68;
  const h = 660;
  const well = () => {
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(x, y, w, h, 18);
    else ctx.rect(x, y, w, h);
  };
  ctx.fillStyle = TINTS[index % TINTS.length];
  well();
  ctx.fill();
  ctx.save();
  well();
  ctx.clip();
  ctx.strokeStyle = "rgba(42,26,46,0.05)";
  ctx.lineWidth = 3;
  for (let d = -h; d < w + h; d += 22) {
    ctx.beginPath();
    ctx.moveTo(x + d, y);
    ctx.lineTo(x + d - h, y + h);
    ctx.stroke();
  }
  ctx.restore();
  ctx.setLineDash([14, 10]);
  ctx.strokeStyle = "rgba(42,26,46,0.25)";
  ctx.lineWidth = 3;
  well();
  ctx.stroke();
  ctx.setLineDash([]);

  // Image glyph.
  const cx = TEX_W / 2;
  const cy = y + h / 2 - 26;
  ctx.strokeStyle = "rgba(42,26,46,0.45)";
  ctx.lineWidth = 5;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.strokeRect(cx - 58, cy - 44, 116, 88);
  ctx.beginPath();
  ctx.arc(cx - 22, cy - 12, 12, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx - 58, cy + 30);
  ctx.lineTo(cx - 20, cy - 4);
  ctx.lineTo(cx + 10, cy + 22);
  ctx.lineTo(cx + 30, cy + 6);
  ctx.lineTo(cx + 58, cy + 34);
  ctx.stroke();

  ctx.fillStyle = "rgba(42,26,46,0.5)";
  ctx.textAlign = "center";
  ctx.font = `500 22px ${mono}`;
  try {
    ctx.letterSpacing = "5px";
  } catch {
    /* older browsers */
  }
  ctx.fillText("PHOTO PLACEHOLDER", cx, cy + 96);
  try {
    ctx.letterSpacing = "0px";
  } catch {
    /* older browsers */
  }

  // Caption.
  ctx.textAlign = "left";
  ctx.fillStyle = "#2a1a2e";
  ctx.font = `400 70px ${hand}`;
  ctx.fillText(`Memory ${n}`, 46, TEX_H - 72);
  ctx.textAlign = "right";
  ctx.fillStyle = "rgba(42,26,46,0.45)";
  ctx.font = `400 26px ${mono}`;
  ctx.fillText(`${n}/${DECKS * PER_DECK}`, TEX_W - 46, TEX_H - 80);
}

/** Soft round glow, shared by lantern heads, light pools, dust and the sun. */
function glowCanvas(stops: [number, string][], size = 128) {
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const ctx = c.getContext("2d")!;
  const r = size / 2;
  const g = ctx.createRadialGradient(r, r, 0, r, r, r);
  for (const [at, color] of stops) g.addColorStop(at, color);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  return c;
}

/** A rounded rectangle centred on the origin. */
function roundedRect(THREE: Three, w: number, h: number, r: number) {
  const shape = new THREE.Shape();
  const x = -w / 2;
  const y = -h / 2;
  shape.moveTo(x + r, y);
  shape.lineTo(x + w - r, y);
  shape.quadraticCurveTo(x + w, y, x + w, y + r);
  shape.lineTo(x + w, y + h - r);
  shape.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  shape.lineTo(x + r, y + h);
  shape.quadraticCurveTo(x, y + h, x, y + h - r);
  shape.lineTo(x, y + r);
  shape.quadraticCurveTo(x, y, x + r, y);
  return shape;
}

/** Sky: near-black overhead, warming toward a horizon the fog matches. */
function skyCanvas() {
  const c = document.createElement("canvas");
  c.width = 4;
  c.height = 512;
  const ctx = c.getContext("2d")!;
  const g = ctx.createLinearGradient(0, 0, 0, 512);
  g.addColorStop(0, "#110b17");
  g.addColorStop(0.42, "#241930");
  g.addColorStop(0.56, "#2a1d33");
  g.addColorStop(1, "#16101c");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 4, 512);
  return c;
}

/**
 * Memories — a room you move through, with the photographs standing in it.
 *
 * Four cards stand on a wall that curves round the viewer, reflected in a wet
 * floor. Scrolling carries the wall forward past lanterns, through dust and
 * falling petals. The reflections are the cards mirrored through the floor in
 * world space — not a flipped picture of them — so they follow the curve and
 * turn when the cards turn.
 *
 * The flip is weight, not bounce. Scrolling down, the cards lean back a few
 * degrees with the wheel; at the threshold they slam over, accelerating the
 * whole way and stopping dead on the new face, and the impact goes into a
 * short squash and a jolt of the camera. The rotation never passes its
 * target. Scrolling up, they simply turn back.
 */
export default function MemoriesWall() {
  const sectionRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // The 3D framing is measured from these, so the wall can never run under
  // the heading at any screen shape.
  const headRef = useRef<HTMLDivElement>(null);
  const counterRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const hasPointer = useHasPointer();
  const [deck, setDeck] = useState(0);
  /** False until the scene has compiled and drawn once; the skeleton shows until then. */
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const sectionEl = sectionRef.current;
    const canvasEl = canvasRef.current;
    if (!sectionEl || !canvasEl) return;

    // three.js is by far the heaviest thing on this page. Importing it here
    // rather than at the top of the module lets the heading, the counter and
    // the navigation hydrate without waiting for it to download and parse.
    let stop: (() => void) | undefined;
    let cancelled = false;
    // Wait for the browser to be idle before even fetching it, so the page's
    // own hydration and first paint are never queued behind a 3D renderer.
    const start = () => {
      import("./three").then((THREE) => {
        if (!cancelled) stop = run(THREE, sectionEl, canvasEl);
      });
    };
    const idle =
      typeof window.requestIdleCallback === "function" ? window.requestIdleCallback(start, { timeout: 1200 }) : window.setTimeout(start, 50);
    return () => {
      cancelled = true;
      if (typeof window.cancelIdleCallback === "function") window.cancelIdleCallback(idle);
      else window.clearTimeout(idle);
      stop?.();
    };

    function run(THREE: Three, section: HTMLElement, canvas: HTMLCanvasElement) {
    /* ---------------------------------------------------------- renderer */
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
    const anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());

    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(FOG, 10, 46);
    const skyTex = new THREE.CanvasTexture(skyCanvas());
    skyTex.colorSpace = THREE.SRGBColorSpace;
    scene.background = skyTex;

    const camera = new THREE.PerspectiveCamera(50, 1, 0.3, 220);

    const disposables: { dispose(): void }[] = [renderer, skyTex];
    const track = <T extends { dispose(): void }>(thing: T) => {
      disposables.push(thing);
      return thing;
    };
    const srgb = (tex: THREE.Texture) => {
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = anisotropy;
      return track(tex);
    };

    const warmGlow = srgb(
      new THREE.CanvasTexture(
        glowCanvas([
          [0, "rgba(255,226,200,1)"],
          [0.25, "rgba(255,180,140,0.7)"],
          [0.6, "rgba(230,130,110,0.2)"],
          [1, "rgba(230,130,110,0)"],
        ]),
      ),
    );
    const shadowGlow = srgb(
      new THREE.CanvasTexture(
        glowCanvas([
          [0, "rgba(8,4,12,0.75)"],
          [1, "rgba(8,4,12,0)"],
        ]),
      ),
    );

    /* The render order is what makes the floor wet: reflections first, the
       translucent floor over them, then glows and light pools on top. */
    const REFLECTION = 0;
    const FLOOR = 1;
    const OVER_FLOOR = 2;

    /* ------------------------------------------------------------- floor */
    const floor = new THREE.Mesh(
      track(new THREE.PlaneGeometry(260, 420)),
      // No depth write: the floor must never slice a glow behind it off with
      // a hard horizon line. Cards still occlude properly; they write depth.
      track(new THREE.MeshBasicMaterial({ color: "#1b1422", transparent: true, opacity: 0.8, depthWrite: false })),
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.z = -150;
    floor.renderOrder = FLOOR;
    scene.add(floor);

    /* Everything mirrored through the floor lives under this: scale.y = -1
       reflects a child's whole world transform, rotation and all. */
    const mirrorWorld = new THREE.Group();
    mirrorWorld.scale.y = -1;
    scene.add(mirrorWorld);

    /* ---------------------------------------------------------- lanterns */
    const postGeo = track(new THREE.BoxGeometry(0.07, 2.4, 0.07));
    const headGeo = track(new THREE.SphereGeometry(0.11, 14, 14));
    const postMat = track(new THREE.MeshBasicMaterial({ color: "#0f0a13" }));
    const headMat = track(new THREE.MeshBasicMaterial({ color: "#ffcaa0" }));
    const postMirrorMat = track(
      new THREE.MeshBasicMaterial({ color: "#0f0a13", transparent: true, opacity: 0.35, side: THREE.BackSide, depthWrite: false }),
    );
    const headMirrorMat = track(
      new THREE.MeshBasicMaterial({ color: "#ffcaa0", transparent: true, opacity: 0.35, side: THREE.BackSide, depthWrite: false }),
    );
    const glowMat = track(
      new THREE.SpriteMaterial({ map: warmGlow, transparent: true, opacity: 0.7, depthWrite: false, blending: THREE.AdditiveBlending }),
    );
    const glowMirrorMat = track(glowMat.clone());
    glowMirrorMat.opacity = 0.28;
    const poolGeo = track(new THREE.PlaneGeometry(3.2, 3.2));
    const poolMat = track(
      new THREE.MeshBasicMaterial({ map: warmGlow, transparent: true, opacity: 0.22, depthWrite: false, blending: THREE.AdditiveBlending }),
    );

    const lampSpots: [number, number][] = [];
    for (let z = 3, k = 0; z > -(TRAVEL + 60); z -= LAMP_GAP / 2, k++) {
      // Sides alternate half a gap apart, so they never pass in step.
      lampSpots.push([k % 2 === 0 ? -LAMP_X : LAMP_X, z]);
      if (k % 3 === 1) lampSpots.push([k % 2 === 0 ? LAMP_X_FAR : -LAMP_X_FAR, z - 1.2]);
    }
    for (const [x, z] of lampSpots) {

      const post = new THREE.Mesh(postGeo, postMat);
      post.position.set(x, 1.2, z);
      const head = new THREE.Mesh(headGeo, headMat);
      head.position.set(x, 2.46, z);
      const glow = new THREE.Sprite(glowMat);
      glow.scale.setScalar(1.3);
      glow.position.set(x, 2.46, z);
      glow.renderOrder = OVER_FLOOR;
      const pool = new THREE.Mesh(poolGeo, poolMat);
      pool.rotation.x = -Math.PI / 2;
      pool.position.set(x, 0.01, z);
      pool.renderOrder = OVER_FLOOR;
      scene.add(post, head, glow, pool);

      const postR = new THREE.Mesh(postGeo, postMirrorMat);
      postR.position.copy(post.position);
      postR.renderOrder = REFLECTION;
      const headR = new THREE.Mesh(headGeo, headMirrorMat);
      headR.position.copy(head.position);
      headR.renderOrder = REFLECTION;
      mirrorWorld.add(postR, headR);
      // Sprites always face the camera, so a mirrored sprite is just a lower one.
      const glowR = new THREE.Sprite(glowMirrorMat);
      glowR.scale.setScalar(1.3);
      glowR.position.set(x, -2.46, z);
      glowR.renderOrder = REFLECTION;
      scene.add(glowR);
    }

    /* -------------------------------------------------------------- dust */
    const DUST = 340;
    const dustPos = new Float32Array(DUST * 3);
    let seed = 90210;
    const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    for (let i = 0; i < DUST; i++) {
      dustPos[i * 3] = (rand() - 0.5) * 30;
      dustPos[i * 3 + 1] = 0.1 + rand() * 6;
      dustPos[i * 3 + 2] = 4 - rand() * (TRAVEL + 44);
    }
    const dustGeo = track(new THREE.BufferGeometry());
    dustGeo.setAttribute("position", new THREE.BufferAttribute(dustPos, 3));
    const dust = new THREE.Points(
      dustGeo,
      track(
        new THREE.PointsMaterial({
          map: warmGlow,
          color: "#ffd9bd",
          size: 0.075,
          transparent: true,
          opacity: 0.6,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
        }),
      ),
    );
    dust.renderOrder = OVER_FLOOR;
    scene.add(dust);

    /* ------------------------------------------------------------ petals */
    const loader = new THREE.TextureLoader();
    const petalTex = Array.from({ length: 8 }, (_, i) => srgb(loader.load(`/petals/petal-${i + 1}.webp`)));
    type Petal = { sprite: THREE.Sprite; fall: number; sway: number; phase: number; spin: number };
    const petals: Petal[] = [];
    const PETALS = reduced ? 0 : 14;
    const spawnPetal = (p: Petal, camZ: number, anywhere: boolean) => {
      p.sprite.position.set((rand() - 0.5) * 14, anywhere ? rand() * 6 : 6 + rand() * 1.5, camZ - 2 - rand() * 20);
    };
    for (let i = 0; i < PETALS; i++) {
      const mat = track(new THREE.SpriteMaterial({ map: petalTex[i % 8], transparent: true, depthWrite: false, opacity: 0.9 }));
      const sprite = new THREE.Sprite(mat);
      sprite.scale.setScalar(0.09 + rand() * 0.05);
      sprite.renderOrder = OVER_FLOOR;
      const p: Petal = { sprite, fall: 0.25 + rand() * 0.35, sway: 0.3 + rand() * 0.5, phase: rand() * 6.28, spin: (rand() - 0.5) * 2 };
      spawnPetal(p, 0, true);
      petals.push(p);
      scene.add(sprite);
    }

    /* -------------------------------------------------- sun, far ahead */
    const far = new THREE.Group();
    scene.add(far);
    // A long, gentle falloff at high resolution: a short gradient on a small
    // texture is what made the old glow read as a disc with an edge.
    const softGlow = srgb(
      new THREE.CanvasTexture(
        glowCanvas(
          [
            [0, "rgba(255,230,208,1)"],
            [0.08, "rgba(255,206,170,0.85)"],
            [0.22, "rgba(246,160,128,0.45)"],
            [0.42, "rgba(214,120,112,0.18)"],
            [0.66, "rgba(160,90,110,0.06)"],
            [1, "rgba(160,90,110,0)"],
          ],
          512,
        ),
      ),
    );
    const sunMat = track(
      new THREE.MeshBasicMaterial({ map: softGlow, transparent: true, depthWrite: false, fog: false, blending: THREE.AdditiveBlending, opacity: 0.9 }),
    );
    const sun = new THREE.Mesh(track(new THREE.PlaneGeometry(30, 30)), sunMat);
    sun.position.set(0, WALL_Y + 0.8, -70);
    const haloMat = track(sunMat.clone());
    haloMat.opacity = 0.4;
    const halo = new THREE.Mesh(track(new THREE.PlaneGeometry(90, 90)), haloMat);
    halo.position.set(0, WALL_Y + 0.8, -74);
    // The sun's light laid along the wet floor toward the viewer.
    const streakMat = track(sunMat.clone());
    streakMat.opacity = 0.3;
    const streak = new THREE.Mesh(track(new THREE.PlaneGeometry(4, 64)), streakMat);
    streak.rotation.x = -Math.PI / 2;
    streak.position.set(0, 0.012, -36);
    sun.renderOrder = halo.renderOrder = streak.renderOrder = OVER_FLOOR;
    far.add(halo, sun, streak);

    /* ------------------------------------------------------------- cards */
    const canvases = Array.from({ length: DECKS * PER_DECK }, (_, i) => {
      const c = document.createElement("canvas");
      c.width = TEX_W;
      c.height = TEX_H;
      drawCard(c, i);
      return c;
    });
    const fronts = canvases.map((c) => srgb(new THREE.CanvasTexture(c)));

    // The canvas can't trigger a web font download the way text in the page
    // does, and these faces aren't preloaded — ask for them outright, then
    // redraw once they have arrived.
    Promise.all([
      document.fonts?.load(`400 70px ${fontFamily("--face-hand", "cursive")}`),
      document.fonts?.load(`400 22px ${fontFamily("--font-jetbrains", "monospace")}`),
    ]).catch(() => undefined).then(() => {
      canvases.forEach((c, i) => drawCard(c, i));
      fronts.forEach((t) => (t.needsUpdate = true));
    });

    // A card is a rounded shape: a thin extruded rim, and a printed face laid
    // on each side just proud of it. The face UVs are remapped from shape
    // coordinates to 0..1 so the drawing fills the card.
    const shape = roundedRect(THREE, CARD_W, CARD_H, CARD_R);
    const rimGeo = track(new THREE.ExtrudeGeometry(shape, { depth: CARD_T, bevelEnabled: false, curveSegments: 10 }));
    rimGeo.translate(0, 0, -CARD_T / 2);
    const faceGeo = track(new THREE.ShapeGeometry(shape, 10));
    {
      const pos = faceGeo.attributes.position;
      const uv = faceGeo.attributes.uv;
      for (let k = 0; k < uv.count; k++) uv.setXY(k, (pos.getX(k) + CARD_W / 2) / CARD_W, (pos.getY(k) + CARD_H / 2) / CARD_H);
      uv.needsUpdate = true;
    }
    const FACE_Z = CARD_T / 2 + 0.002;
    const edgeMat = track(new THREE.MeshBasicMaterial({ color: "#d6c8ae" }));
    const edgeMirrorMat = track(
      new THREE.MeshBasicMaterial({ color: "#d6c8ae", transparent: true, opacity: 0.34, side: THREE.BackSide, depthWrite: false }),
    );
    const cardShadowGeo = track(new THREE.PlaneGeometry(CARD_W * 1.5, 1.2));
    const cardShadowMat = track(new THREE.MeshBasicMaterial({ map: shadowGlow, transparent: true, depthWrite: false, opacity: 0.8 }));

    // The rig carries the wall with the camera through the room.
    const rig = new THREE.Group();
    scene.add(rig);
    const rigMirror = new THREE.Group();
    rigMirror.scale.y = -1;
    rig.add(rigMirror);

    const pivots: THREE.Group[] = [];
    const mirrorPivots: THREE.Group[] = [];
    const slots: THREE.Group[] = [];
    const mirrorSlots: THREE.Group[] = [];
    const shadows: THREE.Mesh[] = [];
    const faceMats: { front: THREE.MeshBasicMaterial; back: THREE.MeshBasicMaterial }[] = [];
    const cardMeshes: THREE.Mesh[] = [];

    ANGLES.forEach((a, i) => {
      const front = track(new THREE.MeshBasicMaterial({ map: fronts[i] }));
      const back = track(new THREE.MeshBasicMaterial({ map: fronts[PER_DECK + i] }));
      const frontR = track(
        new THREE.MeshBasicMaterial({ map: fronts[i], transparent: true, opacity: 0.34, side: THREE.BackSide, depthWrite: false }),
      );
      const backR = track(
        new THREE.MeshBasicMaterial({ map: fronts[PER_DECK + i], transparent: true, opacity: 0.34, side: THREE.BackSide, depthWrite: false }),
      );
      faceMats.push({ front, back }, { front: frontR, back: backR });

      // Placed by `arrange` below, once the screen shape is known.
      const slot = new THREE.Group();
      /** Rim plus both faces. The back face is turned half round about the
       *  horizontal axis, so after a flip it arrives the right way up. */
      const build = (rim: THREE.Material, f: THREE.Material, b: THREE.Material, order?: number) => {
        const pivot = new THREE.Group();
        const rimMesh = new THREE.Mesh(rimGeo, rim);
        const frontMesh = new THREE.Mesh(faceGeo, f);
        frontMesh.position.z = FACE_Z;
        const backMesh = new THREE.Mesh(faceGeo, b);
        backMesh.rotation.x = Math.PI;
        backMesh.position.z = -FACE_Z;
        for (const m of [rimMesh, frontMesh, backMesh]) {
          m.userData.index = i;
          if (order !== undefined) m.renderOrder = order;
        }
        pivot.add(rimMesh, frontMesh, backMesh);
        return { pivot, hit: [rimMesh, frontMesh, backMesh] };
      };

      const card = build(edgeMat, front, back);
      slot.add(card.pivot);
      rig.add(slot);
      slots.push(slot);
      pivots.push(card.pivot);
      cardMeshes.push(...card.hit);

      const slotR = new THREE.Group();
      const cardR = build(edgeMirrorMat, frontR, backR, REFLECTION);
      slotR.add(cardR.pivot);
      rigMirror.add(slotR);
      mirrorSlots.push(slotR);
      mirrorPivots.push(cardR.pivot);

      const shadow = new THREE.Mesh(cardShadowGeo, cardShadowMat);
      shadow.renderOrder = OVER_FLOOR;
      rig.add(shadow);
      shadows.push(shadow);
    });

    /**
     * Stand the cards in the row or the grid. Every card still faces the
     * camera from RADIUS away, so framing works the same either way; only the
     * wall's height and width change.
     */
    let grid = false;
    let wallY = WALL_Y;
    const arrange = (asGrid: boolean) => {
      grid = asGrid;
      wallY = grid ? GRID_WALL_Y : WALL_Y;
      ANGLES.forEach((rowAngle, i) => {
        // Grid order: top-left, top-right, bottom-left, bottom-right.
        const a = grid ? Math.asin(((i % 2 === 0 ? -1 : 1) * GRID_COL_X) / RADIUS) : rowAngle;
        const y = grid ? GRID_ROW_Y[i < 2 ? 0 : 1] : WALL_Y;
        for (const slot of [slots[i], mirrorSlots[i]]) {
          slot.position.set(RADIUS * Math.sin(a), y, -RADIUS * Math.cos(a));
          slot.rotation.y = -a; // face the centre of the arc, where the camera is
        }
        const shadow = shadows[i];
        shadow.rotation.set(-Math.PI / 2, 0, a);
        shadow.position.set(slots[i].position.x, 0.013, slots[i].position.z);
        // Only cards standing on the floor cast a shadow on it.
        shadow.visible = !grid || i >= 2;
      });
    };

    /** Front faces carry the even deck of a pair, backs the odd one. */
    const mountPair = (pair: number) => {
      const even = pair % 2 === 0 ? pair : pair + 1;
      const odd = Math.min(pair % 2 === 0 ? pair + 1 : pair, DECKS - 1);
      for (let i = 0; i < PER_DECK; i++) {
        const [main, mirror] = [faceMats[i * 2], faceMats[i * 2 + 1]];
        main.front.map = mirror.front.map = fronts[even * PER_DECK + i];
        main.back.map = mirror.back.map = fronts[odd * PER_DECK + i];
      }
    };
    mountPair(0);

    /* ------------------------------------------------------------ sizing */
    /*
     * Framing. Every card sits RADIUS from the camera, so a card's projected
     * height depends only on the lens. Pick the lens that makes the wall fill
     * the band between the heading and the counter (never wider than the
     * screen allows), then slide the image with a view offset so the wall is
     * centred in that band. Measured from the DOM on every resize, so no
     * screen shape can put the heading over the cards.
     */
    let baseTan = Math.tan(25 * DEG);
    let pull = 0;
    const fit = () => {
      const w = canvas.clientWidth || 1;
      const h = canvas.clientHeight || 1;
      // Phones get a lighter framebuffer; the scene is soft enough not to show it.
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, w < 700 ? 1.5 : 1.75));
      renderer.setSize(w, h, false);
      const asGrid = w / h < GRID_BELOW_ASPECT;
      if (asGrid !== grid || !slots[0].position.z) arrange(asGrid);

      const head = headRef.current;
      const counter = counterRef.current;
      const headBottom = head ? head.offsetTop + head.offsetHeight : h * 0.22;
      const counterTop = counter ? counter.offsetTop : h * 0.92;
      const top = headBottom + h * 0.045;
      // The lower part of the gap is left for the reflections — less of it
      // for the grid, which needs the height for its two rows.
      const bottom = top + (counterTop - top) * (grid ? 0.8 : 0.66);
      const band = Math.max(bottom - top, h * 0.2);
      const shift = (top + bottom) / 2 - h / 2;

      const fullH = h + 2 * Math.abs(shift);
      // Tall enough for the cards to fill the band...
      const wallHeight = grid ? CARD_H * 2 + GRID_GAP_Y : CARD_H;
      const byHeight = ((wallHeight / RADIUS) * fullH) / (2 * band * 0.92);
      // ...but wide enough to hold the outer edges, with a margin.
      const edgeTan = grid ? (GRID_COL_X + CARD_W / 2 + 0.3) / RADIUS : Math.tan(35 * DEG);
      const byWidth = edgeTan * (fullH / w);
      baseTan = Math.min(Math.max(byHeight, byWidth), Math.tan(50 * DEG));

      // A row on a screen too narrow for it: rather than widen the lens into
      // fisheye, the camera steps back from the wall. The grid never needs to.
      if (grid) {
        pull = 0;
      } else {
        const hTan = (baseTan * w) / fullH;
        const halfWidth = RADIUS * Math.sin(ANGLES[3]) + CARD_W / 2 + 0.35;
        pull = Math.max(0, halfWidth / hTan - RADIUS * Math.cos(ANGLES[3]));
      }

      camera.aspect = w / fullH;
      camera.fov = (2 * Math.atan(baseTan)) / DEG;
      camera.setViewOffset(w, fullH, 0, Math.abs(shift) - shift, w, h);
      camera.updateProjectionMatrix();
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(canvas);
    if (headRef.current) ro.observe(headRef.current);

    /* ------------------------------------------------------------ input */
    const pointer = { x: 0, y: 0, ndc: new THREE.Vector2(9, 9), over: false };
    const onMove = (e: PointerEvent) => {
      pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.y = (e.clientY / window.innerHeight) * 2 - 1;
      const r = canvas.getBoundingClientRect();
      pointer.ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
      pointer.over = true;
    };
    const onLeave = () => (pointer.over = false);
    if (hasPointer && !reduced) {
      window.addEventListener("pointermove", onMove, { passive: true });
      document.addEventListener("pointerleave", onLeave);
    }
    const raycaster = new THREE.Raycaster();

    /* ------------------------------------------------------------- flips */
    const motion: CardMotion[] = ANGLES.map(() => ({ angle: 0, lean: 0, kick: 0, lift: 0, liftTarget: 0 }));
    let face = 0;
    let busy = false;
    let jolt = 0;

    const flip = (to: number) => {
      const forward = to > face;
      busy = true;
      mountPair(Math.min(face, to));
      setDeck(to);
      face = to;
      let landed = false;

      motion.forEach((m, i) => {
        gsap.killTweensOf(m, "angle,lean,kick");
        const last = i === motion.length - 1;
        const done = () => {
          if (last) busy = false;
        };
        if (reduced) {
          gsap.to(m, { angle: to * Math.PI, lean: 0, kick: 0, duration: 0.2, ease: "none", onComplete: done });
          return;
        }
        if (forward) {
          // The slam. Off the lean, accelerating the whole way round, stopping
          // dead on the face: ending at full speed is what reads as impact.
          // The angle never passes its target. The shock goes into a squash
          // and a jolt of the camera instead of any rebound.
          // Row: inner pair first, outer a beat later. Grid: top row first.
          const late = grid ? i >= 2 : Math.abs(ANGLES[i]) > 20 * DEG;
          const delay = (late ? 0.05 : 0) + i * 0.015;
          gsap.to(m, { lean: 0, duration: 0.12, delay, ease: "power1.in" });
          gsap.to(m, {
            angle: to * Math.PI,
            duration: 0.42,
            delay,
            ease: "power2.in",
            onComplete: () => {
              if (!landed) {
                landed = true;
                jolt = 1;
              }
              gsap.fromTo(m, { kick: 1 }, { kick: 0, duration: 0.5, ease: "elastic.out(1, 0.4)" });
              done();
            },
          });
        } else {
          // Coming back up is unremarkable by design: one even turn.
          gsap.to(m, { lean: 0, kick: 0, duration: 0.35, ease: "power2.out" });
          gsap.to(m, { angle: to * Math.PI, duration: 0.95, ease: "power2.inOut", onComplete: done });
        }
      });
    };

    /* -------------------------------------------------------------- loop */
    let frame = 0;
    let last = performance.now();
    let lastProgress = 0;
    let goingDown = true;
    let shove = 0;
    let camZ = 0;
    let prevCamZ = 0;
    let speed = 0;
    let swayX = 0;
    let swayY = 0;
    let widen = 0;
    /** 0..1: how much idle drift the cards are carrying right now. */
    let idle = 1;

    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const t = now / 1000;

      const rect = section.getBoundingClientRect();
      const span = rect.height - window.innerHeight;
      const raw = clamp(-rect.top / Math.max(span, 1), 0, 1);
      const progress = raw * FLIPS;

      const delta = progress - lastProgress;
      if (Math.abs(delta) > 0.0004) goingDown = delta > 0;
      lastProgress = progress;
      shove = lerp(shove, clamp(delta * 90, -1, 1) * SHOVE, 0.12);

      if (!busy) {
        const step = progress - face;
        if (step >= FLIP_AT && face < FLIPS) {
          flip(face + 1);
        } else if (step < RETURN_AT - 1 && face > 0) {
          flip(face - 1);
        } else if (!reduced) {
          const wind = clamp((step - WIND_START) / (FLIP_AT - WIND_START), 0, 1);
          const strain = goingDown && face < FLIPS ? wind ** 1.6 * MAX_LEAN : 0;
          motion.forEach((m, i) => {
            const lag = (grid ? i >= 2 : Math.abs(ANGLES[i]) > 20 * DEG) ? 0.85 : 1;
            // Tight to the wheel: connected to the scroll, not easing on its own.
            m.lean = lerp(m.lean, (strain + shove) * lag, 0.22);
          });
        }
      }

      /* camera */
      camZ = reduced ? 0 : lerp(camZ, -raw * TRAVEL, 0.07);
      speed = lerp(speed, Math.abs(camZ - prevCamZ) / Math.max(dt, 0.001), 0.1);
      prevCamZ = camZ;
      swayX = lerp(swayX, pointer.x * 0.55, 0.05);
      swayY = lerp(swayY, -pointer.y * 0.18, 0.05);
      jolt = lerp(jolt, 0, 0.14);

      const bob = reduced ? 0 : Math.sin(t * 0.5) * 0.02;
      camera.position.set(swayX, wallY + swayY + bob - jolt * 0.04, camZ + pull);
      camera.lookAt(swayX * 0.25, wallY, camZ - 8);
      // Speed widens the lens a touch, so travel is felt, not just seen.
      widen = lerp(widen, clamp(speed / 12, 0, 1) * 0.06, 0.08);
      const fov = (2 * Math.atan(baseTan * (1 + widen))) / DEG;
      if (Math.abs(camera.fov - fov) > 0.02) {
        camera.fov = fov;
        camera.updateProjectionMatrix();
      }

      rig.position.z = camZ;
      far.position.z = camZ;

      /* hover: the card under the cursor lifts a little */
      if (pointer.over && !busy) {
        raycaster.setFromCamera(pointer.ndc, camera);
        const hit = raycaster.intersectObjects(cardMeshes, false)[0];
        motion.forEach((m, i) => (m.liftTarget = hit && hit.object.userData.index === i ? 0.1 : 0));
      } else {
        motion.forEach((m) => (m.liftTarget = 0));
      }

      /* cards and their reflections, from the same numbers */
      // Idle drift settles while the cards strain or turn, so the lean and the
      // slam read on still cards rather than moving ones.
      const straining = motion.reduce((most, m) => Math.max(most, clamp(m.lean / MAX_LEAN, 0, 1)), 0);
      idle = lerp(idle, reduced || busy ? 0 : 1 - straining, 0.06);

      motion.forEach((m, i) => {
        m.lift = lerp(m.lift, m.liftTarget, 0.12);
        const tension = clamp(m.lean / MAX_LEAN, 0, 1);
        const shake = Math.sin(t * 35 + i * 1.7) * tension ** 4 * 0.5 * DEG;
        const scale = 1 - tension * 0.015 - m.kick * 0.035;

        // Each card on its own slow clock (8-12s periods, offset per card) so
        // the wall never moves in step: a small float, a sway, a slight nod.
        const float = Math.sin(t * 0.78 + i * 1.9) * 0.03 * idle;
        const sway = Math.sin(t * 0.52 + i * 2.3) * 1.4 * DEG * idle;
        const nod = Math.sin(t * 0.61 + i * 0.9) * 0.8 * DEG * idle;
        const roll = Math.sin(t * 0.69 + i * 1.1) * 0.6 * DEG * idle;

        for (const p of [pivots[i], mirrorPivots[i]]) {
          // Positive x turns the top toward the viewer; the lean goes the
          // other way, which is what makes it read as winding up.
          p.rotation.set(m.angle - m.lean + nod, sway, shake + roll);
          p.scale.setScalar(scale);
          p.position.y = m.lift + float;
        }
      });

      /* petals */
      petals.forEach((p) => {
        const s = p.sprite;
        s.position.y -= p.fall * dt;
        s.position.x += Math.sin(t * p.sway + p.phase) * 0.25 * dt;
        (s.material as THREE.SpriteMaterial).rotation += p.spin * dt;
        if (s.position.y < 0.02 || s.position.z > camZ + 1) spawnPetal(p, camZ, false);
      });

      renderer.render(scene, camera);
      frame = requestAnimationFrame(tick);
    };

    // Shader programs compile off the main thread where the GPU driver allows
    // (KHR_parallel_shader_compile); compiling on the first render instead
    // froze the page for the better part of a second on a mid-range phone.
    // The loop starts once they are ready, and the skeleton hands over then.
    let stopped = false;
    renderer
      .compileAsync(scene, camera)
      .catch(() => undefined)
      .then(() => {
        if (stopped) return;
        frame = requestAnimationFrame((now) => {
          tick(now);
          setReady(true);
        });
      });

    return () => {
      stopped = true;
      cancelAnimationFrame(frame);
      ro.disconnect();
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerleave", onLeave);
      motion.forEach((m) => gsap.killTweensOf(m));
      disposables.forEach((d) => d.dispose());
    };
    }
  }, [reduced, hasPointer]);

  return (
    <section
      ref={sectionRef}
      className="relative"
      style={{
        // One screen pinned, plus a screen and a bit of scroll per flip.
        height: `${100 + FLIPS * 110}vh`,
        backgroundColor: "#1a1322",
      }}
    >
      <div className="sticky top-0 h-screen overflow-hidden">
        <canvas ref={canvasRef} aria-hidden="true" className="absolute inset-0 block h-full w-full" />

        {/* Loading skeleton: the wall's four cards as soft paper shapes, in
            the same row (or 2x2 on a portrait screen) the scene will draw,
            fading out as the first real frame lands. */}
        <div
          aria-hidden="true"
          className={`pointer-events-none absolute inset-0 flex items-center justify-center transition-opacity duration-700 ease-[var(--ease-entrance)] ${
            ready ? "opacity-0" : "opacity-100"
          }`}
        >
          <div className="memories-skeleton">
            {Array.from({ length: PER_DECK }, (_, i) => (
              <span key={i} style={{ animationDelay: `${i * 120}ms` }} />
            ))}
          </div>
        </div>

        <div className="pointer-events-none relative z-10 flex h-full flex-col items-center" style={{ paddingTop: "max(96px, 7.2vw)" }}>
          <div ref={headRef} className="flex flex-col items-center">
          {/* Floors on every size: the vw scale is the desktop frame's, which
              would shrink this to a caption on a phone. */}
          <div data-reveal className="flex items-center" style={{ gap: `max(12px, ${vw(26)})` }}>
            <span aria-hidden="true" className="bg-washi/70" style={{ width: `max(34px, ${vw(160)})`, height: `max(3px, ${vw(6)})` }} />
            <h1
              className="m-0 whitespace-nowrap font-machine font-normal leading-none text-washi"
              style={{ fontSize: `max(44px, ${vw(96)})`, textShadow: "0 0.2vw 0.9vw rgba(10,6,14,0.6)" }}
            >
              MEMORIES
            </h1>
            <span aria-hidden="true" className="bg-washi/70" style={{ width: `max(34px, ${vw(160)})`, height: `max(3px, ${vw(6)})` }} />
          </div>
          <p
            data-reveal
            className="m-0 whitespace-nowrap font-segoe text-washi/85"
            style={{ fontSize: `max(14px, ${vw(34)})`, marginTop: `max(8px, ${vw(12)})`, ["--reveal-delay" as string]: "150ms", textShadow: "0 0.1vw 0.6vw rgba(10,6,14,0.55)" }}
          >
            Collecting memories, not just certificates.
          </p>
          </div>

          <div ref={counterRef} className="mt-auto flex items-center" style={{ gap: vw(18), marginBottom: "max(24px, 2.6vw)" }} aria-live="polite">
            <span className="font-mono text-washi/70" style={{ fontSize: "max(11px, 0.85vw)", letterSpacing: "0.18em" }}>
              {String(deck + 1).padStart(2, "0")} / {String(DECKS).padStart(2, "0")}
            </span>
            <div aria-hidden="true" className="flex" style={{ gap: vw(10) }}>
              {Array.from({ length: DECKS }, (_, i) => (
                <span
                  key={i}
                  className="rounded-full transition-all duration-500 ease-[var(--ease-entrance)]"
                  style={{
                    height: "max(7px, 0.52vw)",
                    width: i === deck ? "max(24px, 1.8vw)" : "max(7px, 0.52vw)",
                    backgroundColor: i === deck ? "var(--color-washi)" : "rgba(237,226,207,0.3)",
                  }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* The canvas is invisible to assistive tech; this is what it shows. */}
        <ul className="sr-only">
          {Array.from({ length: PER_DECK }, (_, i) => (
            <li key={i}>Memory {String(deck * PER_DECK + i + 1).padStart(2, "0")} (photo placeholder)</li>
          ))}
        </ul>
      </div>
    </section>
  );
}
