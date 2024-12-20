while ( true ); do curl -X POST http://localhost:3000/send-sms; sleep 0.01; done

curl -X POST http://localhost:3000/startOutage -H "Content-Type: application/json" -d '{ "errorRateInPercent": 100, "timeUntilResponseTimesGoBackToNormal": 60000 }'

curl -X POST http://localhost:3000/endOutage

curl -X POST http://localhost:3000/delayResponses -H "Content-Type: application/json" -d '{ "delayInMs": 100, "percentageOfDelayedResponses": 50, "timeUntilResponseGoBackToNormal": 60000 }'

curl -X POST http://localhost:3000/endDelays
