/**
 * The home page ships two layouts and shows one: the desktop frame from the
 * Tailwind `lg` breakpoint up, the phone frame below it. Hiding a layout with
 * CSS does not stop its images downloading — Chrome fetches `<img>` inside a
 * display:none tree, lazy or not — so each layout's art is offered only behind
 * its own media query, with an empty pixel as the fallback `src`.
 */
export const DESKTOP = "(min-width: 1024px)";
export const PHONE = "(max-width: 1023.98px)";

/** A transparent 1x1 GIF: an <img> fallback that never touches the network. */
export const EMPTY_PIXEL = "data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==";
