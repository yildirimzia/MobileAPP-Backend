import { OAuth2Client } from 'google-auth-library';

const webClient = new OAuth2Client(process.env.GOOGLE_WEB_CLIENT_ID);
const androidClient = new OAuth2Client(process.env.GOOGLE_ANDROID_CLIENT_ID);
const iosClient = new OAuth2Client(process.env.GOOGLE_IOS_CLIENT_ID);

export async function verifyGoogleToken(idToken: string, platform: 'web' | 'android' | 'ios') {
    try {
        const client = platform === 'web'
            ? webClient
            : platform === 'android'
                ? androidClient
                : iosClient;

        const ticket = await client.verifyIdToken({
            idToken,
            audience: [
                process.env.GOOGLE_WEB_CLIENT_ID!,
                process.env.GOOGLE_ANDROID_CLIENT_ID!,
                process.env.GOOGLE_IOS_CLIENT_ID!
            ]
        });

        const payload = ticket.getPayload();

        if (!payload) {
            throw new Error('Invalid token payload');
        }

        return {
            email: payload.email,
            name: payload.name,
            picture: payload.picture,
            email_verified: payload.email_verified
        };
    } catch (error) {
        throw new Error('Invalid Google token');
    }
} 