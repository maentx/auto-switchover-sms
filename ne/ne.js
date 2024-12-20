const express = require('express');
const axios = require('axios');

const app = express();
app.use(express.json());

// Provider URLs
const providers = {
    primary: 'http://provider-a:3000/sendSMS',  // URL for Provider A
    secondary: 'http://provider-b:3000/sendSMS', // URL for Provider B
};

let currentProvider = 'primary'; // Initially set to the primary provider
let responseTimes = [];

// Simulated SMS sending function
async function sendSMS(providerKey) {
    const url = providers[providerKey];
    const start = Date.now();

    try {
        const response = await axios.post(url);
        const responseTime = Date.now() - start;
        console.log(`SMS sent via ${providerKey} in ${responseTime}ms`);
        return responseTime;
    } catch (error) {
        console.error(`Failed to send SMS via ${providerKey}: ${error.message}`);
        // Switch to secondary provider if an error occurs
        if (providerKey === 'primary') {
            console.log(`Switching to secondary provider due to error.`);
            currentProvider = 'secondary';

            // Switch back to primary provider after 5 minutes
            setTimeout(() => {
                currentProvider = 'primary';
                responseTimes = []; // Reset tracking
                console.log(`Switching back to primary provider.`);
            }, 1 * 60 * 1000);
        }
        throw error;
    }
}

// Function to check response times and switch providers if necessary
function checkResponseTimes() {
    const totalRequests = responseTimes.length;
    const slowRequests = responseTimes.filter((time) => time > 5000).length;
    const slowPercentage = (slowRequests / totalRequests) * 100;

    if (slowPercentage > 5 && currentProvider !== 'secondary') {
        console.log(`Switching to secondary provider due to slow responses.`);
        currentProvider = 'secondary';

        // Switch back to primary provider after X minutes
        setTimeout(() => {
            currentProvider = 'primary';
            responseTimes = []; // Reset tracking
            console.log(`Switching back to primary provider.`);
        }, 1 * 60 * 1000);
    }
}

// SMS endpoint to send SMS
app.post('/send-sms', async (req, res) => {
    try {
        const responseTime = await sendSMS(currentProvider);
        responseTimes.push(responseTime);
        checkResponseTimes();
        res.json({ success: true });
    } catch (error) {
        console.error(`Error sending SMS: ${error}`);
        res.status(500).json({ success: false });
    }
});

// Start server and listen on the specified port
const port = 3000;
app.listen(port, () => {
    console.log(`SMS microservice running on port ${port}`);
});

