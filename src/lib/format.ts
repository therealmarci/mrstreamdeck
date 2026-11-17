/** "in 12 min", "in 45 s", "in 2:05 h" style countdown (keys refresh every few seconds - minutes are enough). */
export function countdown(ms: number): string {
	const s = Math.max(0, Math.round(ms / 1000));
	if (s < 120) {
		return `${s} s`;
	}
	const m = Math.round(s / 60);
	if (m < 120) {
		return `${m} min`;
	}
	return `${Math.floor(m / 60)}:${String(m % 60).padStart(2, "0")} h`;
}

/** 19.96 -> "20,0" (German) or "20.0". */
export function decimal(value: number, lang: "de" | "en"): string {
	const text = value.toFixed(1);
	return lang === "de" ? text.replace(".", ",") : text;
}
