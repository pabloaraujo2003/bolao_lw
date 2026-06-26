import Redis from 'ioredis'

const globalForRedis = globalThis as unknown as { redis: Redis | undefined }

const isDev = process.env.NODE_ENV === 'development'

export const redis =
  globalForRedis.redis ??
  new Redis(process.env.REDIS_URL!, {
    maxRetriesPerRequest: 0,
    connectTimeout: isDev ? 800 : 3000,
    commandTimeout: isDev ? 800 : 3000,
    lazyConnect: true,
    enableOfflineQueue: false,
  })

redis.on('error', () => {})

if (process.env.NODE_ENV !== 'production') globalForRedis.redis = redis
