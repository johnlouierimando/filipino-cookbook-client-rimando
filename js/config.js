/* =====================================================
   config.js — API Configuration
   Filipino Cookbook Client
   =====================================================
   IMPORTANT: Do not expose this file with real tokens
   in a production environment. For this educational
   project, the token is included as per activity requirements.
   ===================================================== */

const API_CONFIG = {
  baseUrl: 'http://localhost/filipino-cookbook-api-ordono/public',
  token:   'dmmmsu-cookbook-token-2026',
  headers: {
    'Authorization': 'Bearer dmmmsu-cookbook-token-2026',
    'Accept':        'application/json',
    'Content-Type':  'application/json'
  }
};
