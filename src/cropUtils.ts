import 'react-easy-crop/react-easy-crop.css';

export async function getCroppedImg(
  imageSrc: string,
  croppedAreaPixels: { x: number; y: number; width: number; height: number },
  rotation = 0
): Promise<string> {
  const image = new window.Image();
  image.src = imageSrc;
  await new Promise((resolve, reject) => {
    image.onload = resolve;
    image.onerror = reject;
  });

  const canvas = document.createElement('canvas');
  canvas.width = croppedAreaPixels.width;
  canvas.height = croppedAreaPixels.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('No 2d context');

  // Fill with white background
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // If the crop area is larger than the image, center the image
  const scale = Math.min(
    croppedAreaPixels.width / image.width,
    croppedAreaPixels.height / image.height,
    1 // Don't upscale images
  );
  const drawWidth = image.width * scale;
  const drawHeight = image.height * scale;
  const dx = (canvas.width - drawWidth) / 2;
  const dy = (canvas.height - drawHeight) / 2;

  ctx.drawImage(
    image,
    0, 0, image.width, image.height,
    dx, dy, drawWidth, drawHeight
  );

  return canvas.toDataURL('image/jpeg');
} 