import { Request, Response, NextFunction } from 'express';
import { CatcAsyncError } from '../middleware/catcAsyncError';
import ErrorHandler from '../utils/ErrorHandlers';
import jwt, { JwtPayload } from 'jsonwebtoken';
import userModel, { IUser } from '../models/user.model';
import { sendMail } from '../utils/sendMail';
import { accessTokenOptions, refreshTokenOptions, signAccessToken } from '../utils/jwt';
import { redis } from '../utils/redis';
import { deleteUserService, getAllUsersService, getUserById, updateUserRoleService } from '../services/user.service';
import cloudinary from 'cloudinary';
import activationModel, { IActivation } from '../models/activation.model';
import { IRegistrationBody } from '../models/user.model';

interface IResetPasswordRequest {
	token: string;
	newPassword: string;
}
enum Gender {
	male = 'male',
	female = 'female',
	not_specified = 'not_specified',
}
//registration start
export const registrationUser = CatcAsyncError(async (req: Request<{}, {}, IRegistrationBody>, res: Response, next: NextFunction) => {
	try {
		// Önce süresi dolmuş kayıtları temizle
		await activationModel.deleteMany({
			expiresAt: { $lt: new Date() }
		});

		const { name, email, password, gender } = req.body as IRegistrationBody;

		// Önce aktif kullanıcı var mı kontrol et
		const existingUser = await userModel.findOne({
			email,
			isVerified: true
		});

		if (existingUser) {
			return next(new ErrorHandler('Bu e-posta adresi zaten kullanılıyor', 400));
		}

		// Süresi dolmuş eski aktivasyon kayıtlarını temizle
		await activationModel.deleteMany({
			email,
			expiresAt: { $lt: new Date() }
		});

		// Aktif doğrulama kodu var mı kontrol et
		const activeCode = await activationModel.findOne<IActivation>({
			email,
			expiresAt: { $gt: new Date() }
		}).lean();

		if (activeCode) {
			// Son gönderimden bu yana 2 dakika geçmediyse engelle
			const timeSinceLastResend = Date.now() - activeCode.lastResendAt.getTime();
			const remainingTime = Math.ceil((120000 - timeSinceLastResend) / 1000);

			if (timeSinceLastResend < 120000) { // 2 dakika
				return res.status(400).json({
					success: false,
					message: 'Bu email için aktif bir doğrulama kodu bulunmaktadır.',
					activationToken: activeCode.activationToken,
					gender: activeCode.gender,
					remainingTime: remainingTime > 0 ? remainingTime : 0
				});
			}

			return res.status(400).json({
				success: false,
				message: 'Bu e-posta adresi için aktif bir doğrulama kodu bulunmaktadır. Lütfen mailinizi kontrol edin.',
				activationToken: activeCode.activationToken,
				gender: activeCode.gender
			});
		}

		// Yeni aktivasyon kodu oluştur
		const user: IRegistrationBody = {
			name,
			email,
			password,
			gender: Gender[gender]
		}

		const activationToken = createActivationToken(user);
		const activationCode = activationToken.activationCode;

		// Aktivasyon bilgilerini kaydet
		await activationModel.create({
			email: user.email,
			activationToken: activationToken.token,
			activationCode: activationCode,
			expiresAt: new Date(Date.now() + 120000),
			lastResendAt: new Date(),
			gender: user.gender
		});

		// Mail gönder
		await sendMail({
			email: user.email,
			subject: 'Hesabınızı Aktifleştirmek İçin Aktivasyon Kodunu Kullanın',
			template: 'activation-mail.ejs',
			data: {
				user: { name: user.name },
				activationCode
			}
		});

		res.status(201).json({
			success: true,
			message: `Hesabınızı etkinleştirmek için lütfen e-postanızı kontrol edin`,
			activationToken: activationToken.token
		});

	} catch (error: any) {
		return next(new ErrorHandler(error.message, 400));
	}
})

interface IActivationToken {
	token: string;
	activationCode: string;
}

