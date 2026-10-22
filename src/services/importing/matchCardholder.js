const PARTICLES = new Set(["de", "da", "do", "das", "dos", "e"]);

const words = (s) =>
  (s || "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w && !PARTICLES.has(w));

/**
 * Whether two printed names refer to the same person. Banks truncate
 * ("JOAO PEDRO", "JOAO") or spell out the full legal name ("Rafaela
 * Koefender De Castro Menezes Oliveira"), so every word of the shorter name
 * must appear in the longer one.
 */
export function isSamePerson(a, b, minWords = 1) {
  const [shorter, longer] = [words(a), words(b)].sort((x, y) => x.length - y.length);
  return shorter.length >= minWords && shorter.every((w) => longer.includes(w));
}

const memberName = (m) => m.name || m.email?.split("@")[0];

/** Maps a name printed on a statement to an account member, when unambiguous. */
export function matchCardholder(name, members = []) {
  const candidates = members.filter((m) => isSamePerson(name, memberName(m)));
  return candidates.length === 1 ? candidates[0] : null;
}

/**
 * Transfers to/from the statement's own holders or other members aren't
 * income or spending. Needs two matching words, so a first name alone
 * ("JOAO") doesn't claim every "JOAO …" counterparty.
 */
export function isInternalTransfer(counterparty, { members = [], holders = [] }) {
  if (!counterparty) return false;
  return (
    members.some((m) => isSamePerson(counterparty, memberName(m), 2)) ||
    holders.some((h) => isSamePerson(counterparty, h, 2))
  );
}
