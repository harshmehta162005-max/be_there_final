import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export async function POST(req) {
    try {
        const { prompt } = await req.json();

        if (!prompt) {
            return NextResponse.json(
                { error: "Prompt is required" },
                { status: 400 }
            );
        }

        const model = genAI.getGenerativeModel({
            model: "gemini-2.0-flash",
        });

        const systemPrompt = `
Return ONLY valid minified JSON.
No markdown. No backticks. No explanation.

JSON schema:
{
  "title": "string",
  "description": "string (single paragraph, no line breaks)",
  "category": "tech | music | sports | art | food | business | health | education | gaming | networking | outdoor | community",
  "suggestedCapacity": number,
  "suggestedTicketType": "free" | "paid"
}

User input:
${prompt}
`;

        const result = await model.generateContent(systemPrompt);
        const text = result.response.text();

        // 🔧 HARD SANITIZATION
        let cleaned = text
            .replace(/```json|```/g, "")
            .replace(/\n/g, " ")
            .replace(/\t/g, " ")
            .trim();

        // 🛡️ Safe JSON parse
        let data;
        try {
            data = JSON.parse(cleaned);
        } catch (parseError) {
            console.error("RAW AI OUTPUT:", text);
            return NextResponse.json(
                { error: "AI returned invalid JSON" },
                { status: 500 }
            );
        }

        // 🧪 Final validation (VERY IMPORTANT)
        if (
            !data.title ||
            !data.description ||
            !data.category ||
            !data.suggestedCapacity ||
            !data.suggestedTicketType
        ) {
            return NextResponse.json(
                { error: "Incomplete AI response" },
                { status: 500 }
            );
        }

        return NextResponse.json(data);
    } catch (error) {
        console.error("Gemini error:", error);
        return NextResponse.json(
            { error: "Failed to generate event" },
            { status: 500 }
        );
    }
}
