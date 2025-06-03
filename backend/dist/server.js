"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const mongoose_1 = __importDefault(require("mongoose"));
const cors_1 = __importDefault(require("cors"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const keepAlive_1 = require("./utils/keepAlive");
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const chargingStation_routes_1 = __importDefault(require("./routes/chargingStation.routes"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const port = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI || '';
// Middleware
app.use(express_1.default.json());
app.use((0, cookie_parser_1.default)());
app.use((0, cors_1.default)({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
}));
if (process.env.NODE_ENV === 'production') {
    const url = process.env.SERVER_URL || '';
    (0, keepAlive_1.keepAlive)(url);
}
app.get('/', (req, res) => {
    res.send('Hello, World!');
});
// API routes
app.use('/api/auth', auth_routes_1.default);
app.use('/api/charging-stations', chargingStation_routes_1.default);
mongoose_1.default.connect(MONGODB_URI).then(() => {
    console.log('Connected to MongoDB');
    app.listen(port, () => {
        console.log(`Server running at http://localhost:${port}`);
    });
}).catch((error) => {
    console.error('Failed to connect to MongoDB:', error);
});
//# sourceMappingURL=server.js.map