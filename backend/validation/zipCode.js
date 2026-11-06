export function validZipCode(value) {
  return typeof value === "string" && /^[0-9]{5}(-[0-9]{4})?$/.test(value.trim());
}
