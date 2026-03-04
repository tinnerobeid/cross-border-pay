import { api } from "../services/api";

export async function getHealth() {
  const res = await api.get("/health");
  return res.data;
}
