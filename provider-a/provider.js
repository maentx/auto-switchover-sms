const express = require('express');
const app = express();

let outage = false;
let errorRate = 0;
let delay = 0;
let delayedResponsePercentage = 0;
let delayTimer;

app.use(express.json());

app.post('/sendSMS', (req, res) => {
    if (outage) {
        return res.status(500).json({ error: 'Service outage' });
    }

    if (Math.random() < errorRate / 100) {
        return res.status(500).json({ error: 'Error occurred' });
    }

    const isDelayed = Math.random() < delayedResponsePercentage / 100;
    const responseDelay = isDelayed ? delay : 50;

    setTimeout(() => {
        res.json({ message: 'SMS sent successfully' });
    }, responseDelay);
});

app.post('/startOutage', (req, res) => {
    const { errorRateInPercent, timeUntilResponseTimesGoBackToNormal } = req.body;

    outage = true;
    errorRate = errorRateInPercent || 100;

    if (timeUntilResponseTimesGoBackToNormal) {
        setTimeout(() => {
            outage = false;
            errorRate = 0;
        }, timeUntilResponseTimesGoBackToNormal);
    }

    res.json({ message: 'Outage started' });
});

app.post('/endOutage', (req, res) => {
    outage = false;
    errorRate = 0;

    res.json({ message: 'Outage ended' });
});

app.post('/delayResponses', (req, res) => {
    const { delayInMs, percentageOfDelayedResponses, timeUntilResponseGoBackToNormal } = req.body;

    delay = delayInMs || 0;
    delayedResponsePercentage = percentageOfDelayedResponses || 0;

    if (timeUntilResponseGoBackToNormal) {
        clearTimeout(delayTimer);
        delayTimer = setTimeout(() => {
            delay = 0;
            delayedResponsePercentage = 0;
        }, timeUntilResponseGoBackToNormal);
    }

    res.json({ message: 'Response delay configured' });
});

app.post('/endDelays', (req, res) => {
    clearTimeout(delayTimer);
    delay = 0;
    delayedResponsePercentage = 0;

    res.json({ message: 'Response delays ended' });
});

const PORT = 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

