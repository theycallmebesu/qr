/**
 * Formats a number as Nepalese Rupee (NPR) using Nepali / Indian numbering grouping.
 * e.g., 1250 -> "Rs. 1,250"
 * e.g., 125000 -> "Rs. 1,25,000" (1 Lakh 25 Thousand)
 * e.g., 12345678 -> "Rs. 1,23,45,678" (1 Crore 23 Lakh 45 Thousand 678)
 */
export function formatNPR(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(Number(amount))) {
    return 'Rs. 0';
  }

  const num = Number(amount);
  const isNegative = num < 0;
  const absNum = Math.abs(num);

  // Split integer and decimal parts
  const [intStr, decStr] = absNum.toString().split('.');

  // Format integer part using Indian/Nepali grouping (last 3 digits, then groups of 2)
  let lastThree = intStr.substring(intStr.length - 3);
  const otherNumbers = intStr.substring(0, intStr.length - 3);

  let formattedInt = lastThree;
  if (otherNumbers !== '') {
    const formattedOthers = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',');
    formattedInt = `${formattedOthers},${lastThree}`;
  }

  let result = `Rs. ${formattedInt}`;
  if (decStr) {
    // Show max 2 decimals
    result += `.${decStr.slice(0, 2)}`;
  }

  return isNegative ? `-${result}` : result;
}