const createActivationToken = (user: IRegistrationBody): IActivationToken => {
	const activationCode = Math.floor(1000 + Math.random() * 9000).toString();

	const payload = { user, activationCode };

	const token = jwt.sign(
		payload,
		process.env.ACTIVATION_SECRET as string,
		{ expiresIn: "120s" }
	);

	return { token, activationCode };
};
// End of registration

// Activation User start

interface IActivationRequest {
	activation_token: string;
	activation_code: string;
}

export const activationUser = CatcAsyncError(async (req: Request, res: Response, next: NextFunction) => {
	try {
		const { activation_token, activation_code } = req.body;

		// Önce kullanıcının zaten aktif olup olmadığını kontrol et
		const decoded = jwt.verify(
			activation_token,
			process.env.ACTIVATION_SECRET as string
		) as { user: IRegistrationBody, activationCode: string };

		const existingUser = await userModel.findOne({
			email: decoded.user.email,
			isVerified: true
		});

		if (existingUser) {
			return res.status(200).json({
				success: true,
				message: 'Kullanıcı zaten aktif',
				isAlreadyActive: true,
				user: existingUser
			});
		}

		// Aktivasyon kaydını bul
		const activation = await activationModel.findOne({
			activationToken: activation_token,
			activationCode: activation_code,
			expiresAt: { $gt: new Date() }
		});

		if (!activation) {
			return next(new ErrorHandler('Geçersiz veya süresi dolmuş aktivasyon kodu', 400));
		}

		// Kullanıcıyı oluştur
		const user = await userModel.create({
			name: decoded.user.name,
			email: decoded.user.email,
			password: decoded.user.password,
			gender: decoded.user.gender || 'not_specified',
			isVerified: true,
			role: 'user'
		});

		// Aktivasyon kaydını sil
		await activation.deleteOne();

		// Token oluştur ve response'a ekle
		const { accessToken } = signAccessToken(user, 200, res);

		res.status(201).json({
			success: true,
			message: 'Kullanıcı başarıyla oluşturuldu',
			user,
			accessToken
		});

	} catch (error: any) {
		return next(new ErrorHandler(error.message, 400));
	}
});

// End of Activation User


// Login User start

interface ILoginRequest {
	email: string;
	password: string;
}

export const loginUser = CatcAsyncError(async (req: Request, res: Response, next: NextFunction) => {
	try {
		const { email, password } = req.body as ILoginRequest;
		if (!email || !password) {
			return next(new ErrorHandler('Lütfen e-posta adresinizi ve şifrenizi giriniz', 400));
		}

		const user = await userModel.findOne({ email }).select('+password');

		if (!user) {
			return next(new ErrorHandler('Geçersiz e-posta adresi veya şifre', 400));
		}

		const isPasswordMatch = await user.comparePassword(password);

		if (!isPasswordMatch) {
			return next(new ErrorHandler('Geçersiz e-posta adresi veya şifre', 400));
		}

		const { accessToken, refreshToken } = signAccessToken(user, 200, res);

		// Response'u burada gönder
		res.status(200).json({
			success: true,
			user,
			accessToken
		});

	} catch (error: any) {
		return next(new ErrorHandler(error.message, 400));
	}
});

// End of Login User   

// Logout User start

export const logoutUser = CatcAsyncError(async (req: Request, res: Response, next: NextFunction) => {
	try {
		// Login ile aynı cookie ayarlarını kullan
		const cookieOptions = {
			httpOnly: true,
			secure: false,
			sameSite: 'lax' as const,
			path: '/'
		};

		res.cookie('access_token', '', {
			...cookieOptions,
			maxAge: 0,
			expires: new Date(0)
		});

		res.cookie('refresh_token', '', {
			...cookieOptions,
			maxAge: 0,
			expires: new Date(0)
		});

		// Redis'teki kullanıcıyı sil
		if (req.user?._id) {
			await redis.del(req.user._id);
		}

		res.status(200).json({
			success: true,
			message: 'Başarıyla çıkış yapıldı'
		});
	} catch (error: any) {
		return next(new ErrorHandler(error.message, 400));
	}
});


// End of Logout User	


