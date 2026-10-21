import { readFileSync, writeFileSync } from "node:fs";

// Preserve the official on-paper mark as a separate master; the favicon is an opaque tile.
const master = readFileSync("../../assets/logo/lumo-mark-on-paper.svg", "utf8");
export const tile = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 112 112" role="img" aria-label="Lumo UI"><rect width="112" height="112" fill="#FAF9F6"/>${master.replace("<svg ", '<svg x="15.68" y="15.68" width="80.64" height="80.64" ')}</svg>\n`;
writeFileSync("public/icon.svg", tile);
