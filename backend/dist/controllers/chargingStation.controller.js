"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedSampleData = exports.remove = exports.update = exports.getById = exports.getAll = exports.create = void 0;
const chargingStation_model_1 = __importDefault(require("../models/chargingStation.model"));
const mongoose_1 = __importDefault(require("mongoose"));
const create = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { name, latitude, longitude, status, powerOutput, connectorType } = req.body;
        if (!name || !latitude || !longitude || !status || !powerOutput || !connectorType) {
            return res.status(400).json({ success: false, message: 'All fields are required' });
        }
        console.log("latitude", latitude);
        console.log("longitude", longitude);
        const chargingStation = new chargingStation_model_1.default({
            name,
            coordinates: {
                latitude,
                longitude
            },
            status,
            powerOutput,
            connectorType,
            createdBy: req.user.id
        });
        yield chargingStation.save({
            validateBeforeSave: true
        });
        res.status(201).json({
            success: true,
            data: chargingStation
        });
    }
    catch (error) {
        console.log('Error in create charging station:', error);
        if (error.name === 'ValidationError') {
            const errors = Object.values(error.errors).map((err) => err.message);
            return res.status(400).json({ success: false, message: errors });
        }
        res.status(500).json({ success: false, message: 'Server error' });
    }
});
exports.create = create;
const getAll = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const status = req.query.status;
        const search = req.query.search;
        const powerOutput = parseFloat(req.query.powerOutput);
        const connectorType = req.query.connectorType;
        const latitude = parseFloat(req.query.latitude);
        const isGetByUserId = req.query.getByUserId;
        const longitude = parseFloat(req.query.longitude);
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
        const skip = (page - 1) * limit;
        // console.log("powerOutput:", powerOutput);
        const matchConditions = {};
        const andConditions = [];
        // name
        if (search && search.trim()) {
            andConditions.push({
                name: { $regex: search.trim(), $options: 'i' }
            });
        }
        if (isGetByUserId === 'true') {
            andConditions.push({ createdBy: new mongoose_1.default.Types.ObjectId(req.user.id) });
        }
        // location-based
        if (!isNaN(latitude) && !isNaN(longitude)) {
            const latRange = 0.05; // 5km radius
            const lngRange = 0.05;
            andConditions.push({
                'coordinates.latitude': {
                    $gte: latitude - latRange,
                    $lte: latitude + latRange
                },
                'coordinates.longitude': {
                    $gte: longitude - lngRange,
                    $lte: longitude + lngRange
                }
            });
        }
        // status
        if (status && status.trim()) {
            andConditions.push({ status: status.trim() });
        }
        // Power output
        if (powerOutput && !isNaN(powerOutput)) {
            andConditions.push({ powerOutput: powerOutput });
        }
        // Connector type
        if (connectorType && connectorType.trim()) {
            andConditions.push({ connectorType: connectorType.trim() });
        }
        if (andConditions.length > 0) {
            matchConditions.$and = andConditions;
        }
        const [aggregateResult, totalCount] = yield Promise.all([
            chargingStation_model_1.default.aggregate([
                { $match: matchConditions },
                { $skip: skip },
                { $limit: limit },
                {
                    $project: {
                        _id: 1,
                        name: 1,
                        coordinates: 1,
                        status: 1,
                        powerOutput: 1,
                        connectorType: 1,
                        createdBy: 1,
                        createdAt: 1,
                        updatedAt: 1
                    }
                }
            ]),
            chargingStation_model_1.default.countDocuments(matchConditions)
        ]);
        const chargingStations = aggregateResult.map((station) => {
            var _a, _b;
            return ({
                id: station._id,
                name: station.name,
                coordinates: {
                    latitude: ((_a = station.coordinates) === null || _a === void 0 ? void 0 : _a.latitude) || null,
                    longitude: ((_b = station.coordinates) === null || _b === void 0 ? void 0 : _b.longitude) || null
                },
                status: station.status,
                powerOutput: station.powerOutput,
                connectorType: station.connectorType,
                createdBy: station.createdBy,
                createdAt: station.createdAt,
                updatedAt: station.updatedAt
            });
        });
        const totalPages = Math.ceil(totalCount / limit);
        res.status(200).json({
            success: true,
            data: {
                chargingStations,
                pagination: {
                    currentPage: page,
                    totalPages,
                    totalCount,
                    limit,
                    hasNextPage: page < totalPages,
                    hasPrevPage: page > 1
                }
            },
            message: `Found ${chargingStations.length} charging stations`
        });
    }
    catch (error) {
        console.error('Error in getAll charging stations:', error);
        if (error.name === 'CastError') {
            return res.status(400).json({
                success: false,
                message: 'Invalid query parameters provided',
                error: 'INVALID_PARAMETERS'
            });
        }
        if (error.name === 'MongoNetworkError') {
            return res.status(503).json({
                success: false,
                message: 'Database connection error. Please try again later.',
                error: 'DATABASE_CONNECTION_ERROR'
            });
        }
        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message: 'Duplicate entry found',
                error: 'DUPLICATE_ENTRY'
            });
        }
        if ((_a = error.message) === null || _a === void 0 ? void 0 : _a.includes('$near')) {
            return res.status(400).json({
                success: false,
                message: 'Invalid location coordinates provided',
                error: 'INVALID_COORDINATES'
            });
        }
        res.status(500).json(Object.assign({ success: false, message: 'An unexpected error occurred while fetching charging stations', error: 'INTERNAL_SERVER_ERROR' }, (process.env.NODE_ENV === 'development' && { details: error.message })));
    }
});
exports.getAll = getAll;
const getById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const id = req.params.id;
        const chargingStation = yield chargingStation_model_1.default.findById(id);
        if (!chargingStation) {
            return res.status(404).json({ success: false, message: 'Charging station not found' });
        }
        res.status(200).json({
            success: true,
            data: chargingStation
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});
exports.getById = getById;
const update = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { name, latitude, longitude, status, powerOutput, connectorType } = req.body;
        const id = req.params.id;
        if (!name || !latitude || !longitude || !status || !powerOutput || !connectorType) {
            return res.status(400).json({ message: 'All fields are required' });
        }
        let chargingStation = yield chargingStation_model_1.default.findById(id);
        if (!chargingStation) {
            return res.status(404).json({ success: false, message: 'Charging station not found' });
        }
        if (chargingStation.createdBy.toString() !== req.user.id) {
            return res.status(403).json({ success: false, message: 'You are not authorized to update this charging station' });
        }
        const updatedChargingStation = yield chargingStation_model_1.default.findByIdAndUpdate(id, {
            name,
            coordinates: {
                latitude,
                longitude
            },
            status,
            powerOutput,
            connectorType
        }, { new: true, runValidators: true });
        res.status(200).json({
            success: true,
            data: updatedChargingStation
        });
    }
    catch (error) {
        if (error.name === 'ValidationError') {
            const errors = Object.values(error.errors).map((err) => err.message);
            return res.status(400).json({ success: false, message: errors });
        }
        res.status(500).json({ success: false, message: 'Server error' });
        console.error('Error in update charging station:', error);
    }
});
exports.update = update;
const remove = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const id = req.params.id;
        const chargingStation = yield chargingStation_model_1.default.findById(id);
        if (!chargingStation) {
            return res.status(404).json({ success: false, message: 'Charging station not found' });
        }
        if (chargingStation.createdBy.toString() !== req.user.id) {
            return res.status(403).json({ success: false, message: 'You are not authorized to delete this charging station' });
        }
        yield chargingStation_model_1.default.findByIdAndDelete(id);
        res.status(200).json({
            success: true,
            message: 'Charging station deleted successfully'
        });
    }
    catch (error) {
        if (error.name === 'ValidationError') {
            const errors = Object.values(error.errors).map((err) => err.message);
            return res.status(400).json({ success: false, message: errors });
        }
        res.status(500).json({ success: false, message: 'Server error' });
    }
});
exports.remove = remove;
// sample data
const seedSampleData = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    req.user = { id: '6549a9282a301f2d1c1a7f01' };
    try {
        const sampleStations = [
            {
                name: "Downtown Charging Hub",
                coordinates: { latitude: 23.3149, longitude: 77.3981 },
                status: "Active",
                powerOutput: 150,
                connectorType: "CCS",
                createdBy: req.user.id
            },
            {
                name: "Mall Parking Station",
                coordinates: { latitude: 23.3200, longitude: 77.4020 },
                status: "Active",
                powerOutput: 100,
                connectorType: "Type2",
                createdBy: req.user.id
            },
            {
                name: "Highway Rest Stop",
                coordinates: { latitude: 23.3100, longitude: 77.3900 },
                status: "Maintenance",
                powerOutput: 250,
                connectorType: "CHAdeMO",
                createdBy: req.user.id
            },
            {
                name: "Office Complex Charger",
                coordinates: { latitude: 23.3180, longitude: 77.4050 },
                status: "Active",
                powerOutput: 50,
                connectorType: "Type1",
                createdBy: req.user.id
            },
            {
                name: "Airport Terminal Station",
                coordinates: { latitude: 23.3250, longitude: 77.4100 },
                status: "Inactive",
                powerOutput: 200,
                connectorType: "GB/T",
                createdBy: req.user.id
            }
        ];
        yield chargingStation_model_1.default.insertMany(sampleStations);
        res.status(201).json({
            success: true,
            message: 'Sample data created successfully',
            data: { count: sampleStations.length }
        });
    }
    catch (error) {
        console.error('Error seeding data:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to seed sample data'
        });
    }
});
exports.seedSampleData = seedSampleData;
//# sourceMappingURL=chargingStation.controller.js.map