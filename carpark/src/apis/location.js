// src/apis/location.js
import { client } from "./client";

// POST /api/members/me/location?lat=..&lng=..
export async function postMyLocation({ lat, lng }) {
  return client.post("/api/members/me/location", null, {
    params: { lat, lng }, // ← 명세: RequestParam
  });
}
