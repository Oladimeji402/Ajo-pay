/**
 * Currency formatting utilities for consistent display across the app
 */

/**
 * Format a number as Nigerian Naira with 2 decimal places
 * @param value - The numeric value to format
 * @param includeSymbol - Whether to include the ₦ symbol (default: false)
 * @returns Formatted string like "1,234.56" or "₦1,234.56"
 */
export function formatNaira(value: number | string | null | undefined, includeSymbol = false): string {
  const numValue = Number(value ?? 0);
  
  if (!Number.isFinite(numValue)) {
    return includeSymbol ? '₦0.00' : '0.00';
  }

  const formatted = numValue.toLocaleString('en-NG', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return includeSymbol ? `₦${formatted}` : formatted;
}

/**
 * Format a number as Nigerian Naira for display in UI components
 * Alias for formatNaira with symbol included
 */
export function formatCurrency(value: number | string | null | undefined): string {
  return formatNaira(value, true);
}

/**
 * Format a number as Nigerian Naira without decimals (whole numbers only)
 * Useful for large amounts where decimal precision is not needed
 */
export function formatNairaWhole(value: number | string | null | undefined, includeSymbol = false): string {
  const numValue = Number(value ?? 0);
  
  if (!Number.isFinite(numValue)) {
    return includeSymbol ? '₦0' : '0';
  }

  const formatted = Math.round(numValue).toLocaleString('en-NG');
  return includeSymbol ? `₦${formatted}` : formatted;
}
