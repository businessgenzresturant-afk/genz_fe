const HISTORY_KEY = 'genz_order_track_history';
/** Previous single-entry key — migrated once into history */
const LEGACY_KEY = 'genz_last_order_track';

const MAX_ITEMS = 40;

function safeParseHistory(raw) {
  if (!raw) return [];
  try {
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function readHistoryArray() {
  if (typeof window === 'undefined') return [];
  return safeParseHistory(window.localStorage.getItem(HISTORY_KEY));
}

function writeHistory(entries) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(HISTORY_KEY, JSON.stringify(entries));
  } catch {
    /* quota / private mode */
  }
}

function trimHistory(entries) {
  return entries.slice(0, MAX_ITEMS);
}

function migrateLegacyOnce() {
  if (typeof window === 'undefined') return;
  try {
    const legacyRaw = window.localStorage.getItem(LEGACY_KEY);
    if (!legacyRaw) return;
    window.localStorage.removeItem(LEGACY_KEY);
    const data = JSON.parse(legacyRaw);
    if (!data || typeof data !== 'object') return;
    const orderNo = typeof data.orderNo === 'string' ? data.orderNo.trim() : '';
    const id = typeof data.id === 'string' ? data.id.trim() : '';
    if (!orderNo && !id) return;
    const list = readHistoryArray();
    const entry = {
      ...(orderNo && { orderNo }),
      ...(id && { id }),
      savedAt: Date.now(),
    };
    const deduped = list.filter((e) => {
      if (id && e.id === id) return false;
      if (orderNo && e.orderNo === orderNo) return false;
      return true;
    });
    writeHistory(trimHistory([entry, ...deduped]));
  } catch {
    try {
      window.localStorage.removeItem(LEGACY_KEY);
    } catch {
      /* ignore */
    }
  }
}

function normalizeEntry({ orderNo, id }) {
  const normNo = orderNo && typeof orderNo === 'string' ? orderNo.trim() : '';
  const normId = id && typeof id === 'string' ? id.trim() : '';
  return {
    ...(normNo && { orderNo: normNo }),
    ...(normId && { id: normId }),
  };
}

/**
 * All orders opened successfully (checkout or manual track), newest first.
 */
export function listTrackOrderHistory() {
  migrateLegacyOnce();
  const list = readHistoryArray();
  return list
    .filter((e) => e && (e.orderNo || e.id))
    .sort((a, b) => (b.savedAt || 0) - (a.savedAt || 0));
}

/**
 * Add or bump to front after a successful load (dedupes by Mongo id or order number).
 */
export function addTrackOrderToHistory({ orderNo, id }) {
  if (typeof window === 'undefined') return;
  migrateLegacyOnce();
  const n = normalizeEntry({ orderNo, id });
  if (!n.orderNo && !n.id) return;

  let list = readHistoryArray();
  list = list.filter((e) => {
    if (n.id && e.id === n.id) return false;
    if (n.orderNo && e.orderNo === n.orderNo) return false;
    return true;
  });
  list.unshift({ ...n, savedAt: Date.now() });
  writeHistory(trimHistory(list));
}

/**
 * Remove one saved entry (e.g. order deleted, user dismisses).
 */
export function removeTrackOrderFromHistory({ orderNo, id } = {}) {
  if (typeof window === 'undefined') return;
  migrateLegacyOnce();
  const norm = normalizeEntry({ orderNo, id });
  if (!norm.orderNo && !norm.id) return;

  const list = readHistoryArray().filter((e) => {
    if (norm.id && e.id === norm.id) return false;
    if (norm.orderNo && e.orderNo === norm.orderNo) return false;
    return true;
  });
  writeHistory(list);
}

export function clearTrackOrderHistory() {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(HISTORY_KEY);
    window.localStorage.removeItem(LEGACY_KEY);
  } catch {
    /* ignore */
  }
}
