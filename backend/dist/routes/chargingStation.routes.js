"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const chargingStation_controller_1 = require("../controllers/chargingStation.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = express_1.default.Router();
router.post('/', auth_middleware_1.protect, chargingStation_controller_1.create);
router.get('/', auth_middleware_1.protect, chargingStation_controller_1.getAll);
router.get('/:id', auth_middleware_1.protect, chargingStation_controller_1.getById);
router.put('/:id', auth_middleware_1.protect, chargingStation_controller_1.update);
router.delete('/:id', auth_middleware_1.protect, chargingStation_controller_1.remove);
router.post('/seed', chargingStation_controller_1.seedSampleData);
exports.default = router;
//# sourceMappingURL=chargingStation.routes.js.map