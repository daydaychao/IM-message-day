import { connectRedis, redisClient } from './redis'

async function clearRedis() {
  try {
    await connectRedis()
    console.log('Connected to Redis')

    // Clear all data
    await redisClient.flushdb()
    console.log('✅ Redis database cleared successfully!')

    process.exit(0)
  } catch (error) {
    console.error('❌ Error clearing Redis:', error)
    process.exit(1)
  }
}

clearRedis()
