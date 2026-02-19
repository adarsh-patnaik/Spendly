const OpenAI = require("openai");
const MerchantCategoryMap = require("../models/MerchantCategoryMap.model");
const Category = require("../models/Category.model");

const openai = process.env.OPENAI_API_KEY
    ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
    : null;

const DEFAULT_CATEGORIES = [
    "Food & Dining", "Transportation", "Shopping", "Entertainment",
    "Health & Wellness", "Housing & Utilities", "Travel", "Education",
    "Business", "Personal Care", "Subscriptions", "Gifts & Donations",
    "Taxes & Fees", "Uncategorized",
];

/**
 * Categorize a merchant using:
 * 1. User-specific merchant map (override_count >= 3 → 100% confidence)
 * 2. Global merchant map
 * 3. OpenAI GPT-4o mini
 * Returns { categoryId, categoryName, confidence }
 */
const categorize = async (merchant, notes = "", userId) => {
    if (!merchant) return null;

    const merchantKey = merchant.toLowerCase().trim();

    // Step 1: User-specific map
    if (userId) {
        const userMap = await MerchantCategoryMap.findOne({
            userId,
            merchantKey,
        }).populate("categoryId");

        if (userMap && userMap.overrideCount >= 3) {
            return {
                categoryId: userMap.categoryId._id,
                categoryName: userMap.categoryId.name,
                confidence: 100,
            };
        }

        if (userMap && userMap.confidence >= 60) {
            return {
                categoryId: userMap.categoryId._id,
                categoryName: userMap.categoryId.name,
                confidence: userMap.confidence,
            };
        }
    }

    // Step 2: Global map
    const globalMap = await MerchantCategoryMap.findOne({
        userId: null,
        merchantKey,
    }).populate("categoryId");

    if (globalMap && globalMap.confidence >= 60) {
        return {
            categoryId: globalMap.categoryId._id,
            categoryName: globalMap.categoryId.name,
            confidence: globalMap.confidence,
        };
    }

    // Step 3: OpenAI
    if (!openai) return null;

    try {
        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                {
                    role: "system",
                    content: `You are an expense categorizer. Given a merchant name and optional notes, return the most appropriate category from this list: [${DEFAULT_CATEGORIES.join(", ")}]. Respond ONLY with valid JSON: {"category": "...", "confidence": 0.0-1.0}`,
                },
                {
                    role: "user",
                    content: `Merchant: "${merchant}"${notes ? `, Notes: "${notes}"` : ""}`,
                },
            ],
            response_format: { type: "json_object" },
            max_tokens: 100,
        });

        const result = JSON.parse(completion.choices[0].message.content);
        const categoryName = result.category;
        const confidence = Math.round((result.confidence || 0.5) * 100);

        // Find category in DB
        const category = await Category.findOne({
            name: categoryName,
            userId: null,
        });

        if (!category) return null;

        // Store in global map if confidence >= 80
        if (confidence >= 80) {
            await MerchantCategoryMap.findOneAndUpdate(
                { userId: null, merchantKey },
                { categoryId: category._id, confidence, lastUsedAt: new Date() },
                { upsert: true, new: true }
            );
        }

        return { categoryId: category._id, categoryName, confidence };
    } catch (err) {
        console.error("AI categorization error:", err.message);
        return null;
    }
};

/**
 * Record user feedback on AI suggestion.
 * Increments override_count if user corrected the suggestion.
 */
const recordFeedback = async (userId, merchant, categoryId, accepted) => {
    if (!merchant) return;

    const merchantKey = merchant.toLowerCase().trim();

    if (!accepted) {
        // User corrected — increment override count
        await MerchantCategoryMap.findOneAndUpdate(
            { userId, merchantKey },
            {
                $inc: { overrideCount: 1 },
                $set: { categoryId, lastUsedAt: new Date() },
            },
            { upsert: true, new: true }
        );
    } else {
        await MerchantCategoryMap.findOneAndUpdate(
            { userId, merchantKey },
            { $set: { categoryId, lastUsedAt: new Date() } },
            { upsert: true }
        );
    }
};

module.exports = { categorize, recordFeedback };
