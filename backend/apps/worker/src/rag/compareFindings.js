export const compareFindings = (
  currentFindings = [],
  historicalFindings = []
) => {
  // Helper to safely convert object/string to a comparable string format
  const getComparableString = (item) => {
    if (!item) return "";
    if (typeof item === "string") return item;
    return item.threat || item.message || item.finding || JSON.stringify(item);
  };

  const recurringThreatsSet = new Set(
    historicalFindings.map((historyItem) =>
      getComparableString(historyItem.threat)
    )
  );

  const recurringFindings = [];
  const newFindings = [];

  currentFindings.forEach((finding) => {
    const comparableFinding = getComparableString(finding);

    if (recurringThreatsSet.has(comparableFinding)) {
      recurringFindings.push(finding);
    } else {
      newFindings.push(finding);
    }
  });

  return {
    recurringFindings,
    newFindings,
    resolvedFindings: [],
  };
};