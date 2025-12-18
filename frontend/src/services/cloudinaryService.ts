// src/services/cloudinaryService.ts

/**
 * Uploads an image to Cloudinary using an unsigned preset.
 *
 * @param {string} imageUri - The local URI of the image (from ImagePicker).
 * @returns {Promise<string>} - The secure URL of the uploaded image.
 */
export const uploadToCloudinary = async (imageUri: string): Promise<string> => {
  try {
    // 1. Create a FormData object
    // This mimics a form submission, which is required for file uploads
    const data = new FormData();

    const filename = imageUri.split('/').pop() || 'upload.jpg';
    
    // Infer the file type from the extension
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : `image/jpeg`;

    // @ts-ignore: React Native FormData requires 'uri', 'name', and 'type'
    data.append('file', { uri: imageUri, name: filename, type });

    // 2. Add the Upload Preset (Created in Step 1)
    // REPLACE 'straymandu_uploads' with your actual preset name
    data.append('upload_preset', 'straymandu_uploads'); 

    // 3. Add Cloud Name to the URL
    // REPLACE 'your_cloud_name' with your actual cloud name
    const cloudName = 'dfecajueg'; 
    
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      {
        method: 'POST',
        body: data,
        // React Native handles the Content-Type header for FormData automatically
      }
    );

    const json = await response.json();

    if (json.secure_url) {
      return json.secure_url;
    } else {
      console.error('Cloudinary Error:', json);
      throw new Error(json.error?.message || 'Image upload failed');
    }
  } catch (error) {
    console.error('Upload Service Error:', error);
    throw error;
  }
};