import mqtt from 'mqtt';
import crypto from 'crypto';
import { processEventsService } from '../events/service.js';
import { getStateQueries } from '../state/queries.js';

// Setup basic environment variables fallback if missing
const BROKER_URL = process.env.MQTT_BROKER_URL || 'mqtt://152.42.238.142:1883';
const CANDIDATE_ID = process.env.CANDIDATE_ID || 'CAND-017';

const shortSuffix = crypto.randomBytes(4).toString('hex');
const clientId = `fse01-${CANDIDATE_ID}-${shortSuffix}`;

const TOPICS = {
  challenge: `fse-01/${CANDIDATE_ID}/challenge`,
  response: `fse-01/${CANDIDATE_ID}/response`,
  status: `fse-01/${CANDIDATE_ID}/status`
};

export function startMqttWorker() {
  console.log(`Starting MQTT Worker with Client ID: ${clientId}`);
  console.log(`Connecting to Broker: ${BROKER_URL}`);

  const client = mqtt.connect(BROKER_URL, {
    clientId: clientId,
    protocolVersion: 5, // Assessment allows 3.1.1 or 5.0
    clean: true,
  });

  client.on('connect', () => {
    console.log('Successfully connected to MQTT broker.');
    
    // Subscribe to the challenge topic
    client.subscribe(TOPICS.challenge, { qos: 1 }, (err) => {
      if (err) {
        console.error('Failed to subscribe to challenge topic:', err);
      } else {
        console.log(`Subscribed to topic: ${TOPICS.challenge}`);
        
        // Publish an initial status heartbeat
        client.publish(TOPICS.status, JSON.stringify({ 
          status: "ONLINE",
          timestamp: new Date().toISOString()
        }), { qos: 1, retain: false });
      }
    });
  });

  client.on('message', async (topic, message) => {
    if (topic === TOPICS.challenge) {
      try {
        const payload = JSON.parse(message.toString());
        console.log(`Received challenge: ${payload.challenge_id}`);

        const results = await processEventsService(payload.events);
        
        // Read state through the same query functions
        const state = await getStateQueries();

        // Matching response format for simulator
        const responsePayload = {
           challenge_id: payload.challenge_id,
           status: "PROCESSED",
           timestamp: new Date().toISOString(),
           results: results,
           state: state
        };

        client.publish(TOPICS.response, JSON.stringify(responsePayload), { qos: 1, retain: false }, (err) => {
           if (err) console.error("Failed to publish response:", err);
           else console.log(`Published response for challenge: ${payload.challenge_id}`);
        });

      } catch (e) {
        console.error("Error processing MQTT message:", e);
      }
    }
  });

  client.on('error', (err) => {
    console.error('MQTT Client Error:', err);
  });
}
