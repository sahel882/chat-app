import type { Request, Response, NextFunction } from "express";
import { getAuth, requireAuth } from "@clerk/express";
import { getUserById } from "../db/queries";

export type AuthRequest = Request & {
    userId?: string;
};

export const protectRoute = [
    requireAuth(),
    async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            const { userId: clerkId } = getAuth(req);

            const user = await getUserById(clerkId!);
            if (!user) return res.status(404).json({ message: "User not found" });

            req.userId = user.id;

            next();
        } catch (error) {
            res.status(500);
            next(error);
        }
    }
]