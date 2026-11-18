import { test } from "node:test";
import assert from "node:assert/strict";
import { parseYouTubeId, youTubeEmbedUrl, youTubeWatchUrl } from "./youtube";

test("YouTube links: the video ID from any common link, nothing from other sites", () => {
  assert.equal(parseYouTubeId("https://youtu.be/RaTBTNrYv8A?si=UgLYMPTzLoe_kMvA"), "RaTBTNrYv8A");
  assert.equal(parseYouTubeId("https://www.youtube.com/watch?v=h15YfpJkP-E&t=30s"), "h15YfpJkP-E");
  assert.equal(parseYouTubeId("youtube.com/watch?v=CN-Hw1dZkNY"), "CN-Hw1dZkNY");
  assert.equal(parseYouTubeId("https://m.youtube.com/shorts/6fhYePzwY0A"), "6fhYePzwY0A");
  assert.equal(parseYouTubeId("https://www.youtube.com/embed/6fhYePzwY0A"), "6fhYePzwY0A");
  assert.equal(parseYouTubeId("  6fhYePzwY0A "), "6fhYePzwY0A");
  assert.equal(parseYouTubeId("https://evil.example/watch?v=6fhYePzwY0A"), null);
  assert.equal(parseYouTubeId("https://youtube.com.evil.example/watch?v=6fhYePzwY0A"), null);
  assert.equal(parseYouTubeId("javascript:alert(1)"), null);
  assert.equal(parseYouTubeId("https://youtu.be/short"), null);
  assert.equal(parseYouTubeId("https://www.youtube.com/@SakonNakhonMuseum"), null);
  assert.equal(youTubeWatchUrl("RaTBTNrYv8A"), "https://www.youtube.com/watch?v=RaTBTNrYv8A");
  assert.equal(youTubeEmbedUrl("RaTBTNrYv8A", { autoplay: true }), "https://www.youtube-nocookie.com/embed/RaTBTNrYv8A?rel=0&playsinline=1&autoplay=1");
});
