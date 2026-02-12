import jwt from "jsonwebtoken";

export function signToken(payload: object) {
    if (!process.env.JWT_SECRET) {
        throw new Error("JWT_SECRET missing in .env");
    }

    return jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: "7d",
    });
}

export function verifyToken(token: string) {
    if (!process.env.JWT_SECRET) {
        throw new Error("JWT_SECRET missing in .env");
    }

    return jwt.verify(token, process.env.JWT_SECRET);
}
