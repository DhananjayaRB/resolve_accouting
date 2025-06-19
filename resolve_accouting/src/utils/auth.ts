interface DecodedToken {
  org_id: string;
  user_id: string;
  role_id: string;
  user_type_id: string;
  role_name: string;
  nbf: number;
  exp: number;
  iss: string;
  aud: string;
}

const decodeToken = (token: string): DecodedToken | null => {
  try {
    // JWT tokens are in format: header.payload.signature
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Error decoding token:', error);
    return null;
  }
};

export const storeTokenFromUrl = () => {
  const path = window.location.pathname;
  const tokenMatch = path.match(/\/id\/([^/]+)/);
  
  if (tokenMatch && tokenMatch[1]) {
    const token = tokenMatch[1];
    localStorage.setItem('auth_token', token);

    // Decode and store additional information
    const decodedToken = decodeToken(token);
    if (decodedToken) {
      localStorage.setItem('org_id', decodedToken.org_id);
      localStorage.setItem('user_id', decodedToken.user_id);
      localStorage.setItem('role_id', decodedToken.role_id);
      localStorage.setItem('user_type_id', decodedToken.user_type_id);
      localStorage.setItem('role_name', decodedToken.role_name);
    }

    // Redirect to root URL
    window.location.href = '/';
    return true;
  }
  return false;
};

export const getStoredToken = () => {
  return localStorage.getItem('auth_token');
};

export const getStoredUserInfo = () => {
  return {
    org_id: localStorage.getItem('org_id'),
    user_id: localStorage.getItem('user_id'),
    role_id: localStorage.getItem('role_id'),
    user_type_id: localStorage.getItem('user_type_id'),
    role_name: localStorage.getItem('role_name')
  };
};

export const removeStoredToken = () => {
  localStorage.removeItem('auth_token');
  localStorage.removeItem('org_id');
  localStorage.removeItem('user_id');
  localStorage.removeItem('role_id');
  localStorage.removeItem('user_type_id');
  localStorage.removeItem('role_name');
}; 