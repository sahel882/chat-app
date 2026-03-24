import type { NextFunction, Response } from "express";
import type { AuthRequest } from "../middleware/auth";
import { getAllUsersExcept } from "../db/queries";

export async function getUser(req: AuthRequest, res: Response, next: NextFunction) {
    try {
        const userId = req.userId!;

        const users = await getAllUsersExcept(userId);

        res.json(users);
    } catch (error) {
        res.status(500);
        next(error);
    }
};