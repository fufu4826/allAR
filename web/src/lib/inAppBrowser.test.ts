import assert from "node:assert/strict";
import test from "node:test";
import { androidChromeIntentUrl, detectInAppBrowser, lineExternalUrl } from "./inAppBrowser";
import { parseContentRoute } from "./contentRoute";
import { resolveSiteUrl } from "./siteUrl";
import { parseStatEvent, thaiDay } from "./stats";

const UA = {
  lineAndroid:
    "Mozilla/5.0 (Linux; Android 14; SM-A546E) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/124.0.0.0 Mobile Safari/537.36 Line/14.6.1/IAB",
  lineIos:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Safari Line/14.6.0",
  messengerAndroid:
    "Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/124.0.0.0 Mobile Safari/537.36 [FB_IAB/Orca-Android;FBAV/455.0.0.36.111;]",
  facebookIos:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 [FBAN/FBIOS;FBAV/455.0.0.0;FBBV/1;FBDV/iPhone15,2;FBMD/iPhone;FBSN/iOS;FBSV/17.4]",
  instagramAndroid:
    "Mozilla/5.0 (Linux; Android 14; SM-S911B) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/124.0.0.0 Mobile Safari/537.36 Instagram 330.0.0.40.92 Android (34/14; 420dpi; 1080x2340; samsung; SM-S911B; dm1q; qcom; th_TH; 597410170)",
  chromeAndroid:
    "Mozilla/5.0 (Linux; Android 14; SM-A546E) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36",
  safariIos:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1",
  desktop:
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
};

test("in-app browser: LINE, Messenger, Facebook and Instagram are detected with their OS", () => {
  assert.deepEqual(detectInAppBrowser(UA.lineAndroid), { app: "line", os: "android" });
  assert.deepEqual(detectInAppBrowser(UA.lineIos), { app: "line", os: "ios" });
  assert.deepEqual(detectInAppBrowser(UA.messengerAndroid), { app: "facebook", os: "android" });
  assert.deepEqual(detectInAppBrowser(UA.facebookIos), { app: "facebook", os: "ios" });
  assert.deepEqual(detectInAppBrowser(UA.instagramAndroid), { app: "instagram", os: "android" });
});

test("in-app browser: real browsers are not flagged", () => {
  assert.equal(detectInAppBrowser(UA.chromeAndroid).app, null);
  assert.equal(detectInAppBrowser(UA.safariIos).app, null);
  assert.equal(detectInAppBrowser(UA.desktop).app, null);
  assert.equal(detectInAppBrowser("").app, null);
});

test("in-app browser: escape links keep the page and its query", () => {
  assert.equal(lineExternalUrl("https://liac.livecraft.fun/c/nonhom?x=1"), "https://liac.livecraft.fun/c/nonhom?x=1&openExternalBrowser=1");
  assert.equal(
    androidChromeIntentUrl("https://liac.livecraft.fun/c/phuphan/abc?x=1"),
    "intent://liac.livecraft.fun/c/phuphan/abc?x=1#Intent;scheme=https;package=com.android.chrome;end",
  );
});

test("content routes: only community and item paths need a database check", () => {
  assert.deepEqual(parseContentRoute("/c/nonhom"), { kind: "community", slug: "nonhom" });
  assert.deepEqual(parseContentRoute("/c/nonhom/"), { kind: "community", slug: "nonhom" });
  assert.deepEqual(parseContentRoute("/c/nonhom/abc123"), { kind: "item", slug: "nonhom", itemId: "abc123" });
  assert.equal(parseContentRoute("/news/n1"), null);
  assert.equal(parseContentRoute("/c"), null);
  assert.equal(parseContentRoute("/map"), null);
  assert.equal(parseContentRoute("/c/a/b/c"), null);
  assert.equal(parseContentRoute("/news"), null);
});

test("site URL: SITE_URL wins, then the forwarded host and protocol", () => {
  assert.equal(resolveSiteUrl("https://lac.snru.ac.th/", {}), "https://lac.snru.ac.th");
  assert.equal(resolveSiteUrl("", { host: "web:3000", forwardedHost: "liac.livecraft.fun", forwardedProto: "https" }), "https://liac.livecraft.fun");
  assert.equal(resolveSiteUrl(undefined, { host: "localhost:3000" }), "http://localhost:3000");
  assert.equal(resolveSiteUrl(undefined, { host: "evil.example/<script>" }), "http://localhost:3000");
});

test("visit counting: only well-formed views and AR presses are recorded", () => {
  assert.deepEqual(parseStatEvent({ event: "view", slug: "tharae" }), { event: "view", slug: "tharae", itemId: "" });
  assert.deepEqual(parseStatEvent({ event: "ar", slug: "tharae", itemId: "abc123" }), { event: "ar", slug: "tharae", itemId: "abc123" });
  assert.equal(parseStatEvent({ event: "ar", slug: "tharae" }), null);
  assert.deepEqual(parseStatEvent({ event: "video", slug: "phuphan" }), { event: "video", slug: "phuphan", itemId: "" });
  assert.equal(parseStatEvent({ event: "video", slug: "phuphan", itemId: "abc123" }), null);
  assert.equal(parseStatEvent({ event: "click", slug: "tharae" }), null);
  assert.equal(parseStatEvent({ event: "view", slug: "../x" }), null);
  assert.equal(parseStatEvent({ event: "view", slug: "tharae", itemId: "A B" }), null);
  assert.equal(parseStatEvent(null), null);
  // 2026-11-10 20:00 UTC is already 11 November in Thailand.
  assert.equal(thaiDay(Date.UTC(2026, 10, 10, 20, 0)), "2026-11-11");
});
