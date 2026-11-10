import type { Tone } from "@/data/types";

/** Availability bands used on the head-office screen. */
export const availabilityTone = (v: number): Tone => (v >= 96 ? "good" : v >= 94 ? "warn" : "bad");
export const availabilityStatus = (v: number) => (v >= 96 ? "onTrack" : v >= 94 ? "watch" : "attention");
