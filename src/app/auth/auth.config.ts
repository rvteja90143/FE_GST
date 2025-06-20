import { AuthConfig } from 'angular-oauth2-oidc';

// Helper function to safely get origin
function getOrigin(): string {
  return typeof window !== 'undefined' ? window.location.origin : 'http://localhost:4200';
}

export const authConfig: AuthConfig = {
  // Auth0 Domain - replace with your Auth0 domain
  issuer: 'https://YOUR_AUTH0_DOMAIN.auth0.com/',
  
  // Auth0 Client ID - replace with your Auth0 client ID
  clientId: 'YOUR_AUTH0_CLIENT_ID',
  
  // URL of your application - replace with your app's URL
  redirectUri: getOrigin(),
  
  // The SPA's id. The SPA is registered with this id at the auth-server
  // Only needed if auth-server requires OIDC client authentication
  responseType: 'code',
  
  // set the scope for the permissions the client should request
  scope: 'openid profile email',
  
  // Use the Auth0 audience to get an access token for the API
  customQueryParams: {
    audience: 'https://YOUR_AUTH0_AUDIENCE'
  },
  
  // Enable silent refresh to get new tokens without user interaction
  silentRefreshRedirectUri: getOrigin() + '/silent-refresh.html',
  useSilentRefresh: true,
  
  // Set to true to use HTTP BASIC auth for OIDC token requests
  requireHttps: true,
  
  // Enable PKCE (Proof Key for Code Exchange) for authorization code flow
  // This is recommended for security
  // Note: PKCE is enabled by default in newer versions of the library
  // when using the authorization code flow
  
  showDebugInformation: true, // Set to false in production
  
  // Configure token endpoint
  tokenEndpoint: 'https://YOUR_AUTH0_DOMAIN.auth0.com/oauth/token',
  
  // Configure logout URL
  logoutUrl: 'https://YOUR_AUTH0_DOMAIN.auth0.com/v2/logout',
  
  // Post-logout redirect URL
  postLogoutRedirectUri: getOrigin()
};
