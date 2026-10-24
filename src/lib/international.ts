export interface CountryConfig {
  code: string;         // 'MX', 'CO', 'ES', 'US'
  name: string;         // 'México', 'Colombia', 'España', 'Estados Unidos'
  currency: string;     // 'MXN', 'COP', 'EUR', 'USD'
  symbol: string;       // '$', '€'
  phonePrefix: string;  // '52', '57', '34', '1'
  fee: number;          // Comisión fija por cita (en la divisa correspondiente)
  monthlySolo: number;  // Precio mensual del plan individual
  monthlyClinic: number;// Precio mensual del plan clínicas
}

export const COUNTRIES: Record<string, CountryConfig> = {
  MX: {
    code: 'MX',
    name: 'México',
    currency: 'MXN',
    symbol: '$',
    phonePrefix: '52',
    fee: 20.00,
    monthlySolo: 149.00,
    monthlyClinic: 1299.00
  },
  CO: {
    code: 'CO',
    name: 'Colombia',
    currency: 'COP',
    symbol: '$',
    phonePrefix: '57',
    fee: 4000.00,
    monthlySolo: 30000.00,
    monthlyClinic: 260000.00
  },
  AR: {
    code: 'AR',
    name: 'Argentina',
    currency: 'ARS',
    symbol: '$',
    phonePrefix: '54',
    fee: 1000.00,
    monthlySolo: 7500.00,
    monthlyClinic: 65000.00
  },
  CL: {
    code: 'CL',
    name: 'Chile',
    currency: 'CLP',
    symbol: '$',
    phonePrefix: '56',
    fee: 1000.00,
    monthlySolo: 7500.00,
    monthlyClinic: 65000.00
  },
  PE: {
    code: 'PE',
    name: 'Perú',
    currency: 'PEN',
    symbol: 'S/.',
    phonePrefix: '51',
    fee: 4.00,
    monthlySolo: 30.00,
    monthlyClinic: 260.00
  },
  EC: {
    code: 'EC',
    name: 'Ecuador',
    currency: 'USD',
    symbol: '$',
    phonePrefix: '593',
    fee: 1.00,
    monthlySolo: 8.00,
    monthlyClinic: 65.00
  },
  DO: {
    code: 'DO',
    name: 'República Dominicana',
    currency: 'DOP',
    symbol: '$',
    phonePrefix: '1809',
    fee: 60.00,
    monthlySolo: 450.00,
    monthlyClinic: 4000.00
  },
  CR: {
    code: 'CR',
    name: 'Costa Rica',
    currency: 'CRC',
    symbol: '₡',
    phonePrefix: '506',
    fee: 500.00,
    monthlySolo: 4000.00,
    monthlyClinic: 35000.00
  },
  GT: {
    code: 'GT',
    name: 'Guatemala',
    currency: 'GTQ',
    symbol: 'Q',
    phonePrefix: '502',
    fee: 8.00,
    monthlySolo: 60.00,
    monthlyClinic: 500.00
  },
  PA: {
    code: 'PA',
    name: 'Panamá',
    currency: 'USD',
    symbol: '$',
    phonePrefix: '507',
    fee: 1.00,
    monthlySolo: 8.00,
    monthlyClinic: 65.00
  },
  HN: {
    code: 'HN',
    name: 'Honduras',
    currency: 'HNL',
    symbol: 'L',
    phonePrefix: '504',
    fee: 25.00,
    monthlySolo: 200.00,
    monthlyClinic: 1600.00
  },
  SV: {
    code: 'SV',
    name: 'El Salvador',
    currency: 'USD',
    symbol: '$',
    phonePrefix: '503',
    fee: 1.00,
    monthlySolo: 8.00,
    monthlyClinic: 65.00
  },
  BO: {
    code: 'BO',
    name: 'Bolivia',
    currency: 'BOB',
    symbol: 'Bs',
    phonePrefix: '591',
    fee: 7.00,
    monthlySolo: 55.00,
    monthlyClinic: 450.00
  },
  UY: {
    code: 'UY',
    name: 'Uruguay',
    currency: 'UYU',
    symbol: '$',
    phonePrefix: '598',
    fee: 40.00,
    monthlySolo: 300.00,
    monthlyClinic: 2600.00
  },
  PY: {
    code: 'PY',
    name: 'Paraguay',
    currency: 'PYG',
    symbol: '₲',
    phonePrefix: '595',
    fee: 7000.00,
    monthlySolo: 60000.00,
    monthlyClinic: 500000.00
  },
  ES: {
    code: 'ES',
    name: 'España',
    currency: 'EUR',
    symbol: '€',
    phonePrefix: '34',
    fee: 1.00,
    monthlySolo: 8.00,
    monthlyClinic: 65.00
  },
  US: {
    code: 'US',
    name: 'Estados Unidos',
    currency: 'USD',
    symbol: '$',
    phonePrefix: '1',
    fee: 1.00,
    monthlySolo: 8.00,
    monthlyClinic: 65.00
  }
};

export const DEFAULT_COUNTRY = COUNTRIES.MX;

/**
 * Returns the country configuration by its 2-letter ISO code.
 * Falls back to Mexico (MX) if the country is not supported or not found.
 */
export function getCountryConfig(code?: string | null): CountryConfig {
  if (!code) return DEFAULT_COUNTRY;
  const upperCode = code.toUpperCase();
  return COUNTRIES[upperCode] || DEFAULT_COUNTRY;
}

/**
 * Formats a numeric price into the local currency string (e.g. "$150.00 MXN" or "8.00 €")
 */
export function formatPrice(price: number | string, countryCode?: string | null): string {
  const numPrice = typeof price === 'string' ? parseFloat(price) : price;
  if (isNaN(numPrice)) return 'N/A';
  
  const config = getCountryConfig(countryCode);
  const formattedVal = numPrice.toLocaleString('es-MX', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

  if (config.currency === 'EUR') {
    return `${formattedVal} ${config.symbol}`;
  }
  return `${config.symbol}${formattedVal} ${config.currency}`;
}
