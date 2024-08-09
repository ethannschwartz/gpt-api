import OpenAI from 'openai';
import express from 'express';
import cors from "cors";

// Initialize the OpenAI API with your API key and organization
const openai = new OpenAI({
    organization: process.env.OPENAI_ORGANIZATION,
    apiKey: process.env.OPENAI_API_KEY,
});


const app = express();
app.use(cors());
app.use(express.json());

const port = 5002;

// Function to generate textbook chapter content
async function generateTextbookChapter(inputText) {
    // The content for the system is the prompt that this instance will use when repsonding to your query.
    let conversationHistory = [
        {
            role: 'system',
            content: 'Convert the following text into a structured textbook chapter with a title, introduction, information, and summary sections (each with appropriate/sometimes fun title).'
        },
        {
            role: 'user',
            content: inputText
        }
    ];

    try {
        const response = await openai.chat.completions.create({
            model: 'gpt-4',
            messages: conversationHistory,
            temperature: 0.5,
            max_tokens: 3000,
        });

        // Accessing the generated text correctly
        return response.choices[0].message;

    } catch (error) {
        console.error("Error in generating textbook chapter:", error);
        throw error;
    }
}

// Endpoint to receive text and return a structured textbook chapter
app.post('/generate-chapter', async (req, res) => {
    if (!req.body || !req.body.text) {
        return res.status(400).json({error: 'Text input is required.'});
    }

    try {
        const chapterContent = await generateTextbookChapter(req.body.text, req.body.section);
        res.json({ chapterContent });
    } catch (error) {
        res.status(500).json({ error: 'An error occurred while generating the chapter.' });
    }
});

// Start the server
app.listen(port, () => console.log(`Server running on port ${port}`));

