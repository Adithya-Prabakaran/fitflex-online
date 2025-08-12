// file: netlify/functions/logout.js
exports.handler = async (event) => {
  // Logout is handled client-side by deleting the JWT.
  // This endpoint can simply return a success message.
  return {
    statusCode: 200,
    body: JSON.stringify({ success: true, message: 'You have been logged out.' })
  };
};