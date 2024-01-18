import { createInterface } from 'readline';
import OpenAI from 'openai';
import express from 'express';
import cors from "cors";
import YAML from 'yamljs';
import swaggerUi from "swagger-ui-express";

const swaggerDocument = YAML.load('./swagger.yaml');

const openai = new OpenAI({
    organization: 'publify',
    apiKey: "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",
});

let backgroundInformation = '';
let conversationHistory = [];

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }))
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

const port = 5002;

async function getResponse(userInput) {
    conversationHistory.push({ role: 'user', content: userInput });

    const systemMessage =
        'Context: You are an AI assistant. Please provide answers based on the provided background information. If the users asks questions with regard other topics, please specify that you are only able to provide information relating to what was provided in the background information.';
    conversationHistory.push({ role: 'system', content: systemMessage });

    const backgroundMessage = 'Background information: ' + backgroundInformation;
    conversationHistory.push({ role: 'system', content: backgroundMessage });

    // Use the conversation history to instruct the model
    const completion = await openai.chat.completions.create({
        messages: conversationHistory,
        model: 'gpt-3.5-turbo',
        temperature: 0.2, // Adjust the temperature as needed
        max_tokens: 50, // Adjust max_tokens as needed
    });

    // Remove last system message from conversation
    conversationHistory.pop();

    return completion.choices[0].message.content;
}

async function main() {
    app.listen(port, () => console.log(`Server is running on port ${port}`));

    const readline = createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    await new Promise((resolve) => {
        readline.question('Please enter the background information: ', async (input) => {
            backgroundInformation = input;
            resolve();
        });
    });

    const askQuestion = () => {
        readline.question('Enter your message: ', async (input) => {
            if (input.toLowerCase() === 'exit') {
                readline.close();
            } else {
                const response = await getResponse(input);
                console.log('AI:', response);
                askQuestion();
            }
        });
    };

    app.post('/set-background', (req, res) => {
        if (!req.body || !req.body.background) {
            return res.status(400).json({error: 'Background information is required.'});
        }

        backgroundInformation = req.body.background;
        res.json({message: 'Background information updated successfully'});
    });

    app.get('/get-response', async (req, res) => {
        const userInput = req.query.text;

        if (!userInput) {
            res.status(400).json({ error: 'Please provide a text parameter.' });
        } else {
            try {
                const response = await getResponse(userInput);
                res.json({ response });
            } catch (error) {
                res.status(500).json({ error: 'An error occurred while processing the request.' });
            }
        }
    });

    askQuestion(); // Start the conversation
}

main();
