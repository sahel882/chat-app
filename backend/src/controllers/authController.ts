import type { NextFunction, Request, Response } from "express";
import type { AuthRequest } from "../middleware/auth";
import { clerkClient, getAuth } from "@clerk/express";
import { getUserById, upsertUser } from "../db/queries";

export async function getMe(req: AuthRequest, res: Response, next: NextFunction) {
    try {
        const userId = req.userId;
        const user = await getUserById(userId!);
        if (!user) {
            res.status(404).json({ message: "User not found" });
            return;
        }
        res.status(200).json(user);
    } catch (error) {
        res.status(500);
        next(error);
    }
}

export async function authCallback(req: Request, res: Response, next: NextFunction) {
    try {
        const { userId: clerkId } = getAuth(req);
        if (!clerkId) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }

        const clerkUser = await clerkClient.users.getUser(clerkId);

        const user = await upsertUser({
            id: clerkId,
            name: clerkUser.firstName
                ? `${clerkUser.firstName} ${clerkUser.lastName || ""}`.trim()
                : clerkUser.emailAddresses[0]?.emailAddress?.split("@")[0] ?? "Unknown",
            email: clerkUser.emailAddresses[0]?.emailAddress ?? "",
            avatar: clerkUser.imageUrl,
        });

        res.json(user);
    } catch (error) {
        res.status(500);
        next(error);
    }
}