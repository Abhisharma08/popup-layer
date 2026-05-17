import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useBuilderStore } from '../store/builderStore';
import PopupPreview from '../components/builder/PopupPreview';
import client from '../api/client';

const FIELD_TYPES = [
  { value: 'text', label: 'Text' },
  { value: 'email', label: 'Email' },
  { value: 'tel', label: 'Phone' },
  { value: 'number', label: 'Number' },
  { value: 'textarea', label: 'Textarea' },
  { value: 'select', label: 'Dropdown' },
  { value: 'hidden', label: 'Hidden' },
];

function parseOptions(value) {
  return String(value || '')
    .split(/\r?\n|,/)
    .map(option => option.trim())
    .filter(Boolean);
}

function formatOptions(options) {
  return Array.isArray(options) ? options.join('\n') : '';
}

function isHiddenField(field) {
  return String(field?.type || '').toLowerCase() === 'hidden' || field?.hidden === true || field?.isHidden === true;
}

function normalizeField(field) {
  if (!field) return field;
  if (!isHiddenField(field)) return field;

  return {
    ...field,
    type: 'hidden',
    required: false,
    placeholder: '',
    options: undefined,
    hidden: true,
  };
}

function normalizeConfig(config) {
  return {
    ...config,
    fields: Array.isArray(config?.fields) ? config.fields.map(normalizeField) : [],
  };
}

const TEMPLATES = [
  {
    name: "Newsletter Minimal",
    type: "EMAIL_CAPTURE",
    config: {
      headline: "Join the club", subtext: "Weekly insights delivered to your inbox.",
      ctaText: "Subscribe", bgColor: "#ffffff", accentColor: "#000000", textColor: "#000000",
      fields: [{ id: 'email', label: 'Email', type: 'email', placeholder: 'you@email.com', required: true }],
      layout: 'stacked', imageUrl: '', borderRadius: 12, closeButton: true, couponCode: '', showCouponCode: false, successMessage: 'You\'re in!'
    }
  },
  {
    name: "Lead Capture — Enquiry",
    type: "EMAIL_CAPTURE",
    config: {
      headline: "Let Us Know Your Requirements", subtext: "",
      ctaText: "SUBMIT", bgColor: "#2d2d2d", accentColor: "#ffffff", textColor: "#ffffff",
      fields: [
        { id: 'name', label: 'NAME', type: 'text', placeholder: 'NAME', required: true },
        { id: 'email', label: 'EMAIL', type: 'email', placeholder: 'EMAIL', required: true },
        { id: 'phone', label: 'Phone', type: 'tel', placeholder: 'Phone', required: false },
        { id: 'city', label: 'City', type: 'text', placeholder: 'City', required: false },
      ],
      layout: 'stacked', imageUrl: '', borderRadius: 0, closeButton: true, couponCode: '', showCouponCode: false, successMessage: 'We\'ll get back to you!'
    }
  },
  {
    name: "Scholarship Application",
    type: "EMAIL_CAPTURE",
    config: {
      headline: "Apply For Scholarships, Please Fill The Details", subtext: "Need help?",
      ctaText: "Submit", bgColor: "#ffffff", accentColor: "#16a34a", textColor: "#1f2937",
      fields: [
        { id: 'name', label: 'Name', type: 'text', placeholder: 'Name', required: true },
        { id: 'phone', label: 'Phone number', type: 'tel', placeholder: 'Phone number', required: true },
        { id: 'email', label: 'Email', type: 'email', placeholder: 'Email', required: true },
        { id: 'grade', label: 'Grade', type: 'text', placeholder: 'Grade', required: false },
      ],
      layout: 'stacked', imageUrl: '', borderRadius: 8, closeButton: true, couponCode: '', showCouponCode: false, successMessage: 'Application submitted!'
    }
  },
  {
    name: "Black Friday Sale",
    type: "COUPON",
    config: {
      headline: "Black Friday Is Here!", subtext: "Get 50% off all items.",
      ctaText: "Claim Coupon", couponCode: "BF50", showCouponCode: true,
      bgColor: "#000000", accentColor: "#ef4444", textColor: "#ffffff",
      fields: [{ id: 'email', label: 'Email', type: 'email', placeholder: 'Your email', required: true }],
      layout: 'stacked', imageUrl: '', borderRadius: 12, closeButton: true, successMessage: 'Coupon applied!'
    }
  },
  {
    name: "Exit Intent Offer",
    type: "EXIT_INTENT",
    config: {
      headline: "Wait, don't leave!", subtext: "Here is a special offer just for you.",
      ctaText: "Get 10% Off", bgColor: "#ffffff", accentColor: "#4f46e5", textColor: "#1f2937",
      fields: [{ id: 'email', label: 'Email', type: 'email', placeholder: 'Your email', required: true }],
      layout: 'stacked', imageUrl: '', borderRadius: 12, closeButton: true, couponCode: '', showCouponCode: false, successMessage: 'Check your inbox!'
    }
  },
  {
    name: "Image + Form (Side by Side)",
    type: "EMAIL_CAPTURE",
    config: {
      headline: "Get a Free Consultation", subtext: "Fill in your details and our team will reach out within 24 hours.",
      ctaText: "Request Callback", bgColor: "#ffffff", accentColor: "#4f46e5", textColor: "#1f2937",
      fields: [
        { id: 'name', label: 'Full Name', type: 'text', placeholder: 'Full Name', required: true },
        { id: 'email', label: 'Email', type: 'email', placeholder: 'Email Address', required: true },
        { id: 'phone', label: 'Phone', type: 'tel', placeholder: 'Phone Number', required: true },
        { id: 'company', label: 'Company', type: 'text', placeholder: 'Company Name', required: false },
      ],
      layout: 'side-by-side', imageUrl: '/images/side-template.png', imageSide: 'left',
      borderRadius: 16, closeButton: true, couponCode: '', showCouponCode: false, successMessage: 'We\'ll contact you soon!'
    }
  }
];

