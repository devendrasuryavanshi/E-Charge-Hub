import { Request, Response } from 'express';
import ChargingStation, { IChargingStation } from '../models/chargingStation.model';

export const create = async (req: Request, res: Response) => {
  try {
    const { name, latitude, longitude, status, powerOutput, connectorType } = req.body;
    if (!name || !latitude || !longitude || !status || !powerOutput || !connectorType) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    console.log("latitude", latitude)
    console.log("longitude", longitude)

    const chargingStation: IChargingStation = new ChargingStation({
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

    await chargingStation.save({
      validateBeforeSave: true
    });

    res.status(201).json({
      success: true,
      data: chargingStation
    });
  } catch (error: any) {
    console.log('Error in create charging station:', error);
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map((err: any) => err.message);
      return res.status(400).json({ success: false, message: errors });
    }
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const getAll = async (req: Request, res: Response) => {
  try {
    const status = req.query.status as string;
    const search = req.query.search as string;
    const powerOutput = parseFloat(req.query.powerOutput as string);
    const connectorType = req.query.connectorType as string;
    const latitude = parseFloat(req.query.latitude as string);
    const longitude = parseFloat(req.query.longitude as string);
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
    const skip = (page - 1) * limit;

    // console.log("powerOutput:", powerOutput);

    const matchConditions: any = {};
    const andConditions: any[] = [];

    // name
    if (search && search.trim()) {
      andConditions.push({
        name: { $regex: search.trim(), $options: 'i' }
      });
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

    const [aggregateResult, totalCount] = await Promise.all([
      ChargingStation.aggregate([
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
            createdAt: 1,
            updatedAt: 1
          }
        }
      ]),
      ChargingStation.countDocuments(matchConditions)
    ]);

    const chargingStations = aggregateResult.map((station: any) => ({
      id: station._id,
      name: station.name,
      coordinates: {
        latitude: station.coordinates?.latitude || null,
        longitude: station.coordinates?.longitude || null
      },
      status: station.status,
      powerOutput: station.powerOutput,
      connectorType: station.connectorType,
      createdAt: station.createdAt,
      updatedAt: station.updatedAt
    }));

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

  } catch (error: any) {
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

    if (error.message?.includes('$near')) {
      return res.status(400).json({
        success: false,
        message: 'Invalid location coordinates provided',
        error: 'INVALID_COORDINATES'
      });
    }

    res.status(500).json({
      success: false,
      message: 'An unexpected error occurred while fetching charging stations',
      error: 'INTERNAL_SERVER_ERROR',
      ...(process.env.NODE_ENV === 'development' && { details: error.message })
    });
  }
};

export const getById = async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    const chargingStation = await ChargingStation.findById(id);
    if (!chargingStation) {
      return res.status(404).json({ success: false, message: 'Charging station not found' });
    }

    res.status(200).json({
      success: true,
      data: chargingStation
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
}

export const update = async (req: Request, res: Response) => {
  try {
    const { name, location: { latitude, longitude }, status, powerOutput, connectorType } = req.body;
    const id = req.params.id;
    if (!name || !latitude || !longitude || !status || !powerOutput || !connectorType) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    let chargingStation = await ChargingStation.findById(id);
    if (!chargingStation) {
      return res.status(404).json({ success: false, message: 'Charging station not found' });
    }

    if (chargingStation.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'You are not authorized to update this charging station' });
    }

    const updatedChargingStation = await ChargingStation.findByIdAndUpdate(
      id,
      {
        name,
        coordinates: {
          latitude,
          longitude
        },
        status,
        powerOutput,
        connectorType
      },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      data: updatedChargingStation
    });
  } catch (error: any) {
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map((err: any) => err.message);
      return res.status(400).json({ success: false, message: errors });
    }
    res.status(500).json({ success: false, message: 'Server error' });
  }
}

export const remove = async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    const chargingStation = await ChargingStation.findById(id);
    if (!chargingStation) {
      return res.status(404).json({ success: false, message: 'Charging station not found' });
    }

    if (chargingStation.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'You are not authorized to delete this charging station' });
    }

    await ChargingStation.findByIdAndDelete(id);
    res.status(200).json({
      success: true,
      message: 'Charging station deleted successfully'
    });
  } catch (error: any) {
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map((err: any) => err.message);
      return res.status(400).json({ success: false, message: errors });
    }
    res.status(500).json({ success: false, message: 'Server error' });
  }
}


// sample data
export const seedSampleData = async (req: Request, res: Response) => {
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

    await ChargingStation.insertMany(sampleStations);

    res.status(201).json({
      success: true,
      message: 'Sample data created successfully',
      data: { count: sampleStations.length }
    });
  } catch (error: any) {
    console.error('Error seeding data:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to seed sample data'
    });
  }
};
