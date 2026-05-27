export function load(key, fallback = null) {
  try {
    const value = localStorage.getItem(key);

    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

export function save(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

export function remove(key) {
  localStorage.removeItem(key);
}

export function loadString(key, fallback = "") {
  return localStorage.getItem(key) || fallback;
}

export function saveString(key, value) {
  localStorage.setItem(key, value);
}