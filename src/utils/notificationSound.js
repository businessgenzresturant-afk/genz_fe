const base = import.meta.env.BASE_URL || "/";

function resolveAsset(path) {
  const p = path.startsWith("/") ? path.slice(1) : path;
  const b = base.endsWith("/") ? base : `${base}/`;
  return `${b}${p}`;
}

/** Distinct notification kinds — add more URLs here when assets exist. */
const SOUND_URLS = {
  "new-order": resolveAsset("assets/new-order.mp3"),
  "order-status": resolveAsset("assets/new-order.mp3"),
};

const audioByUrl = new Map();
let unlocked = false;

function getAudio(url) {
  let a = audioByUrl.get(url);
  if (!a) {
    a = new Audio(url);
    a.preload = "auto";
    audioByUrl.set(url, a);
  }
  return a;
}

export function isNotificationSoundUnlocked() {
  return unlocked;
}

/** Prime each distinct asset once (required for multitple kinds / future files). */
export async function tryUnlockNotificationSounds() {
  const urls = [...new Set(Object.values(SOUND_URLS))];
  try {
    for (const url of urls) {
      const a = getAudio(url);
      await a.play();
      a.pause();
      a.currentTime = 0;
    }
    unlocked = true;
    return true;
  } catch {
    return false;
  }
}

/**
 * @param {"new-order" | "order-status"} [kind]
 */
export function playNotificationSound(kind = "order-status") {
  if (!unlocked) return Promise.resolve();
  const url = SOUND_URLS[kind] || SOUND_URLS["order-status"];
  const a = getAudio(url);
  a.currentTime = 0;
  return a.play().catch(() => {});
}
