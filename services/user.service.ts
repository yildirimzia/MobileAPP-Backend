import { Response } from "express";
import userModel from "../models/user.model";
import { redis } from "../utils/redis";


export const getUserById = async (id: string) => {
    const userJson = await redis.get(id);

    if (!userJson) {
        const user = await userModel.findById(id);
        await redis.set(id, JSON.stringify(user));
        return user;
    }

    return JSON.parse(userJson);
}

export const getAllUsersService = async () => {
    const users = await userModel.find().sort({ createdAt: -1 });

    return users;
}

export const updateUserRoleService = async (id: string, role: string, res: Response) => {
    const user = await userModel.findByIdAndUpdate(
        id,
        { role },
        { new: true }
    );

    res.status(201).json({
        success: true,
        message: 'Kullanıcı rolü başarıyla güncellendi',
        user
    });
}

export const deleteUserService = async ({ id }: { id: string }) => {
    return await userModel.findByIdAndDelete(id);
}