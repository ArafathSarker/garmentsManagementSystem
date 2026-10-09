import { app } from '../app/index.js';
import { startMqttWorker } from '../modules/mqtt/worker.js';

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
    console.log(`Backend server is running on port ${PORT}`);
    
    // Initialize MQTT simulator integration
    startMqttWorker();
});
