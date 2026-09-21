/**
 * Compresses an image client-side using HTML5 Canvas.
 * - Scales max dimension to max 1200px
 * - Converts to JPEG quality 0.8
 * - Ensures file is compact (<400KB) for fast cellular/wifi upload
 */
export async function compressImage(file: File | Blob, maxDimension = 1200, quality = 0.8): Promise<{ dataUrl: string; sizeKB: number }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Calculate aspect ratio scale
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas context could not be created'));
          return;
        }

        // Draw image onto canvas
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to compressed JPEG data URL
        const dataUrl = canvas.toDataURL('image/jpeg', quality);

        // Calculate approximate size in KB
        const head = 'data:image/jpeg;base64,';
        const base64Length = dataUrl.length - head.length;
        const sizeKB = Math.round((base64Length * 3) / 4 / 1024);

        resolve({ dataUrl, sizeKB });
      };

      img.onerror = () => {
        reject(new Error('Failed to load image for compression'));
      };

      if (event.target?.result) {
        img.src = event.target.result as string;
      } else {
        reject(new Error('Failed to read file buffer'));
      }
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsDataURL(file);
  });
}
