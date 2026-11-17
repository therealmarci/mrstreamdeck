// Writes the version into the manifest before packing: node scripts/set-version.mjs 1.4.0.2
// (the Stream Deck wants four numbers - MAJOR.MINOR.PATCH.BUILD, from version.properties in checks.yml).
import fs from "node:fs";

const version = process.argv[2];
if (!/^\d+\.\d+\.\d+\.\d+$/.test(version ?? "")) {
	console.error(`Not a version like 1.4.0.2: ${version}`);
	process.exit(1);
}
const file = "at.marcelr.mradmin.sdPlugin/manifest.json";
const manifest = JSON.parse(fs.readFileSync(file, "utf8"));
manifest.Version = version;
fs.writeFileSync(file, JSON.stringify(manifest, null, "\t") + "\n");
console.log(`Manifest version ${version}`);
