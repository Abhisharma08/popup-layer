import { create } from 'zustand';

const defaultConfig = {
  headline: 'Subscribe to Our Newsletter',
  subtext: 'Get the latest updates right in your inbox.',
  ctaText: 'Subscribe Now',
  fields: [
    { id: 'email', label: 'Email', type: 'email', placeholder: 'Your email', required: true }
  ],
  position: 'center',
  animation: 'fade',
  bgColor: '#ffffff',
  accentColor: '#6366f1',
  textColor: '#111827',
  borderRadius: 12,
  closeButton: true,
  couponCode: '',
  showCouponCode: false,
  successMessage: 'Thank you!',
  layout: 'stacked', // 'stacked' or 'side-by-side'
  imageUrl: '',
  imageSide: 'left', // 'left' or 'right'
};

const defaultTriggers = {
  type: 'time_delay',
  delaySeconds: 5,
  scrollPercent: 50,
  exitIntent: false,
  urlMatch: '',
  device: 'all',
  frequency: 'once_per_session',
};

export const useBuilderStore = create((set) => ({
  popupType: 'EMAIL_CAPTURE',
  config: defaultConfig,
  triggers: defaultTriggers,
  popupName: 'My Popup',

  webhookUrl: '',
  abTestEnabled: false,
  configB: null,
  triggersB: null,
  activeVariant: 'A',

  setPopupType: (type) => set({ popupType: type }),
  setPopupName: (name) => set({ popupName: name }),
  setWebhookUrl: (url) => set({ webhookUrl: url }),
  setAbTestEnabled: (enabled) => set((s) => ({ 
    abTestEnabled: enabled, 
    configB: enabled && !s.configB ? { ...s.config } : s.configB,
    triggersB: enabled && !s.triggersB ? { ...s.triggers } : s.triggersB
  })),
  setActiveVariant: (variant) => set({ activeVariant: variant }),

  updateConfig: (updates) => set((s) => {
    if (s.activeVariant === 'B') return { configB: { ...s.configB, ...updates } };
    return { config: { ...s.config, ...updates } };
  }),

  // Full config replacement (for templates)
  setConfig: (newConfig) => set((s) => {
    if (s.activeVariant === 'B') return { configB: newConfig };
    return { config: newConfig };
  }),
  
  updateTriggers: (updates) => set((s) => {
    if (s.activeVariant === 'B') return { triggersB: { ...s.triggersB, ...updates } };
    return { triggers: { ...s.triggers, ...updates } };
  }),

  // --- Dynamic field management ---
  addField: (field) => set((s) => {
    const cfg = s.activeVariant === 'B' ? 'configB' : 'config';
    const current = s[cfg];
    return { [cfg]: { ...current, fields: [...current.fields, field] } };
  }),
  removeField: (fieldId) => set((s) => {
    const cfg = s.activeVariant === 'B' ? 'configB' : 'config';
    const current = s[cfg];
    return { [cfg]: { ...current, fields: current.fields.filter(f => f.id !== fieldId) } };
  }),
  updateField: (fieldId, updates) => set((s) => {
    const cfg = s.activeVariant === 'B' ? 'configB' : 'config';
    const current = s[cfg];
    return { [cfg]: { ...current, fields: current.fields.map(f => f.id === fieldId ? { ...f, ...updates } : f) } };
  }),
  reorderFields: (fromIndex, toIndex) => set((s) => {
    const cfg = s.activeVariant === 'B' ? 'configB' : 'config';
    const current = s[cfg];
    const fields = [...current.fields];
    const [moved] = fields.splice(fromIndex, 1);
    fields.splice(toIndex, 0, moved);
    return { [cfg]: { ...current, fields } };
  }),

  loadPopup: (popup) => set({
    popupType: popup.type,
    config: popup.config,
    triggers: popup.triggers,
    popupName: popup.name,
    webhookUrl: popup.webhookUrl || '',
    abTestEnabled: popup.abTestEnabled || false,
    configB: popup.configB,
    triggersB: popup.triggersB,
  }),
  
  reset: () => set({ 
    config: defaultConfig, 
    triggers: defaultTriggers, 
    abTestEnabled: false, 
    configB: null, 
    triggersB: null, 
    webhookUrl: '', 
    activeVariant: 'A' 
  }),
}));
