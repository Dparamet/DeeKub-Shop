# Game information and artwork

Updated: 2026-10-06. The catalog contains 29 demo packages across 18 game titles. Product descriptions summarize public publisher/store information in Thai. Prices, quantities offered, stock and fulfillment are demo configuration, not supplier quotes or an authorized distribution agreement.

Steam artwork URLs were read from the store's app details response. Mobile game icons were read from the publisher's Google Play listing. Roblox and PUBG artwork came from their official page metadata; VALORANT uses an image on Riot's official home page. Images are loaded remotely, not committed as copied media. Game names and artwork belong to their respective owners.

| Game | Information source |
|---|---|
| Roblox Gift Cards | [Redemption and gift card conditions](https://www.roblox.com/giftcardFAQs) |
| VALORANT | [Riot Games](https://playvalorant.com/en-us/) |
| Garena RoV | [Publisher listing](https://play.google.com/store/apps/details?id=com.garena.game.kgth) |
| Free Fire | [Publisher listing](https://play.google.com/store/apps/details?id=com.dts.freefireth) |
| PUBG MOBILE | [Official site](https://www.pubgmobile.com/en-US/home.shtml) |
| Mobile Legends: Bang Bang | [Publisher listing](https://play.google.com/store/apps/details?id=com.mobile.legends) |
| Genshin Impact | [Publisher listing](https://play.google.com/store/apps/details?id=com.miHoYo.GenshinImpact) |
| Honkai: Star Rail | [Publisher listing](https://play.google.com/store/apps/details?id=com.HoYoverse.hkrpgoversea) |
| Zenless Zone Zero | [Publisher listing](https://play.google.com/store/apps/details?id=com.HoYoverse.Nap) |
| Hades II | [Steam](https://store.steampowered.com/app/1145350/) |
| Stardew Valley | [Steam](https://store.steampowered.com/app/413150/) |
| Cyberpunk 2077 | [Steam](https://store.steampowered.com/app/1091500/) |
| ELDEN RING | [Steam](https://store.steampowered.com/app/1245620/) |
| Terraria | [Steam](https://store.steampowered.com/app/105600/) |
| Palworld | [Steam](https://store.steampowered.com/app/1623730/) |
| Hogwarts Legacy | [Steam](https://store.steampowered.com/app/990080/) |
| Hollow Knight | [Steam](https://store.steampowered.com/app/367520/) |
| Red Dead Redemption 2 | [Steam](https://store.steampowered.com/app/1174180/) |

Roblox is modeled as a code/Gift Card flow. It does not request a Roblox password, transfer Robux or promise a fixed Robux conversion. Its general gift card instructions distinguish credit cards from Robux-only variants and explicitly state that the store's demo codes cannot be redeemed.

## Migration and compatibility

`0003_catalog_expansion.sql` inserts 23 new packages with `ON CONFLICT DO NOTHING`. It adds source/image/guide metadata to the six original seed records only when those keys are missing. Existing prices, stock, publication settings and customized descriptions are retained. Original demo descriptions are enriched. Existing order snapshots are not rewritten.

The public API adds optional `image_url`, `source_url` and `activation_guide` fields. Existing clients can ignore them. Admin writes merge metadata and preserve omitted optional fields, so legacy clients do not remove new metadata. Empty strings intentionally clear media fields. Only allowlisted HTTPS image/source hosts are accepted; the image component does not proxy arbitrary URLs through the server.

The migration saves an application snapshot before writing. To roll back the application, retain the additional rows/metadata and use the previous app commit. No automatic destructive down migration is provided. Do not remove products referenced by orders.
