import jwt from "jsonwebtoken";

export const generateTokens = (user) => {
    return {
        accessToken: jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRE
        }),
        refreshToken: jwt.sign({ id: user._id }, process.env.JWT_REFRESH_SECRET, {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRE
        })
    };
};