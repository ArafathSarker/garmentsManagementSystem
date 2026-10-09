import { app } from '../app/index.js';

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
    console.log(`Backend server is running on port ${PORT}`);
});
