const { GoogleGenerativeAI } = require("@google/generative-ai");

if (!process.env.GEMINI_API_KEY) {
  console.error("FATAL: GEMINI_API_KEY is not set in environment variables!");
} else {
  console.log("Gemini API Key found:", process.env.GEMINI_API_KEY.substring(0, 5) + "...");
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function extractInvoiceData(fileBuffer, mimeType, availableCategories = "") {
  try {
    const modelName = "gemini-2.5-flash";
    console.log("Using Gemini Model:", modelName);
    const model = genAI.getGenerativeModel({ 
      model: modelName,
    });

    const categoryInstructions = availableCategories 
      ? `Available categories in the system: ${availableCategories}. Choose the MOST APPROPRIATE category from this list.`
      : `Category options: Electronics, Furniture, Office Supplies, Hardware, Clothing, Food & Beverage, or infer the most appropriate category.`;

    const prompt = `
      You are an expert at analyzing invoices and receipts. Carefully examine this image and extract information for ALL items listed.
      
      **IMPORTANT: The text in this image may be rotated or sideways. Read text in ALL orientations (0°, 90°, 180°, 270°).**
      
      Extract these fields for EACH item in JSON format:
      - name: The item/product name (be VERY SHORT and include the item BRAND. Format: "Brand - Short Name")
      - category: ${categoryInstructions}
      - quantity: The quantity purchased (look for "Qty", "Quantity", or count. Default to 1 if not found)


      - supplier: The supplier/vendor/company name (look at the top of the invoice - this will be the same for all items)
      - model: Model number, SKU, or product code (if visible)
      - serialNumber: **CRITICAL - READ CAREFULLY FOR SERIAL NUMBERS**
        * **READ TEXT IN ALL ORIENTATIONS** - Text may be rotated 90°, 180°, or 270°
        * Look EVERYWHERE in the document for serial numbers, including:
          - Fields labeled: "Serial", "S/N", "Serial No", "Serial Number", "SN", "Serial #", "Sr. No"
          - Product codes that look like serial numbers (alphanumeric codes)
          - Codes starting with common prefixes: SC, SN, SR, SL, PN, etc.
          - Barcodes or QR code numbers
          - Item-specific identifiers (not invoice numbers)
          - Any long alphanumeric codes near the product name
          - Codes in format like: SC4157310, SN123456, ABC-123-XYZ, 1234567890, A1B2C3D4, etc.
          - Text written vertically or sideways
          - Numbers in tables or columns
        * Common patterns: 
          - Alphanumeric with prefix (e.g., SC4157310, SN12345ABC, A1B2C3D4E5)
          - Numeric only (e.g., 1234567890, 987654321)
          - Hyphenated (e.g., ABC-123-XYZ, 12-34-56)
          - Mixed case (e.g., AbC123XyZ)
        * **EXTRACT ALL CODES** that could be serial numbers - if you see SC4157310, SC4157308, SC4157309, etc., include ALL of them
        * If multiple serial numbers exist for one item, separate with commas
        * Look in tables, columns, or anywhere near the item description
        * Check rotated/sideways text carefully
        * DO NOT confuse with: invoice number, order number, date, phone number, or price
        * If you find ANY alphanumeric code that could be a serial number, include it
        * If truly no serial number exists after thorough search in all orientations, leave as empty string ""
      - warranty: Warranty period or duration (e.g., "3 Years", "12 Months", "2 Years Warranty"). Look for text mentioning warranty, guarantee, or coverage period.
      - location: Storage location if mentioned (otherwise leave as empty string)
      - description: A brief description of the item (combine details from the invoice)

      IMPORTANT INSTRUCTIONS:
      1. **ROTATE YOUR READING** - Look at text from all angles (0°, 90°, 180°, 270°)
      2. Look carefully at ALL text in the image, including headers, line items, details, tables, fine print, and sideways text
      3. Extract information for EVERY item listed in the invoice - create a separate object for each item
      4. If only ONE item is present, return an array with one object
      5. For the category field, you MUST choose from the available categories list if provided
      6. The supplier name is usually at the top of the invoice and is the SAME for all items
      7. **SERIAL NUMBERS ARE CRITICAL** - Scan the ENTIRE document multiple times in all orientations to find them
      8. **EXTRACT ALL SERIAL NUMBER CODES** - If you see multiple codes like SC4157310, SC4157308, include them all
      9. For unclear or missing fields, use reasonable defaults:
         - quantity: 1

         - location: ""
         - serialNumber: "" (only if truly not found after thorough search in all orientations)
      10. Return ONLY valid JSON array - no markdown, no explanations, no extra text
      11. Ensure all string values are properly escaped

      Return format (MUST be an array):
      [
        {
          "name": "first item name",
          "category": "category from available list",
          "quantity": 1,
          "price": 1200.00,
          "totalPrice": 1200.00,
          "supplier": "supplier name",
          "model": "model/sku",
          "serialNumber": "SC4157310",
          "warranty": "3 Years",
          "location": "",
          "description": "brief description"
        },
        {
          "name": "second item name",
          "category": "category from available list",
          "quantity": 2,
          "price": 50.00,
          "totalPrice": 100.00,
          "supplier": "supplier name",
          "model": "model/sku2",
          "serialNumber": "SC4157308, SC4157309",
          "warranty": "3 Years",
          "location": "",
          "description": "brief description"
        }
      ]
    `;

    const imagePart = {
      inlineData: {
        data: fileBuffer.toString("base64"),
        mimeType: mimeType,
      },
    };

    const result = await model.generateContent([prompt, imagePart]);
    const response = await result.response;
    const text = response.text();

    // Clean up the response to ensure it's valid JSON
    let jsonString = text.replace(/```json/g, "").replace(/```/g, "").trim();
    
    // Try to parse the JSON
    let extractedData;
    try {
      extractedData = JSON.parse(jsonString);
      console.log("Extracted data from Gemini:", extractedData);
    } catch (parseError) {
      console.error("JSON Parse Error:", parseError);
      console.error("Raw response:", text);
      
      // Return default structure if parsing fails
      return [{
        name: "",
        category: "General",
        quantity: 1,

        supplier: "",
        model: "",
        serialNumber: "",
        warranty: "",
        location: "Warehouse - General",
        description: "Failed to extract data from invoice"
      }];
    }
    
    // Ensure we have an array (backward compatibility if single object is returned)
    const itemsArray = Array.isArray(extractedData) ? extractedData : [extractedData];
    
    // Ensure all required fields exist with defaults for each item
    const processedItems = itemsArray.map((item, index) => {
      const processed = {
        name: item.name || "",
        category: item.category || "General",
        quantity: item.quantity || 1,

        supplier: item.supplier || "",
        model: item.model || "",
        serialNumber: item.serialNumber || "",
        warranty: item.warranty || "",
        location: item.location || "Warehouse - General",
        description: item.description || ""
      };
      
      // Log serial number extraction for debugging
      console.log(`Item ${index + 1} - ${processed.name}:`);
      console.log(`  Serial Number: "${processed.serialNumber}" ${processed.serialNumber ? '✓' : '✗ (not found)'}`);
      
      return processed;
    });
    
    return processedItems;
  } catch (error) {
    console.error("Error extracting invoice data:", error);
    if (error.response) {
      console.error("Gemini API Error Response:", error.response);
    }
    throw new Error("Failed to process invoice with Gemini API: " + error.message);
  }
}

module.exports = { extractInvoiceData };
