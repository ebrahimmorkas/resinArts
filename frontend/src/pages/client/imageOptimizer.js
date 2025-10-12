export const getOptimizedImageUrl = (cloudinaryUrl, options = {}) => {
  if (!cloudinaryUrl || !cloudinaryUrl.includes('cloudinary')) {
    return cloudinaryUrl || "/placeholder.svg";
  }

  const {
    width = 400,
    quality = 'auto',
    format = 'auto'
  } = options;

  const urlParts = cloudinaryUrl.split('/upload/');
  if (urlParts.length !== 2) return cloudinaryUrl;

  const transformations = `w_${width},q_${quality},f_${format},c_limit`;
  return `${urlParts[0]}/upload/${transformations}/${urlParts[1]}`;
};