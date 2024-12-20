module.exports = {
  accountId: process.env.CLOUDFLARE_ACCOUNT_ID,
  accessKeyId: process.env.CLOUDFLARE_ACCESS_KEY_ID,
  secretAccessKey: process.env.CLOUDFLARE_SECRET_ACCESS_KEY,
  bucketName: process.env.CLOUDFLARE_BUCKET_NAME, // Only bucket name, e.g., 'za-development'
  endpointUrl: `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  imagebaseurl:process.env.CLOUDFLARE_BASEURL
};

