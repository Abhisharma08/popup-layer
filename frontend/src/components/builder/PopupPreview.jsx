export default function PopupPreview({ config, type }) {
  const { headline, subtext, ctaText, fields, bgColor, accentColor,
          textColor, borderRadius, couponCode, showCouponCode, 
          layout, imageUrl, imageSide } = config;

  const isAccentDark = (color) => {
    const hex = color?.replace('#', '') || '6366f1';
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    return (r * 299 + g * 587 + b * 114) / 1000 < 128;
  };

  const btnTextColor = isAccentDark(accentColor) ? '#ffffff' : '#000000';
  const isHiddenField = (field) => (
    String(field?.type || '').toLowerCase() === 'hidden' || field?.hidden === true || field?.isHidden === true
  );

  const renderField = (field) => {
    const baseClasses = "w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm outline-none";

    if (isHiddenField(field)) return null;
    
    if (field.type === 'textarea') {
      return <textarea key={field.id} className={baseClasses} placeholder={field.placeholder || field.label} rows="2" readOnly />;
    }
    if (field.type === 'select') {
      const options = Array.isArray(field.options) && field.options.length > 0 ? field.options : [];
      return (
        <select key={field.id} className={`${baseClasses} bg-white`} defaultValue="">
          <option value="" disabled>{field.placeholder || field.label}</option>
          {options.map((option, index) => (
            <option key={`${option}-${index}`} value={option}>{option}</option>
          ))}
        </select>
      );
    }
    return <input key={field.id} className={baseClasses} type={field.type || 'text'} placeholder={field.placeholder || field.label} readOnly />;
  };

  const formContent = (
    <div className="p-8 flex flex-col justify-center" style={{ flex: layout === 'side-by-side' ? '1' : undefined }}>
      {/* Close button */}
      <button className="absolute top-3 right-4 text-gray-400 hover:text-gray-600 text-xl z-10">×</button>

      <h2 className="text-2xl font-bold mb-2 pr-6">{headline}</h2>
      {subtext && <p className="text-sm mb-6 opacity-70">{subtext}</p>}

      {showCouponCode && couponCode && (
        <div 
          className="mb-5 p-3 border-dashed border-2 text-center rounded-lg font-mono font-bold tracking-widest text-lg"
          style={{ borderColor: accentColor, color: accentColor }}
        >
          {couponCode}
        </div>
      )}

      {type !== 'ANNOUNCEMENT' && (
        <div className="space-y-3 mb-5">
          {(fields || []).filter(field => !isHiddenField(field)).map(field => (
            <div key={field.id}>{renderField(field)}</div>
          ))}
        </div>
      )}

      <button
        className="w-full py-3 font-semibold rounded-lg transition-opacity hover:opacity-90 text-sm uppercase tracking-wider"
        style={{ backgroundColor: accentColor, color: btnTextColor }}
      >
        {ctaText}
      </button>
    </div>
  );

  const imagePanel = imageUrl ? (
    <div 
      className="overflow-hidden" 
      style={{ 
        flex: '1', 
        minHeight: layout === 'side-by-side' ? '100%' : undefined,
        borderRadius: imageSide === 'left' 
          ? `${borderRadius || 12}px 0 0 ${borderRadius || 12}px` 
          : `0 ${borderRadius || 12}px ${borderRadius || 12}px 0`
      }}
    >
      <img 
        src={imageUrl} 
        alt="Popup visual" 
        className="w-full h-full object-cover"
        style={{ minHeight: '300px' }}
      />
    </div>
  ) : null;

  const isSideBySide = layout === 'side-by-side' && imageUrl;

  return (
    <div className="flex items-center justify-center w-full h-full bg-gray-100 p-8">
      <div className="absolute inset-0 bg-black/30 pointer-events-none" />

      <div
        className={`relative z-10 shadow-2xl overflow-hidden ${isSideBySide ? 'flex max-w-3xl' : 'max-w-md'}`}
        style={{ 
          backgroundColor: bgColor, 
          borderRadius: `${borderRadius || 12}px`, 
          color: textColor,
          width: '100%'
        }}
      >
        {isSideBySide && imageSide === 'left' && imagePanel}
        {formContent}
        {isSideBySide && imageSide === 'right' && imagePanel}
      </div>
    </div>
  );
}
