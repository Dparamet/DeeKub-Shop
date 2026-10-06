const imagePaths: Record<string, string> = {
  "shared.akamai.steamstatic.com": "/store_item_assets/steam/apps/",
  "shared.fastly.steamstatic.com": "/store_item_assets/steam/apps/",
  "play-lh.googleusercontent.com": "/",
  "cms-media.roblox.com": "/assets/",
  "cmsassets.rgpub.io": "/sanity/images/",
  "www.pubgmobile.com": "/images/",
};
const sourceHosts = new Set([
  "store.steampowered.com",
  "play.google.com",
  "www.roblox.com",
  "en.help.roblox.com",
  "playvalorant.com",
  "ff.garena.com",
  "www.pubgmobile.com",
]);

export function productURL(value: string | undefined, image = false) {
  if (!value) return undefined;
  try {
    const url = new URL(value);
    if (
      url.protocol !== "https:" ||
      url.username ||
      url.password ||
      url.port ||
      url.hash
    )
      return undefined;
    if (image) {
      const prefix = imagePaths[url.hostname];
      return prefix && url.pathname.startsWith(prefix) && url.pathname !== "/"
        ? value
        : undefined;
    }
    return sourceHosts.has(url.hostname) ? value : undefined;
  } catch {
    return undefined;
  }
}
