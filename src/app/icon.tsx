import { seloIcone } from "@/components/selo-icone"

export const size = { width: 64, height: 64 }
export const contentType = "image/png"

export default async function Icon() {
  return seloIcone(64)
}
