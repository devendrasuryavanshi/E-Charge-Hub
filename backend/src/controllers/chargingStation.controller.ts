import { Request, Response } from 'express';
import ChargingStation, { IChargingStation } from '../models/chargingStation.model';

export const create = async (req: Request, res: Response) => {
  try {
    const { name, location: { latitude, longitude }, status, powerOutput, connectorType } = req.body;
    if (!name || !latitude || !longitude || !status || !powerOutput || !connectorType) {
      return res.status(400).json({ message: 'All fields are required' });
    }

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
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map((err: any) => err.message);
      return res.status(400).json({ message: errors });
    }
    res.status(500).json({ message: 'Server error' });
  }
};

export const getAll = async (req: Request, res: Response) => {
  try {
    const status = req.query.status as string;
    const search = req.query.search as string;
    const powerOutput = req.query.powerOutput as string;
    const connectorType = req.query.connectorType as string;
    const { latitude, longitude } = req.query.coordinates as { latitude: string, longitude: string };
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;
    const totalCount = await ChargingStation.countDocuments();
    const totalPages = Math.ceil(totalCount / limit);

    // aggregate pipeline
    const [aggregateResult, chargingStationCount] = await Promise.all([
      ChargingStation.aggregate([
        {
          $match: {
            $and: [
              {
                $or: [
                  {
                    name: { $regex: search, $options: 'i' }
                  },
                  {
                    location: {
                      $near: {
                        $geometry: {
                          type: 'Point',
                          coordinates: [latitude, longitude]
                        },
                        $maxDistance: 10000
                      }
                    }
                  }
                ]
              },
              {
                status
              },
              {
                powerOutput
              },
              {
                connectorType
              }
            ]
          }
        },
        {
          $skip: skip
        },
        {
          $limit: limit
        }
      ]),
      ChargingStation.countDocuments()
    ]);

    const chargingStations = aggregateResult.map((chargingStation: any) => {
      return {
        id: chargingStation._id,
        name: chargingStation.name,
        location: {
          latitude: chargingStation.location.coordinates[1],
          longitude: chargingStation.location.coordinates[0]
        },
        status: chargingStation.status,
        powerOutput: chargingStation.powerOutput,
        connectorType: chargingStation.connectorType
      }
    });

    res.status(200).json({
      success: true,
      data: {
        chargingStations,
        totalCount,
        totalPages
      }
    });

  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
}

export const getById = async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    const chargingStation = await ChargingStation.findById(id);
    if (!chargingStation) {
      return res.status(404).json({ message: 'Charging station not found' });
    }

    res.status(200).json({
      success: true,
      data: chargingStation
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
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
      return res.status(404).json({ message: 'Charging station not found' });
    }

    if (chargingStation.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ message: 'You are not authorized to update this charging station' });
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
      return res.status(400).json({ message: errors });
    }
    res.status(500).json({ message: 'Server error' });
  }
}

export const deleteChargingStation = async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    const chargingStation = await ChargingStation.findById(id);
    if (!chargingStation) {
      return res.status(404).json({ message: 'Charging station not found' });
    }

    if (chargingStation.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ message: 'You are not authorized to delete this charging station' });
    }

    await ChargingStation.findByIdAndDelete(id);
    res.status(200).json({
      success: true,
      message: 'Charging station deleted successfully'
    });
  } catch (error: any) {
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map((err: any) => err.message);
      return res.status(400).json({ message: errors });
    }
    res.status(500).json({ message: 'Server error' });
  }
}