export default function PopupBuilder() {
  const { 
    config, triggers, configB, triggersB, popupType, popupName, webhookUrl, abTestEnabled, activeVariant,
    setPopupType, updateConfig, setConfig, updateTriggers, setWebhookUrl, setAbTestEnabled, setActiveVariant,
    addField, removeField, updateField, reorderFields
  } = useBuilderStore();

  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = Boolean(id);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showAddField, setShowAddField] = useState(false);
  const [newFieldLabel, setNewFieldLabel] = useState('');
  const [newFieldType, setNewFieldType] = useState('text');
  const [editingFieldId, setEditingFieldId] = useState(null);
  const [toast, setToast] = useState(null); // { message, type: 'success' | 'error' }

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    if (isEditing) {
      client.get(`/popups/${id}`)
      .then(({ data }) => {
        if (!data.error) {
          useBuilderStore.setState({
            popupType: data.type,
            popupName: data.name,
            config: data.config,
            triggers: data.triggers,
            webhookUrl: data.webhookUrl || '',
            abTestEnabled: data.abTestEnabled,
            configB: data.configB || null,
            triggersB: data.triggersB || null
          });
        }
      })
      .catch(() => showToast('Failed to load popup.', 'error'));
    } else {
      useBuilderStore.getState().reset();
    }
  }, [id, isEditing]);

  const currentConfig = activeVariant === 'A' ? config : (configB || config);
  const currentTriggers = activeVariant === 'A' ? triggers : (triggersB || triggers);

  const handleSave = async () => {
    try {
      const payload = {
        workspaceId: localStorage.getItem('workspaceId'),
        name: popupName || 'My Popup',
        type: popupType,
        config: normalizeConfig(config),
        triggers,
        webhookUrl,
        abTestEnabled,
        configB: configB ? normalizeConfig(configB) : null,
        triggersB
      };
      const response = isEditing
        ? await client.put(`/popups/${id}`, payload)
        : await client.post('/popups', payload);

      showToast('Popup saved successfully!', 'success');
      if (!isEditing) navigate(`/popups/${response.data.id}/edit`);
    } catch (e) {
      console.error(e);
      showToast(e.response?.data?.error || 'Network error. Could not save popup.', 'error');
    }
  };

  const applyTemplate = (t) => {
    setPopupType(t.type);
    setConfig(t.config);
    setShowTemplates(false);
  };

  const handleAddField = () => {
    if (!newFieldLabel.trim()) return;
    const id = newFieldLabel.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '') + '_' + Date.now();
    addField({
      id,
      label: newFieldLabel,
      type: newFieldType,
      placeholder: newFieldType === 'hidden' ? '' : newFieldLabel,
      required: false,
      options: newFieldType === 'select' ? ['Option 1', 'Option 2'] : undefined,
      value: newFieldType === 'hidden' ? '' : undefined,
      hidden: newFieldType === 'hidden' ? true : undefined,
    });
    setNewFieldLabel('');
    setNewFieldType('text');
    setShowAddField(false);
  };

  const moveField = (index, direction) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= currentConfig.fields.length) return;
    reorderFields(index, newIndex);
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-lg shadow-lg text-sm font-medium transition-all animate-in slide-in-from-top ${
          toast.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
        }`} style={{ animation: 'slideDown 0.3s ease-out' }}>
          {toast.message}
        </div>
      )}

      {/* Sidebar Controls */}
      <div className="w-[420px] bg-white border-r border-gray-200 overflow-y-auto shadow-sm z-20 flex flex-col">
        <div className="p-6 flex-1 space-y-6">
          
          {/* Header with Back Button */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button 
                onClick={() => navigate('/popups')} 
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-900 transition-colors"
                title="Back to Dashboard"
              >
                ←
              </button>
              <h1 className="text-xl font-bold">Popup Builder</h1>
            </div>
            <button 
              onClick={() => setShowTemplates(!showTemplates)} 
              className="text-sm text-indigo-600 font-semibold hover:text-indigo-800 transition-colors"
            >
              {showTemplates ? 'Close' : '📋 Templates'}
            </button>
          </div>

          {/* Templates Gallery */}
          {showTemplates && (
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-4 rounded-xl border border-indigo-100">
              <h4 className="text-sm font-bold text-indigo-900 mb-3">Pre-built Templates</h4>
              <div className="space-y-2">
                {TEMPLATES.map(t => (
                  <button 
                    key={t.name} 
                    onClick={() => applyTemplate(t)} 
                    className="block w-full text-left px-4 py-3 text-sm bg-white border border-gray-200 rounded-lg hover:border-indigo-400 hover:shadow-sm transition-all"
                  >
                    <span className="font-medium">{t.name}</span>
                    <span className="text-gray-400 ml-2 text-xs">{t.type.replace('_', ' ')}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
          
          {/* General Settings */}
          <div>
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">General</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">Popup Name</label>
                <input 
                  type="text" 
                  value={popupName}
                  onChange={e => useBuilderStore.getState().setPopupName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Popup Type</label>
                <select 
                  value={popupType}
                  onChange={(e) => setPopupType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 outline-none"
                >
                  <option value="EMAIL_CAPTURE">Email Capture</option>
                  <option value="ANNOUNCEMENT">Announcement</option>
                  <option value="EXIT_INTENT">Exit Intent</option>
                  <option value="COUPON">Coupon</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Webhook URL <span className="text-gray-400 font-normal">(Zapier / Custom)</span></label>
                <input 
                  type="url" 
                  value={webhookUrl} 
                  onChange={e => setWebhookUrl(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 outline-none"
                  placeholder="https://hooks.zapier.com/..."
                />
              </div>
            </div>
          </div>

          {/* A/B Testing */}
          <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-gray-700">A/B Testing</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" checked={abTestEnabled} onChange={e => setAbTestEnabled(e.target.checked)} />
                <div className="w-9 h-5 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
              </label>
            </div>
            {abTestEnabled && (
              <div className="flex gap-2 mt-2">
                <button onClick={() => setActiveVariant('A')} className={`flex-1 py-1.5 text-sm font-medium rounded-lg transition-colors ${activeVariant === 'A' ? 'bg-indigo-600 text-white shadow-sm' : 'bg-white border text-gray-500'}`}>Variant A</button>
                <button onClick={() => setActiveVariant('B')} className={`flex-1 py-1.5 text-sm font-medium rounded-lg transition-colors ${activeVariant === 'B' ? 'bg-indigo-600 text-white shadow-sm' : 'bg-white border text-gray-500'}`}>Variant B</button>
              </div>
            )}
          </div>

          {/* Design */}
          <div>
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
              Content {abTestEnabled ? `(Variant ${activeVariant})` : ''}
            </h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">Headline</label>
                <input 
                  type="text" 
                  value={currentConfig.headline} 
                  onChange={e => updateConfig({ headline: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Subtext</label>
                <textarea 
                  value={currentConfig.subtext} 
                  onChange={e => updateConfig({ subtext: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 outline-none resize-none"
                  rows="2"
                />
              </div>
              {popupType !== 'ANNOUNCEMENT' && (
                <div>
                  <label className="block text-sm font-medium mb-1">Button Text</label>
                  <input 
                    type="text" 
                    value={currentConfig.ctaText} 
                    onChange={e => updateConfig({ ctaText: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 outline-none"
                  />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium mb-1">Success Message</label>
                <input 
                  type="text" 
                  value={currentConfig.successMessage || 'Thank you!'} 
                  onChange={e => updateConfig({ successMessage: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 outline-none"
                />
              </div>
              {popupType === 'COUPON' && (
                <div>
                  <label className="block text-sm font-medium mb-1">Coupon Code</label>
                  <input 
                    type="text" 
                    value={currentConfig.couponCode} 
                    onChange={e => updateConfig({ couponCode: e.target.value, showCouponCode: true })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm font-mono tracking-wider focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 outline-none"
                    placeholder="e.g. SAVE20"
                  />
                </div>
              )}
            </div>
          </div>

          {/* ====== FORM FIELDS BUILDER ====== */}
          {popupType !== 'ANNOUNCEMENT' && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Form Fields</h3>
                <button 
                  onClick={() => setShowAddField(!showAddField)} 
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
                >
                  + Add Field
                </button>
              </div>

              {/* Add Field Form */}
              {showAddField && (
                <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100 mb-3 space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Field Label</label>
                    <input 
                      type="text" 
                      value={newFieldLabel} 
                      onChange={e => setNewFieldLabel(e.target.value)}
                      placeholder="e.g. City, Company, Grade..."
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-200"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Field Type</label>
                    <select 
                      value={newFieldType} 
                      onChange={e => setNewFieldType(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-indigo-200"
                    >
                      {FIELD_TYPES.map(ft => <option key={ft.value} value={ft.value}>{ft.label}</option>)}
                    </select>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={handleAddField} className="flex-1 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors">
                      Add
                    </button>
                    <button onClick={() => setShowAddField(false)} className="flex-1 py-2 bg-white border text-gray-600 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors">
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Field List */}
              <div className="space-y-2">
                {currentConfig.fields?.map((field, index) => (
                  <div key={field.id} className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                    {editingFieldId === field.id ? (
                      // Inline edit mode
                      <div className="space-y-2">
                        <input 
                          type="text" 
                          value={field.label} 
                          onChange={e => updateField(field.id, { label: e.target.value })}
                          className="w-full px-2 py-1 border rounded text-sm"
                        />
                        <input 
                          type="text" 
                          value={field.placeholder} 
                          onChange={e => updateField(field.id, { placeholder: e.target.value })}
                          className="w-full px-2 py-1 border rounded text-sm"
                          placeholder="Placeholder text"
                          disabled={isHiddenField(field)}
                        />
                        <div className="flex items-center gap-3">
                          <select 
                            value={field.type} 
                            onChange={e => updateField(field.id, {
                              type: e.target.value,
                              options: e.target.value === 'select' ? (field.options?.length ? field.options : ['Option 1', 'Option 2']) : undefined,
                              value: e.target.value === 'hidden' ? (field.value || '') : undefined,
                              required: e.target.value === 'hidden' ? false : field.required,
                              placeholder: e.target.value === 'hidden' ? '' : field.placeholder,
                              hidden: e.target.value === 'hidden' ? true : undefined,
                              isHidden: undefined
                            })}
                            className="flex-1 px-2 py-1 border rounded text-sm bg-white"
                          >
                            {FIELD_TYPES.map(ft => <option key={ft.value} value={ft.value}>{ft.label}</option>)}
                          </select>
                          {!isHiddenField(field) && <label className="flex items-center gap-1 text-xs">
                            <input 
                              type="checkbox" 
                              checked={field.required} 
                              onChange={e => updateField(field.id, { required: e.target.checked })}
                              className="rounded"
                            />
                            Required
                          </label>}
                        </div>
                        {field.type === 'select' && (
                          <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Dropdown Options</label>
                            <textarea
                              value={formatOptions(field.options)}
                              onChange={e => updateField(field.id, { options: parseOptions(e.target.value) })}
                              className="w-full px-2 py-1 border rounded text-sm resize-none"
                              rows="3"
                              placeholder="One option per line"
                            />
                          </div>
                        )}
                        {isHiddenField(field) && (
                          <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Hidden Value</label>
                            <input
                              type="text"
                              value={field.value || ''}
                              onChange={e => updateField(field.id, { value: e.target.value })}
                              className="w-full px-2 py-1 border rounded text-sm"
                              placeholder="Value submitted with the form"
                            />
                          </div>
                        )}
                        <button onClick={() => setEditingFieldId(null)} className="text-xs text-indigo-600 font-medium">Done</button>
                      </div>
                    ) : (
                      // Display mode
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="flex flex-col gap-0.5">
                            <button 
                              onClick={() => moveField(index, -1)} 
                              disabled={index === 0}
                              className="text-gray-400 hover:text-gray-600 disabled:opacity-20 text-[10px] leading-none"
                            >▲</button>
                            <button 
                              onClick={() => moveField(index, 1)} 
                              disabled={index === currentConfig.fields.length - 1}
                              className="text-gray-400 hover:text-gray-600 disabled:opacity-20 text-[10px] leading-none"
                            >▼</button>
                          </div>
                          <div>
                            <span className="text-sm font-medium">{field.label}</span>
                            <span className="text-xs text-gray-400 ml-2">{field.type}</span>
                            {field.type === 'select' && <span className="text-xs text-gray-400 ml-2">{field.options?.length || 0} options</span>}
                            {isHiddenField(field) && <span className="text-xs text-gray-400 ml-2">submits silently</span>}
                            {field.required && <span className="text-red-400 ml-1 text-xs">*</span>}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button onClick={() => setEditingFieldId(field.id)} className="text-xs text-gray-500 hover:text-indigo-600">Edit</button>
                          <button onClick={() => removeField(field.id)} className="text-xs text-gray-400 hover:text-red-600">✕</button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {currentConfig.fields?.length === 0 && (
                <p className="text-xs text-gray-400 text-center py-4">No fields added yet. Click "+ Add Field" above.</p>
              )}
            </div>
          )}

          {/* Colors */}
          <div>
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Colors</h3>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Background</label>
                <div className="flex items-center gap-2">
                  <input type="color" value={currentConfig.bgColor} onChange={e => updateConfig({ bgColor: e.target.value })} className="w-8 h-8 rounded-lg cursor-pointer border-0 p-0" />
                  <span className="text-xs font-mono text-gray-400">{currentConfig.bgColor}</span>
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Accent</label>
                <div className="flex items-center gap-2">
                  <input type="color" value={currentConfig.accentColor} onChange={e => updateConfig({ accentColor: e.target.value })} className="w-8 h-8 rounded-lg cursor-pointer border-0 p-0" />
                  <span className="text-xs font-mono text-gray-400">{currentConfig.accentColor}</span>
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Text</label>
                <div className="flex items-center gap-2">
                  <input type="color" value={currentConfig.textColor} onChange={e => updateConfig({ textColor: e.target.value })} className="w-8 h-8 rounded-lg cursor-pointer border-0 p-0" />
                  <span className="text-xs font-mono text-gray-400">{currentConfig.textColor}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Layout */}
          <div>
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Layout</h3>
            <div className="space-y-3">
              <div className="flex gap-2">
                <button
                  onClick={() => updateConfig({ layout: 'stacked' })}
                  className={`flex-1 py-2 text-sm font-medium rounded-lg border transition-colors ${
                    (currentConfig.layout || 'stacked') === 'stacked'
                      ? 'bg-indigo-50 border-indigo-400 text-indigo-700'
                      : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300'
                  }`}
                >
                  ☐ Stacked
                </button>
                <button
                  onClick={() => updateConfig({ layout: 'side-by-side' })}
                  className={`flex-1 py-2 text-sm font-medium rounded-lg border transition-colors ${
                    currentConfig.layout === 'side-by-side'
                      ? 'bg-indigo-50 border-indigo-400 text-indigo-700'
                      : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300'
                  }`}
                >
                  ◧ Side by Side
                </button>
              </div>

              {currentConfig.layout === 'side-by-side' && (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-1">Image URL</label>
                    <input
                      type="url"
                      value={currentConfig.imageUrl || ''}
                      onChange={e => updateConfig({ imageUrl: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 outline-none"
                      placeholder="https://example.com/image.jpg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Image Side</label>
                    <select
                      value={currentConfig.imageSide || 'left'}
                      onChange={e => updateConfig({ imageSide: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 outline-none"
                    >
                      <option value="left">Left</option>
                      <option value="right">Right</option>
                    </select>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Triggers */}
          <div>
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Triggers</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">Trigger Type</label>
                <select value={currentTriggers.type} onChange={e => updateTriggers({ type: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-indigo-200">
                  <option value="time_delay">Time Delay</option>
                  <option value="scroll_percent">Scroll Percentage</option>
                  <option value="exit_intent">Exit Intent</option>
                  <option value="immediate">Immediate</option>
                </select>
              </div>
              {currentTriggers.type === 'time_delay' && (
                <div>
                  <label className="block text-sm font-medium mb-1">Delay (Seconds)</label>
                  <input type="number" value={currentTriggers.delaySeconds} onChange={e => updateTriggers({ delaySeconds: parseInt(e.target.value) })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-200" />
                </div>
              )}
              {currentTriggers.type === 'scroll_percent' && (
                <div>
                  <label className="block text-sm font-medium mb-1">Scroll Percent (%)</label>
                  <input type="number" value={currentTriggers.scrollPercent} onChange={e => updateTriggers({ scrollPercent: parseInt(e.target.value) })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-200" />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium mb-1">Frequency</label>
                <select value={currentTriggers.frequency} onChange={e => updateTriggers({ frequency: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-indigo-200">
                  <option value="always">Always show</option>
                  <option value="once_per_session">Once per session</option>
                  <option value="once_per_day">Once per day</option>
                  <option value="once_per_user">Once per user</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-white">
          <button 
            onClick={handleSave}
            className="w-full py-2.5 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
          >
            Save Popup
          </button>
        </div>
      </div>

      {/* Live Preview */}
      <div className="flex-1 bg-gray-100 relative">
        <PopupPreview config={currentConfig} type={popupType} />
      </div>

      {/* Toast animation style */}
      <style>{`
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-12px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