// Upadate User Token 

export const updateUserToken = CatcAsyncError(async (req: Request, res: Response, next: NextFunction) => {
	try {
		const refresh_token = req.cookies.refresh_token as string;

		const decoded = jwt.verify(
			refresh_token,
			process.env.REFRESH_TOKEN as string
		) as JwtPayload;

		if (!decoded) {
			return next(new ErrorHandler('Token Yenileme Hatası', 400));
		}

		const session = await redis.get(decoded.id);

		if (!session) {
			return next(new ErrorHandler('Kullanıcı bulunamadı', 400));
		}

		const user = JSON.parse(session);

		const accessToken = jwt.sign(
			{ id: user._id },
			process.env.ACCESS_TOKEN as string,
			{ expiresIn: '5m' }
		);

		const refreshToken = jwt.sign(
			{ id: user._id },
			process.env.REFRESH_TOKEN as string,
			{ expiresIn: '3d' }
		);

		req.user = user;


		res.cookie('access_token', accessToken, accessTokenOptions);
		res.cookie('refresh_token', refreshToken, refreshTokenOptions);

		await redis.set(user._id, JSON.stringify(user), 'EX', 3 * 24 * 60 * 60);

		res.status(200).json({
			success: true,
			accessToken
		});
	}
	catch (error: any) {
		return next(new ErrorHandler(error.message, 400));
	}
})

// End of Update User Token

// Get User Info

export const getUserInfo = CatcAsyncError(async (req: Request, res: Response, next: NextFunction) => {
	try {
		const userId = req.user._id;
		const user = await getUserById(userId);

		res.status(200).json({
			success: true,
			message: 'Kullanıcı bilgileri başarıyla alındı',
			user
		});
	}
	catch (error: any) {
		return next(new ErrorHandler(error.message, 400));
	}
})

// End of Get User Info


// Social Login

interface ISocialAuthRequest {
	name: string;
	email: string;
	avatar: string;
}

export const socialAuth = CatcAsyncError(async (req: Request, res: Response, next: NextFunction) => {
	try {
		const { name, email, avatar } = req.body as ISocialAuthRequest;

		const user = await userModel.findOne({ email });

		if (!user) {
			const newUser = await userModel.create({
				name,
				email,
				avatar
			});

			signAccessToken(newUser, 200, res);
		}
		else {
			signAccessToken(user, 200, res);
		}

	}
	catch (error: any) {
		return next(new ErrorHandler(error.message, 400));
	}
})

// End of Social Login

// Update User Info

interface IUpdateUserRequest {
	name: string;
	email: string;
}

export const updateUserInfo = CatcAsyncError(async (req: Request, res: Response, next: NextFunction) => {
	try {
		const { name, email } = req.body as IUpdateUserRequest;

		const userId = req?.user?._id;
		const user = await userModel.findById(userId);

		if (email && user) {
			const isEmailExist = await userModel.findOne({ email });
			if (isEmailExist) {
				return next(new ErrorHandler('Bu e-posta adresi zaten kullanılıyor. Lütfen farklı bir e-posta adresi deneyin veya hesabınıza giriş yapmayı deneyin', 400));
			}
			user.email = email;
		}

		if (name && user) {
			user.name = name;
		}

		await user?.save();

		await redis.set(userId, JSON.stringify(user));

		res.status(200).json({
			success: true,
			message: 'Kullanıcı bilgileri başarıyla güncellendi',
			user
		});
	}
	catch (error: any) {
		return next(new ErrorHandler(error.message, 400));
	}
})

// End of Update User Info


// Update User Password

interface IUpdateUserPasswordRequest {
	oldPassword: string;
	newPassword: string;
}

