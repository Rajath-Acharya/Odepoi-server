import { Request, Response, NextFunction } from "express";
import {
  connectToDatabase,
  JourneyModel,
  JoinRequestModel,
  RoutePointModel,
  ActivityModel,
  StayModel,
} from "../lib/db";
import { z } from "zod";

export async function listJourneys(
  _req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const journeysLean = await JourneyModel.find()
      .sort({ createdAt: -1 })
      .populate("creatorId")
      .populate("currentTravelers")
      .lean();

    const journeys = await Promise.all(
      journeysLean.map(async (j) => {
        const [route, activities, stays] = await Promise.all([
          RoutePointModel.find({ journeyId: j._id }).lean(),
          ActivityModel.find({ journeyId: j._id }).lean(),
          StayModel.find({ journeyId: j._id }).lean(),
        ]);
        return { ...j, route, activities, stays };
      })
    );
    res.json(journeys);
  } catch (error) {
    next(error);
  }
}

export async function getJourneyById(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { id } = req.params;
    const base = await JourneyModel.findById(id)
      .populate("creatorId")
      .populate("currentTravelers")
      .lean();
    if (!base) return res.status(404).json({ error: "Journey not found" });
    const [route, activities, stays] = await Promise.all([
      RoutePointModel.find({ journeyId: base._id }).lean(),
      ActivityModel.find({ journeyId: base._id }).lean(),
      StayModel.find({ journeyId: base._id }).lean(),
    ]);
    res.json({ ...base, route, activities, stays });
  } catch (error) {
    next(error);
  }
}

const createJourneySchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  coverImage: z.string().url().optional().default(""),
  creatorId: z.string().min(1),
  startDate: z.string().min(1),
  endDate: z.string().min(1),
  tripType: z.enum([
    "Road Trip",
    "Hiking",
    "Beach",
    "City Break",
    "Adventure",
    "Cultural",
  ]),
  maxTravelers: z.number().int().positive(),
  isPublic: z.boolean().default(true),
});

export async function createJourney(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const input = createJourneySchema.parse(req.body);

    const journeyDoc = await JourneyModel.create({
      title: input.title,
      description: input.description,
      coverImage: input.coverImage,
      creatorId: input.creatorId,
      startDate: input.startDate,
      endDate: input.endDate,
      tripType: input.tripType,
      maxTravelers: input.maxTravelers,
      isPublic: input.isPublic,
      status: "planning",
    });

    const journey = await JourneyModel.findById(journeyDoc._id)
      .populate("creatorId")
      .lean();

    // const journey = await JourneyModel.findById(journeyDoc._id)
    //   .populate("creatorId")
    //   .populate("currentTravelers")
    //   .lean();

    res.status(201).json(journey);
  } catch (error) {
    next(error);
  }
}

const joinRequestSchema = z.object({
  userId: z.string().min(1),
  message: z.string().min(1),
});

export async function createJoinRequest(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { id } = req.params;
    const input = joinRequestSchema.parse(req.body);

    const journey = await JourneyModel.findById(id).lean();
    if (!journey) return res.status(404).json({ error: "Journey not found" });

    const joinRequest = await JoinRequestModel.create({
      journeyId: id,
      userId: input.userId,
      message: input.message,
      status: "pending",
    });

    res.status(201).json(joinRequest);
  } catch (error) {
    next(error);
  }
}
