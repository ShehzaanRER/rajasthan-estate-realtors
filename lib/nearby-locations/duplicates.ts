export function connectionKey(name: string, category: string): string {
  const normalizedName = name.trim().toLowerCase().replace(/\s+/g, ' ')
  const normalizedCategory = category.trim().toLowerCase()
  return `${normalizedName}::${normalizedCategory}`
}
