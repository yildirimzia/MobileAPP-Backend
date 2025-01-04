require('dotenv').config();
import Redis from 'ioredis';

const redisClient = () => {
    if (process.env.REDIS_URL) {
        console.log('Redis bağlantısı başlatılıyor...');
        const redis = new Redis(process.env.REDIS_URL, {
            tls: {
                rejectUnauthorized: false
            },
            retryStrategy: (times: number) => {
                return Math.min(times * 50, 2000);
            }
        });

        redis.on('error', (err) => console.log('Redis Error: ', err));
        redis.on('connect', () => console.log('Redis bağlantısı başarılı'));

        return redis;
    }
    throw new Error('Redis bağlantı URL\'i bulunamadı');
};

export const redis = redisClient();