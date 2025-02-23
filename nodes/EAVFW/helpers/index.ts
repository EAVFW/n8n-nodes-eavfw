import { ICredentialDataDecryptedObject, IExecuteFunctions, IHttpRequestOptions, ILoadOptionsFunctions } from "n8n-workflow";


type NodeContext = ILoadOptionsFunctions | IExecuteFunctions;

interface TokenCacheData {
    token: string;
    expiresAt: number;
}


// Static cache storage
const tokenCache: Map<string, TokenCacheData> = new Map();
const manifestCache: Map<string, {
    timestamp: number,
    data: any
}> = new Map();

// Get token with caching
export async function getTokenWithCache(
    this: NodeContext,
    credentials: ICredentialDataDecryptedObject,
): Promise<string> {
    const { environmentUrl, clientId, clientSecret } = credentials;
    const cacheKey = `${environmentUrl}:${clientId}`; // Use combination of URL and clientId as cache key

    // Check cache first
    const cachedToken = tokenCache.get(cacheKey);
    if (cachedToken && Date.now() < cachedToken.expiresAt) {
        return cachedToken.token;
    }

    // If no valid cached token, get a new one
    const tokenUrl = `${environmentUrl}/connect/token`;

    const options: IHttpRequestOptions = {
        method: 'POST',
        url: tokenUrl,
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            authorization: `Basic ${btoa(clientId + ':' + clientSecret)}`,
        },
        body: 'grant_type=client_credentials'
    };

    try {
        const response = await this.helpers.request(options);
        const data = JSON.parse(response);

        // Cache the token
        // Subtract 5 minutes from expiry to be safe
        const expiresIn = (data.expires_in || 3600) * 1000; // Convert to milliseconds
        const expiresAt = Date.now() + expiresIn - (5 * 60 * 1000); // Current time + expiry - 5 minutes

        tokenCache.set(cacheKey, {
            token: data.access_token,
            expiresAt,
        });

        return data.access_token;
    } catch (error) {
        throw new Error(`OAuth2 authentication failed: ${error.message}`);
    }
}

// Add manifest fetching with caching
export async function getManifest(
    this: NodeContext,
    environmentUrl: string,
    token: string
): Promise<any> {
    const CACHE_DURATION = 1000 * 60 * 60; // 1 hour in milliseconds
    const cacheKey = environmentUrl;
    const cachedData = manifestCache.get(cacheKey);

    // Check if we have valid cached data
    if (cachedData && (Date.now() - cachedData.timestamp) < CACHE_DURATION) {
        return cachedData.data;
    }

    // If no cache or expired, fetch new data
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await this.helpers.request({
        method: 'GET',
        url: `${environmentUrl}/api/manifest`,
        headers,
        json: true,
    });

    // Store in cache
    manifestCache.set(cacheKey, {
        timestamp: Date.now(),
        data: response,
    });

    return response;
}   