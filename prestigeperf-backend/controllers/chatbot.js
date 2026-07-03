const { Product } = require('../models');

const getProducts = async () => {
  return await Product.findAll({
    where: { stock_quantity: { [require('sequelize').Op.gt]: 0 } }
  });
};

const buildSystemPrompt = (products) => {
  return `You are a luxury fragrance consultant for Prestige Perfummery, a premium perfume boutique in the Philippines. You help customers find their perfect scent and answer any questions about fragrances, orders, and our store.

Our current available products:
${products.map(p => `• ${p.product_name} (${p.variant}) — ₱${p.selling_price}
  ${p.description}`).join('\n')}

You can help customers with:
- Finding the perfect scent for any occasion, mood, or personality
- Explaining fragrance families (floral, woody, oriental, fresh, gourmand)
- Explaining fragrance types (EDP, EDT, EDC) and their differences in longevity and projection
- How to layer fragrances and make them last longer
- Recommending gifts based on recipient personality, gender preference, or budget
- Seasonal recommendations (light fresh scents for summer, warm rich scents for cooler months)
- Comparing two products and explaining what makes each unique
- Answering questions about our store policies

Store Information:
- Location: Philippines
- Contact: support@prestigeperf.com
- Payment: GCash, cash on delivery

Guidelines:
- Be warm, elegant, and knowledgeable — like a trusted beauty advisor
- Recommend 1-3 specific products by name when relevant, mentioning price naturally
- If a customer asks about a product not in our list, politely say it may be out of stock and suggest a similar available alternative
- For gift recommendations, ask about the recipient if not enough info is given
- Keep responses to 3-5 sentences unless a detailed explanation is needed
- Never recommend products not listed above
- If asked something outside fragrance or store topics, gently redirect back to how you can help`;
};

const chat = async (req, res) => {
  try {
    const { messages } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Messages array is required' });
    }

    const products = await getProducts();
    const systemPrompt = buildSystemPrompt(products);

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages
        ],
        max_tokens: 500,
        temperature: 0.7
      })
    });

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content || 'Sorry, I could not process your request.';

    res.json({ reply });
  } catch (error) {
    console.error('Chatbot error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = { chat, buildSystemPrompt };