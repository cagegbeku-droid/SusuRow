/**
 * Share utility for generating public HTTPS invite and referral links.
 * Ensures mobile app users never share 'http://localhost' to friends or family.
 */

export const PUBLIC_APP_DOMAIN = 'https://susurow.onrender.com';

export const getPublicOrigin = () => {
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    const protocol = window.location.protocol;
    
    // If running in Capacitor native shell or local dev, always use the public live domain
    if (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      protocol === 'capacitor:' ||
      protocol === 'ionic:' ||
      !hostname ||
      window.location.origin.includes('localhost') ||
      !!window.Capacitor
    ) {
      return PUBLIC_APP_DOMAIN;
    }

    return window.location.origin;
  }
  return PUBLIC_APP_DOMAIN;
};

export const getGroupInviteUrl = (inviteCode) => {
  const base = getPublicOrigin();
  if (!inviteCode) return base;
  return `${base}/join?code=${encodeURIComponent(inviteCode.trim())}`;
};

export const getReferralInviteUrl = (referralCode) => {
  const base = getPublicOrigin();
  if (!referralCode) return base;
  return `${base}/join?ref=${encodeURIComponent(referralCode.trim())}`;
};
