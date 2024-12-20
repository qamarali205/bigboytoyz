const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

// Load configuration from environment variables
const {
  accountId,
  accessKeyId,
  secretAccessKey,
  bucketName, // The name of your Cloudflare R2 bucket
  endpointUrl, // This is used to specify the endpoint URL for Cloudflare R2
  imagebaseurl
} = require('../config/cloudflareConfig');

// Initialize the S3 client with Cloudflare R2 configuration
const s3 = new S3Client({
  region: 'auto', // Cloudflare R2 uses 'auto' for the region
  endpoint: `https://${accountId}.r2.cloudflarestorage.com`, // Endpoint URL for Cloudflare R2
  credentials: {
    accessKeyId: accessKeyId,
    secretAccessKey: secretAccessKey
  },
  forcePathStyle: true // Use path style URLs (required for Cloudflare R2)
});

// Function to upload an image file to Cloudflare R2
exports.uploadSingleImageToCloudflare = async (file,folderName) => {
  if (!file || !file.buffer) {
    throw new Error('Missing image file or file buffer');
  }

  const filePath = `${folderName}/${file.originalname}`; // The key for the object in the bucket

  try {
    // Create a command to put an object into the bucket
    const command = new PutObjectCommand({
      Bucket: bucketName, // The name of your bucket
      Key:filePath, // The path within the bucket
      Body: file.buffer, // The file buffer to be uploaded
      ContentType: file.mimetype, // The MIME type of the file
      ACL: 'public-read' // Make the object publicly readable
    });

    // Send the command to upload the file
    const response = await s3.send(command);

    // Construct the URL for accessing the uploaded file
    const imageUrl = `${imagebaseurl}/${filePath}`.replace(
      /([^:]\/)\/+/g,
      "$1"
    );

    return imageUrl;
  } catch (error) {
    console.error('Error details:', error);
    throw new Error(`Error uploading image: ${error.message}`);
  }
};




exports.uploadMultipleImagesToCloudflare = async (files,folderName) => {
  if (!files || !Array.isArray(files) || files.length === 0) {
    throw new Error('Missing or invalid files array');
  }

  // Process each file and upload it
  const uploadPromises = files.map(async (file) => {
    if (!file || !file.buffer) {
      throw new Error('Missing image file or file buffer');
    }

    const filePath = `${folderName}/${file.originalname}`; // Path within the bucket

    try {
      // Create a command to put an object into the bucket
      const command = new PutObjectCommand({
        Bucket: bucketName,
        Key: filePath,
        Body: file.buffer,
        ContentType: file.mimetype,
        ACL: 'public-read' // Make the object publicly readable
      });

      // Send the command to upload the file
      const response = await s3.send(command);

      // Construct the URL for accessing the uploaded file
      const imageUrl = `${imagebaseurl}/${filePath}`.replace(
        /([^:]\/)\/+/g,
        "$1"
      );
      return imageUrl;
    } catch (error) {
      console.error(`Error uploading file ${file.originalname}:`, error);
      throw new Error(`Error uploading file ${file.originalname}: ${error.message}`);
    }
  });

  // Wait for all uploads to complete and return an array of URLs
  try {
    const urls = await Promise.all(uploadPromises);
    return urls; // Array of URLs for the uploaded images
  } catch (error) {
    console.error('Error details:', error);
    throw new Error(`Error uploading images: ${error.message}`);
  }
};
