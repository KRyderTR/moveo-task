type AiInsight = { source: string; mode: "personalized" | "general"; text: string };

function fallbackAi(mode: "personalized" | "general", prefs: { investorType: string; assets: string[] }): AiInsight {
    const assetText = prefs.assets.length ? prefs.assets.join(", ") : "top crypto assets";

    if (mode === "general") {
        return {
            source: "fallback",
            mode,
            text:
                "Daily insight: Manage risk, avoid overtrading, and focus on a consistent strategy rather than short-term noise.",
        };
    }

    return {
        source: "fallback",
        mode,
        text: `Daily insight for a ${prefs.investorType} interested in ${assetText}: Define rules (entries/exits), size positions conservatively, and stick to your plan during volatility.`,
    };
}

function buildPrompt(mode: "personalized" | "general", prefs: { investorType: string; assets: string[] }) {
    const assets = prefs.assets.length ? prefs.assets.join(", ") : "major crypto assets";

    if (mode === "general") {
        return [
            "You are a concise crypto assistant.",
            "Write ONE short daily insight (2-4 sentences).",
            "No financial advice disclaimer needed, but avoid giving direct buy/sell instructions.",
            "Keep it actionable and high-level.",
        ].join("\n");
    }

    return [
        "You are a concise crypto assistant.",
        `User investor type: ${prefs.investorType}.`,
        `User interested assets: ${assets}.`,
        "Write ONE short daily insight (2-4 sentences) tailored to this profile.",
        "Avoid direct buy/sell commands. Mention risk management in a subtle way.",
    ].join("\n");
}

export async function getAiInsight(params: {
    mode: "personalized" | "general";
    investorType: string;
    assets: string[];
}): Promise<AiInsight> {
    const apiKey = process.env.OPENROUTER_API_KEY;
    const model = process.env.OPENROUTER_MODEL || "meta-llama/llama-3.1-8b-instruct:free";

    if (!apiKey) {
        return fallbackAi(params.mode, { investorType: params.investorType, assets: params.assets });
    }

    try {
        const prompt = buildPrompt(params.mode, { investorType: params.investorType, assets: params.assets });

        const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${apiKey}`,
                "Content-Type": "application/json",
                "HTTP-Referer": "http://localhost",
                "X-Title": "Moveo Task",
            },
            body: JSON.stringify({
                model,
                messages: [
                    { role: "system", content: "You are a helpful assistant." },
                    { role: "user", content: prompt },
                ],
                temperature: 0.7,
                max_tokens: 120,
            }),
        });

        if (!res.ok) {
            console.log("OpenRouter status:", res.status);

            throw new Error(`OpenRouter HTTP ${res.status}`);
        }

        const json: unknown = await res.json();

        // Extract: choices[0].message.content
        const content =
            typeof json === "object" &&
                json !== null &&
                "choices" in json &&
                Array.isArray((json as any).choices) &&
                (json as any).choices[0] &&
                (json as any).choices[0].message &&
                typeof (json as any).choices[0].message.content === "string"
                ? (json as any).choices[0].message.content
                : null;

        if (!content) {
            return fallbackAi(params.mode, { investorType: params.investorType, assets: params.assets });
        }

        return {
            source: "openrouter",
            mode: params.mode,
            text: content.trim(),
        };
    } catch {
        return fallbackAi(params.mode, { investorType: params.investorType, assets: params.assets });
    }
}
