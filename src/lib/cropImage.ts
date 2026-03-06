/**
 * Canvas-based image cropping utility.
 * Takes an image source and crop coordinates, returns a cropped File.
 */

interface PixelCrop {
  x: number;
  y: number;
  width: number;
  height: number;
}

function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new window.Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.crossOrigin = 'anonymous';
    image.src = url;
  });
}

/**
 * Crop an image using canvas and return a new File.
 *
 * @param imageSrc - The source URL or object URL of the image
 * @param pixelCrop - The crop area in pixel coordinates { x, y, width, height }
 * @param fileName - Output filename (e.g., "cropped_1709654321.jpg")
 * @param rotation - Rotation in degrees (0, 90, 180, 270) — optional
 * @returns A new File containing the cropped image as JPEG
 */
export async function getCroppedImage(
  imageSrc: string,
  pixelCrop: PixelCrop,
  fileName: string = 'cropped.jpg',
  rotation: number = 0
): Promise<File> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Failed to get canvas context');
  }

  // Set canvas size to the crop size
  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  // Handle rotation
  if (rotation !== 0) {
    const radians = (rotation * Math.PI) / 180;
    const sin = Math.abs(Math.sin(radians));
    const cos = Math.abs(Math.cos(radians));

    // Compute the bounding box of the rotated image
    const rotatedWidth = image.width * cos + image.height * sin;
    const rotatedHeight = image.width * sin + image.height * cos;

    // Create temp canvas for rotation
    const rotCanvas = document.createElement('canvas');
    rotCanvas.width = rotatedWidth;
    rotCanvas.height = rotatedHeight;
    const rotCtx = rotCanvas.getContext('2d')!;

    rotCtx.translate(rotatedWidth / 2, rotatedHeight / 2);
    rotCtx.rotate(radians);
    rotCtx.drawImage(image, -image.width / 2, -image.height / 2);

    // Draw the cropped portion from the rotated image
    ctx.drawImage(
      rotCanvas,
      pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height,
      0, 0, pixelCrop.width, pixelCrop.height
    );
  } else {
    // No rotation — simple crop
    ctx.drawImage(
      image,
      pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height,
      0, 0, pixelCrop.width, pixelCrop.height
    );
  }

  // Convert canvas to blob
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Canvas toBlob failed'));
          return;
        }
        const file = new File([blob], fileName, { type: 'image/jpeg' });
        resolve(file);
      },
      'image/jpeg',
      0.92
    );
  });
}
