export const compareScans = (
  currentFindings = [],
  previousFindings = []
) => {
  const getComparableString = (item) => {
    if (!item) return "";
    
    let text = item;
    if (typeof item === "object") {
      text = item.threat || item.message || item.finding || JSON.stringify(item);
    }
    
    return typeof text === "string" ? text.toLowerCase().trim() : "";
  };

  const currentSet = new Set(
    currentFindings.map((finding) => getComparableString(finding))
  );

  const previousSet = new Set(
    previousFindings.map((finding) => getComparableString(finding))
  );

  const unchanged = currentFindings.filter((finding) =>
    previousSet.has(getComparableString(finding))
  );

  const introduced = currentFindings.filter((finding) =>
    !previousSet.has(getComparableString(finding))
  );

  const improved = previousFindings.filter((finding) =>
    !currentSet.has(getComparableString(finding))
  );

  return {
    improved,
    introduced,
    unchanged,
  };
};