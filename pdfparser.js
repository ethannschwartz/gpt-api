import fs from 'fs';
import pdf from 'pdf-parse';
import axios from 'axios';

// Replace this with the absolute path to your file
let absolutePath = '/Users/ethanschwartz/WebstormProjects/gpt-api/pdfs/02-valid.pdf';
let dataBuffer = fs.readFileSync(absolutePath);

pdf(dataBuffer).then(function(data) {
    const apiEndpoint = 'http://localhost:5002/generate-chapter';

    const requestBody = {
        text: data.text.substring(0, 3000),
    };
    // Use Axios to make the POST request
    axios.post(apiEndpoint, requestBody)
        .then(response => {
            console.log('API response:', response.data.chapterContent.content);
        })
        .catch(error => {
            console.error('API request error:', error.response.data);
        });
});