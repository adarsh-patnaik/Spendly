const axios = require("axios");
const FxRate = require("../models/FxRate.model");

// In-memory cache: { "USD_EUR": { rate, fetchedAt } }
const rateCache = {};

const CACHE_TTL_MS = 90 * 60 * 1000; // 90 minutes

/**
 * Get exchange rate from baseCurrency to targetCurrency.
 * Checks memory cache → DB → Open Exchange Rates API.
 */
const getRate = async (baseCurrency, targetCurrency) => {
    if (baseCurrency === targetCurrency) return 1;

    const cacheKey = `${baseCurrency}_${targetCurrency}`;
    const cached = rateCache[cacheKey];

    // Check in-memory cache
    if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
        return cached.rate;
    }

    // Check DB (last 24 hours)
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const dbRate = await FxRate.findOne({
        baseCurrency,
        targetCurrency,
        fetchedAt: { $gte: cutoff },
    }).sort({ fetchedAt: -1 });

    if (dbRate) {
        rateCache[cacheKey] = { rate: dbRate.rate, fetchedAt: dbRate.fetchedAt.getTime() };
        return dbRate.rate;
    }

    // Fetch from Open Exchange Rates API
    const appId = process.env.OPEN_EXCHANGE_RATES_APP_ID;
    if (appId) {
        try {
            const res = await axios.get(
                `https://openexchangerates.org/api/latest.json?app_id=${appId}&base=USD`
            );
            const rates = res.data.rates;

            // Convert: base → USD → target
            const baseToUsd = 1 / (rates[baseCurrency] || 1);
            const rate = baseToUsd * (rates[targetCurrency] || 1);

            // Store in DB
            await FxRate.create({ baseCurrency, targetCurrency, rate, fetchedAt: new Date() });
            rateCache[cacheKey] = { rate, fetchedAt: Date.now() };
            return rate;
        } catch (err) {
            console.error("FX API error:", err.message);
        }
    }

    // Fallback: static approximate rates (USD base)
    const staticRates = {
        USD: 1, EUR: 0.92, GBP: 0.79, JPY: 149.5, CAD: 1.36, AUD: 1.53,
        CHF: 0.89, CNY: 7.24, INR: 83.1, MXN: 17.2, BRL: 4.97, SGD: 1.34,
        HKD: 7.82, NOK: 10.6, SEK: 10.4, DKK: 6.88, NZD: 1.63, ZAR: 18.6,
        AED: 3.67, THB: 35.1,
    };

    const baseRate = staticRates[baseCurrency] || 1;
    const targetRate = staticRates[targetCurrency] || 1;
    const rate = targetRate / baseRate;

    rateCache[cacheKey] = { rate, fetchedAt: Date.now() };
    return rate;
};

/**
 * Fetch and store all rates from Open Exchange Rates (called by cron).
 */
const fetchAndStoreAllRates = async () => {
    const appId = process.env.OPEN_EXCHANGE_RATES_APP_ID;
    if (!appId) return;

    try {
        const res = await axios.get(
            `https://openexchangerates.org/api/latest.json?app_id=${appId}&base=USD`
        );
        const rates = res.data.rates;
        const fetchedAt = new Date();

        const docs = Object.entries(rates).map(([target, rate]) => ({
            baseCurrency: "USD",
            targetCurrency: target,
            rate,
            fetchedAt,
        }));

        await FxRate.insertMany(docs, { ordered: false }).catch(() => { });
        console.log(`✅ FX rates updated: ${docs.length} currencies`);

        // Clear memory cache
        Object.keys(rateCache).forEach((k) => delete rateCache[k]);
    } catch (err) {
        console.error("FX rate fetch error:", err.message);
    }
};

// All ISO 4217 currencies (top 30 shown first)
const CURRENCIES = [
    { code: "USD", name: "US Dollar", symbol: "$", flag: "🇺🇸" },
    { code: "EUR", name: "Euro", symbol: "€", flag: "🇪🇺" },
    { code: "GBP", name: "British Pound", symbol: "£", flag: "🇬🇧" },
    { code: "JPY", name: "Japanese Yen", symbol: "¥", flag: "🇯🇵" },
    { code: "CAD", name: "Canadian Dollar", symbol: "CA$", flag: "🇨🇦" },
    { code: "AUD", name: "Australian Dollar", symbol: "A$", flag: "🇦🇺" },
    { code: "CHF", name: "Swiss Franc", symbol: "Fr", flag: "🇨🇭" },
    { code: "CNY", name: "Chinese Yuan", symbol: "¥", flag: "🇨🇳" },
    { code: "INR", name: "Indian Rupee", symbol: "₹", flag: "🇮🇳" },
    { code: "MXN", name: "Mexican Peso", symbol: "MX$", flag: "🇲🇽" },
    { code: "BRL", name: "Brazilian Real", symbol: "R$", flag: "🇧🇷" },
    { code: "SGD", name: "Singapore Dollar", symbol: "S$", flag: "🇸🇬" },
    { code: "HKD", name: "Hong Kong Dollar", symbol: "HK$", flag: "🇭🇰" },
    { code: "NOK", name: "Norwegian Krone", symbol: "kr", flag: "🇳🇴" },
    { code: "SEK", name: "Swedish Krona", symbol: "kr", flag: "🇸🇪" },
    { code: "DKK", name: "Danish Krone", symbol: "kr", flag: "🇩🇰" },
    { code: "NZD", name: "New Zealand Dollar", symbol: "NZ$", flag: "🇳🇿" },
    { code: "ZAR", name: "South African Rand", symbol: "R", flag: "🇿🇦" },
    { code: "AED", name: "UAE Dirham", symbol: "د.إ", flag: "🇦🇪" },
    { code: "THB", name: "Thai Baht", symbol: "฿", flag: "🇹🇭" },
    { code: "KRW", name: "South Korean Won", symbol: "₩", flag: "🇰🇷" },
    { code: "IDR", name: "Indonesian Rupiah", symbol: "Rp", flag: "🇮🇩" },
    { code: "TRY", name: "Turkish Lira", symbol: "₺", flag: "🇹🇷" },
    { code: "RUB", name: "Russian Ruble", symbol: "₽", flag: "🇷🇺" },
    { code: "SAR", name: "Saudi Riyal", symbol: "﷼", flag: "🇸🇦" },
    { code: "PLN", name: "Polish Zloty", symbol: "zł", flag: "🇵🇱" },
    { code: "PHP", name: "Philippine Peso", symbol: "₱", flag: "🇵🇭" },
    { code: "MYR", name: "Malaysian Ringgit", symbol: "RM", flag: "🇲🇾" },
    { code: "CZK", name: "Czech Koruna", symbol: "Kč", flag: "🇨🇿" },
    { code: "HUF", name: "Hungarian Forint", symbol: "Ft", flag: "🇭🇺" },
];

module.exports = { getRate, fetchAndStoreAllRates, CURRENCIES };
