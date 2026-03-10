export const trackLead = (type: 'organic' | 'direct' | 'other') => {
  (window as any).dataLayer = (window as any).dataLayer || [];
  (window as any).dataLayer.push({
    event: 'lead_submission',
    lead_type: type,
    page_path: window.location.pathname,
  });
};
