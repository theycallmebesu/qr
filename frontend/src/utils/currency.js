/**
 * Currency utility for formatting amounts in Nepalese Rupees (NPR / Rs.)
 */
export const formatNPR = (amount, includeDecimals = true) => {
  const num = Number(amount) || 0;
  return `Rs. ${num.toLocaleString('en-IN', {
    minimumFractionDigits: includeDecimals ? 2 : 0,
    maximumFractionDigits: 2
  })}`;
};

export const formatNPRShort = (amount) => {
  const num = Number(amount) || 0;
  if (num >= 100000) {
    return `Rs. ${(num / 100000).toFixed(1)}L`;
  }
  if (num >= 1000) {
    return `Rs. ${(num / 1000).toFixed(1)}k`;
  }
  return `Rs. ${num.toFixed(0)}`;
};

export default formatNPR;
