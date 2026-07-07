function buildPopupStats(popups, groupedEvents) {
  const countsByPopup = new Map();

  groupedEvents.forEach(group => {
    const popupId = group.popupId;
    if (!countsByPopup.has(popupId)) countsByPopup.set(popupId, { VIEW: 0, SUBMIT: 0, CLOSE: 0 });
    countsByPopup.get(popupId)[group.event] = group._count?._all || 0;
  });

  return popups.map(popup => {
    const counts = countsByPopup.get(popup.id) || { VIEW: 0, SUBMIT: 0, CLOSE: 0 };
    const views = counts.VIEW || 0;
    const submits = counts.SUBMIT || 0;

    return {
      popupId: popup.id,
      name: popup.name,
      views,
      submits,
      closes: counts.CLOSE || 0,
      conversionRate: views > 0 ? ((submits / views) * 100).toFixed(1) : '0.0',
    };
  });
}

module.exports = {
  buildPopupStats,
};
