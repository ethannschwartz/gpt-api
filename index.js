// don't forget to change name to index.js from index.js
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
app.use(cors()); // Only if you're dealing with CORS
app.use(express.json()); // For parsing application/json
app.use(express.urlencoded({ extended: true })); // For parsing application/x-www-form-urlencoded
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

const port = 5002;

async function getResponse(userInput) {
    // Add the user's question to the history
    conversationHistory.push({ role: 'user', content: userInput });

    // Use the system message to set context and guidelines
    const systemMessage =
        'Context: You are an AI assistant. Please provide answers based on the provided background information. If the users asks questions with regard other topics, please specify that you are only able to provide information relating to what was provided in the background information.';
    conversationHistory.push({ role: 'system', content: systemMessage });

    // Use a system message to remind the model of the background information
    const backgroundMessage = 'Background information: ' + backgroundInformation;
    conversationHistory.push({ role: 'system', content: backgroundMessage });

    // Use the conversation history to instruct the model
    const completion = await openai.chat.completions.create({
        messages: conversationHistory,
        model: 'gpt-3.5-turbo',
        temperature: 0.2, // Adjust the temperature as needed
        max_tokens: 50, // Adjust max_tokens as needed
    });

    // Extract the AI's response
    // Remove the last system messages from conversation history
    conversationHistory.pop();

    return completion.choices[0].message.content;
}

async function main() {
    // Listen on the specified port
    app.listen(port, () => {
        console.log(`Server is running on port ${port}`);
    });

    const readline = createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    // Upload and store background information
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
                askQuestion(); // Ask the next question
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
