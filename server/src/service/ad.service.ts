import { GoogleGenerativeAI } from "@google/generative-ai";
import { AdRequest } from "../api/ads/ad.types";

// Don't load dotenv here - it's already loaded in server.ts
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string);
const textModel = genAI.getGenerativeModel({
  model: "gemini-2.0-flash-exp", // Use text model, not image model
});

export class AdService {
  public async generateAdCopy(request: AdRequest): Promise<string> {
    const { product_name, playbook, discount } = request;

    console.log(`Generating ad for: ${product_name}, Playbook: ${playbook}`);

    let prompt = `
      You are 'MarketMate', a creative and helpful AI marketing assistant for
      small business owners in the Philippines. Your tone is energetic, friendly,
      and persuasive.

      Your task is to generate a short, catchy social media post.

      **Playbook:** ${playbook}
      **Product Name:** ${product_name}
    `;

    if (playbook === "Flash Sale") {
      const promo = discount || "Big Discount";
      prompt += `**Details:** This is an urgent Flash Sale. The product is ${promo}for a very limited time. Create a sense of urgency.`;
    } else if (playbook === "New Arrival") {
      prompt += `**Details:** This is a NEW ARRIVAL. Highlight that it's brand new and exciting.`;
    } else if (playbook === "Best Seller Spotlight") {
      prompt += `**Details:** This is a BESTSELLER. Highlight its popularity and why customers love it.`;
    } else if (playbook === "Bundle Up!") {
      prompt += `**Details:** This product is part of a new bundle. (e.g., ${product_name} + another item). Mention the great value.`;
    }

    prompt += "\n\n**Generated Post**";

    try {
      const result = await textModel.generateContent(prompt);
      const response = await result.response;
      const adText = response.text().trim();
      console.log(`Generated ad copy: ${adText.substring(0, 50)}...`);
      return adText;
    } catch (error) {
      console.error("Error calling Gemini API:", error);
      throw new Error("Sorry, I couldn't generate an ad right now.");
    }
  }
}
