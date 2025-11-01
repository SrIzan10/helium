export default defineEventHandler(async (event) => {
  const apiKey = process.env.METERED_API_KEY || '';
  const appName = process.env.METERED_APP_NAME || '';
  
  if (!apiKey || !appName) {
    throw createError({
      statusCode: 500,
      message: 'TURN server not configured.'
    });
  }

  try {
    const response = await $fetch(
      `https://${appName}.metered.live/api/v1/turn/credentials?apiKey=${apiKey}`
    );
    
    return response;
  } catch (error) {
    console.error('Failed to fetch TURN credentials:', error);
    throw createError({
      statusCode: 500,
      message: 'Failed to fetch TURN credentials'
    });
  }
});