export const updateUserPassword = CatcAsyncError(async (req: Request, res: Response, next: NextFunction) => {
	try {
		const { oldPassword, newPassword } = req.body as IUpdateUserPasswordRequest;

		if (!oldPassword || !newPassword) {
			return next(new ErrorHandler('Lütfen eski ve yeni şifrenizi giriniz', 400));
		}

		const user = await userModel.findById(req?.user?._id).select('+password');

		console.log(user, 'usersdasd');

		if (user?.password === undefined) {
			return next(new ErrorHandler('Kullanıcı bulunamadı', 400));
		}

		const isPasswordMatch = await user?.comparePassword(oldPassword);

		if (!isPasswordMatch) {
			return next(new ErrorHandler('Geçersiz eski şifre ', 400));
		}

		user.password = newPassword;
		await user.save();

		await redis.set(req?.user?._id, JSON.stringify(user));

		res.status(200).json({
			success: true,
			message: 'Şifre başarıyla güncellendi'
		});
	}
	catch (error: any) {
		return next(new ErrorHandler(error.message, 400));
	}
})

// End of Update User Password

// Update User Avatar

interface IUpdateUserAvatarRequest {
	avatar: string;
}

export const updateUserAvatar = CatcAsyncError(async (req: Request, res: Response, next: NextFunction) => {
	try {
		const { avatar } = req.body as IUpdateUserAvatarRequest;

		const userId = req?.user?._id;

		const user = await userModel.findById(userId);

		if (user?.avatar?.public_id) {
			await cloudinary.v2.uploader.destroy(user.avatar.public_id);

			const myCloud = await cloudinary.v2.uploader.upload(avatar, {
				folder: 'avatars',
				width: 150,
				height: 150,
				crop: "fill",
				gravity: "face",
				quality: 70
			});

			if (user) {
				user.avatar = {
					public_id: myCloud.public_id,
					url: myCloud.secure_url
				}
			}

		} else {
			const myCloud = await cloudinary.v2.uploader.upload(avatar, {
				folder: 'avatars',
				width: 150,
				height: 150,
				crop: "fill",
				gravity: "face",
				quality: 70
			});

			if (user) {
				user.avatar = {
					public_id: myCloud.public_id,
					url: myCloud.secure_url
				}
			}
		}

		await user?.save();

		await redis.set(userId, JSON.stringify(user));

		res.status(200).json({
			success: true,
			message: 'Avatar başarıyla güncellendi',
			user
		});
	}
	catch (error: any) {
		return next(new ErrorHandler(error.message, 400));
	}
})

// End of Update User Avatar


// Get All Users

export const getAllUsers = CatcAsyncError(async (req: Request, res: Response, next: NextFunction) => {
	try {
		const users = await getAllUsersService();

		res.status(200).json({
			success: true,
			message: 'Kullanıcılar başarıyla alındı',
			users
		});
	}
	catch (error: any) {
		return next(new ErrorHandler(error.message, 400));
	}
})

// End of Get All Users

// Update User Role

export const updateUserRole = CatcAsyncError(async (req: Request, res: Response, next: NextFunction) => {
	try {
		const { id, role } = req.body;

		await updateUserRoleService(id, role, res);
	}
	catch (error: any) {
		return next(new ErrorHandler(error.message, 400));
	}
})

// End of Update User Role


// Delete User

export const deleteUser = CatcAsyncError(async (req: Request, res: Response, next: NextFunction) => {
	try {
		const { id } = req.params;
		const user = await userModel.findById(id);

		if (!user) {
			return next(new ErrorHandler('Kullanıcı bulunamadı', 400));
		}

		await deleteUserService({ id });
		await redis.del(id);

		res.status(200).json({
			success: true,
			message: 'Kullanıcı başarıyla silindi'
		});
	}
	catch (error: any) {
		return next(new ErrorHandler(error.message, 400));
	}
})

// End of Delete User

