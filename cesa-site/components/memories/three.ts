/**
 * The parts of three.js the Memories scene actually uses.
 *
 * `import("three")` pulls the whole namespace, which the bundler cannot
 * tree-shake. Importing this module instead gives it a closed list of named
 * exports to keep, and everything else in three.js is dropped from the chunk.
 * Add to this list when the scene starts using something new.
 */
export {
  AdditiveBlending,
  BackSide,
  BoxGeometry,
  BufferAttribute,
  BufferGeometry,
  CanvasTexture,
  ExtrudeGeometry,
  Fog,
  Group,
  Mesh,
  MeshBasicMaterial,
  PerspectiveCamera,
  PlaneGeometry,
  Points,
  PointsMaterial,
  Raycaster,
  Scene,
  Shape,
  ShapeGeometry,
  SphereGeometry,
  Sprite,
  SpriteMaterial,
  SRGBColorSpace,
  TextureLoader,
  Vector2,
  WebGLRenderer,
} from "three";
