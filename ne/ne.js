const express = require('express');
const axios = require('axios');
const uuid = require('uuid');

const app = express();
app.use(express.json());

// Provider URLs
let currentProvider = 'A'; // Initially set to the A provider
const providers = {
    A: {
        url: 'http://provider-a:3000/sendSMS',
        health: 'healthy',
        backup: 'B',
        responseTimes: [],
    },
    B: {
        url: 'http://provider-b:3000/sendSMS',
        health: 'healthy',
        backup: 'A',
        responseTimes: [],
    },
};


// Simulated SMS sending function
async function sendSMS(providerKey, messageId) {

    if (providers[providerKey].health === 'unhealthy') {
        console.log(`Using provider ${providers[providerKey].backup} instead of ${providerKey}`);
        providerKey = providers[providerKey].backup;
    }
    const url = providers[providerKey].url;
    const start = Date.now();

    try {
        const response = await axios.post(url);
        const responseTime = Date.now() - start;
        console.log(`SMS ${messageId} sent via ${providerKey} in ${responseTime}ms`);
        providers[providerKey].responseTimes.push(responseTime);
        return responseTime;
    } catch (error) {
        console.error(`Failed to send SMS ${messageId} via ${providerKey}: ${error.message}`);
        console.log(`Setting provider ${providerKey} to unhealthy due to error.`);
        providers[providerKey].health = 'unhealthy';
        setTimeout(() => {
            providers[providerKey].health = 'healthy';
            providers[providerKey].responseTimes = []; // Reset tracking
            console.log(`Marking provider ${providerKey} as healthy again.`);
        }, 1 * 60 * 1000);

        if (providers.A.health === 'unhealthy' && providers.B.health === 'unhealthy') {
            console.log(`Both providers are unhealthy. Giving up on SMS ${messageId}.`);
            throw new Error('Both providers are unhealthy');
        } else {
            console.log(`Retrying SMS ${messageId} with B provider.`);
            return await sendSMS('B', messageId);
        }
    }
}

// Limit response times to the last 10 requests
const MAX_HISTORY = 10;
const LATENCY_DELAY_MINUTES = 1;

function checkResponseTimes() {
    let logMsg = '|| ';
    for (const providerKey of Object.keys(providers)) {
        // Keep only the latest X response times for each provider
        if (providers[providerKey].length > MAX_HISTORY) {
            providers[providerKey].responseTimes = providers[providerKey].responseTimes.slice(-MAX_HISTORY);
        }

        const totalRequests = providers[providerKey].responseTimes.length;
        const slowRequests = providers[providerKey].responseTimes.filter((time) => time > 5000).length;
        const slowPercentage = (totalRequests > 0) ? (slowRequests / totalRequests) * 100 : 0;
        logMsg += `Provider ${providerKey}: ${slowPercentage.toFixed(2)}% slow responses || `;
        

        if (slowPercentage > 5 && providers[providerKey].health === 'healthy') {
            console.log(`Setting provider ${providerKey} to unhealthy due to latency.`);
            providers[providerKey].health = 'unhealthy';

            // Marking provider healthy again after X minutes
            setTimeout(() => {
                providers[providerKey].health = 'healthy';
                providers[providerKey].responseTimes = []; // Reset tracking
                console.log(`Marking provider ${providerKey} as healthy again.`);
            }, LATENCY_DELAY_MINUTES * 60 * 1000);
        }
    }
    console.log(logMsg);
}

// SMS endpoint to send SMS
app.post('/send-sms', async (req, res) => {
    try {
        const messageId = uuid.v4();
        const { provider } = req.body;
        const responseTime = await sendSMS(provider, messageId);
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

