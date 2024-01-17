import { createInterface } from 'readline';
import OpenAI from 'openai';

const openai = new OpenAI({
    organization: 'publify',
    apiKey: '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',
});

let backgroundInformation = '';
let conversationHistory = [];

async function getResponse(userInput) {
    // Add the user's question to the history
    conversationHistory.push({ role: 'user', content: userInput });

    // Use the system message to set context and guidelines
    const systemMessage =
        'Context: You are an AI assistant. Please provide answers based on the provided background information.';
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

    askQuestion(); // Start the conversation
}

main();
