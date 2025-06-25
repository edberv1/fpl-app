const express = require('express');
const { OpenAI } = require('openai');
const router = express.Router();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

router.post('/suggestion', async (req, res) => {
  const { prompt } = req.body;

  try {
    const response = await openai.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'gpt-4',
    });

    res.json({ reply: response.choices[0].message.content });
  } catch (err) {
    res.status(500).json({ error: 'AI request failed' });
  }
});

module.exports = router;