// Şifre Sıfırlama Talebi
export const requestPasswordReset = CatcAsyncError(async (req: Request, res: Response, next: NextFunction) => {
	const { email } = req.body;

	const user = await userModel.findOne({ email });

	if (!user) {
		return next(new ErrorHandler('Bu e-posta adresi ile kayıtlı bir kullanıcı bulunamadı', 404));
	}

	// Şifre sıfırlama token'ı oluştur
	const resetToken = createResetToken(user);

	// Token'ı kullanıcıya kaydet
	user.resetPasswordToken = resetToken;
	await user.save();

	try {
		await sendMail({
			email: user.email,
			subject: 'Şifre Sıfırlama Talebi',
			template: 'reset-password-mail.ejs',
			data: {
				resetToken,
				userId: user._id
			}
		});

		res.status(200).json({
			success: true,
			message: 'Şifre sıfırlama bağlantısı e-posta adresinize gönderildi.'
		});
	} catch (error: any) {
		// Hata durumunda token'ı temizle
		user.resetPasswordToken = null;
		await user.save();
		return next(new ErrorHandler(error.message, 400));
	}
});

// Şifre sıfırlama işlemi tamamlandığında cookie'yi sil
export const completePasswordReset = CatcAsyncError(async (req: Request, res: Response, next: NextFunction) => {
	// Şifre sıfırlama işlemi tamamlandığında
	res.clearCookie('reset_token'); // Cookie'yi sil
	res.status(200).json({
		success: true,
		message: 'Şifre sıfırlama işlemi tamamlandı.'
	});
});

// Şifre sıfırlama token'ı oluşturma
const createResetToken = (user: IUser): string => {
	const resetToken = jwt.sign({ id: user._id }, process.env.RESET_TOKEN_SECRET as string, { expiresIn: '1h' });
	return resetToken;
};

// Token'ı doğrulama
export const verifyResetToken = CatcAsyncError(async (req: Request, res: Response, next: NextFunction) => {
	const { token } = req.params; // Token'ı URL parametresi olarak al

	try {
		const decoded = jwt.verify(
			token,
			process.env.RESET_TOKEN_SECRET as string
		) as JwtPayload; // Token'ı doğrula
		res.status(200).json({
			success: true,
			message: 'Token geçerli',
			userId: decoded.id // Kullanıcı ID'sini döndür
		});
	} catch (error) {
		return next(new ErrorHandler('Geçersiz veya süresi dolmuş token', 401));
	}
});

export const resetPassword = CatcAsyncError(async (req: Request, res: Response, next: NextFunction) => {
	try {
		const { token, newPassword } = req.body as IResetPasswordRequest;

		// Token'ı doğrula
		const decoded = jwt.verify(
			token,
			process.env.RESET_TOKEN_SECRET as string
		) as JwtPayload;

		// User'ı password field'ı ile birlikte getir
		const user = await userModel.findById(decoded.id).select('+password');

		if (!user) {
			return res.status(400).json({
				success: false,
				message: 'Geçersiz veya süresi dolmuş token'
			});
		}

		// Token kullanılmış mı veya geçerli mi kontrol et
		if (!user.resetPasswordToken || user.resetPasswordToken !== token) {
			return res.status(400).json({
				success: false,
				message: 'Bu şifre sıfırlama bağlantısı daha önce kullanılmış veya geçersiz'
			});
		}

		// Şifreyi güncelle
		user.password = newPassword;

		// Token'ı geçersiz kıl
		user.resetPasswordToken = null;
		await user.save();

		return res.json({
			success: true,
			message: 'Şifreniz başarıyla güncellendi'
		});
	} catch (error) {
		return res.status(400).json({
			success: false,
			message: 'Geçersiz veya süresi dolmuş token'
		});
	}
});

export const googleLogin = CatcAsyncError(async (req: Request, res: Response, next: NextFunction) => {
	try {
		const { email, name, picture, platform } = req.body;

		if (!email || !name || !platform) {
			return next(new ErrorHandler("Missing required fields", 400));
		}

		// Kullanıcıyı veritabanında ara veya oluştur
		let user = await userModel.findOne({ email });

		if (!user) {
			user = await userModel.create({
				name,
				email,
				avatar: {
					url: picture
				},
				isVerified: true
			});
		}

		// Token oluştur
		const { accessToken } = signAccessToken(user, 200, res);

		// Response'u normal login ile aynı formatta gönder
		res.status(200).json({
			success: true,
			user,
			accessToken
		});

	} catch (error: any) {
		console.error('Google login error:', error);
		return next(new ErrorHandler(error.message, 400));
	}
});
