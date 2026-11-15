import { readFileSync } from "node:fs";

const key = "1b8932b9f0185bd12cf49b865abe8d65";
const urlList = [...readFileSync("dist/sitemap.xml", "utf8").matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
const response = await fetch("https://api.indexnow.org/indexnow", {
  method: "POST",
  headers: { "content-type": "application/json; charset=utf-8" },
  body: JSON.stringify({ host: "runelay.com", key, keyLocation: `https://runelay.com/${key}.txt`, urlList }),
});
console.log(response.status, urlList.length);
