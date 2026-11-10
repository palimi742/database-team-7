export const maxProductImageBytes = 4_000_000;

export function productImageError(contentType, imageData) {
  if (!Buffer.isBuffer(imageData) || imageData.length === 0) {
    return "Choose a JPEG, PNG, or WebP image.";
  }
  if (imageData.length > maxProductImageBytes) {
    return "Choose an image up to 4 MB.";
  }

  const matchesType = {
    "image/jpeg": imageData.subarray(0, 3).equals(Buffer.from("ffd8ff", "hex")),
    "image/png": imageData.subarray(0, 8).equals(Buffer.from("89504e470d0a1a0a", "hex")),
    "image/webp": imageData.toString("latin1", 0, 4) === "RIFF" &&
      imageData.toString("latin1", 8, 12) === "WEBP",
  };

  if (!Object.hasOwn(matchesType, contentType)) {
    return "Choose a JPEG, PNG, or WebP image.";
  }
  if (!matchesType[contentType]) {
    return "The file contents do not match the image format.";
  }
  return null;
}

export async function saveProductImage(connection, inventoryID, contentType, imageData) {
  const imageURL = `/api/products/${inventoryID}/image`;
  await connection.execute(
    `INSERT INTO ProductImages (InventoryID, ContentType, ImageData)
     VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE ContentType = ?, ImageData = ?`,
    [inventoryID, contentType, imageData, contentType, imageData],
  );

  await connection.execute(
    "UPDATE Inventory SET ImageURL = ? WHERE InventoryID = ?",
    [imageURL, inventoryID],
  );
  return imageURL;
}
