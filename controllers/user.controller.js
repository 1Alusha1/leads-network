import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import userModel from '../models/user.model.js';
dotenv.config();

const generateAccessToken = (id, login) => {
  const payload = {
    id,
    login,
  };
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '24h' });
};

export const register = async (req, res) => {
  const { password, login } = req.body;
  try {
    const candidate = await userModel.findOne({ login });

    if (candidate) {
      return res
        .status(400)
        .json({ message: 'Пользователь уже зарегестрирован', type: 'error' });
    }

    if (password.length < 8) {
      return res.status(400).json({
        message: 'Пароль должен содержать минимум 8 символов',
        type: 'error',
      });
    }

    const hash = await bcrypt.hash(password, 3);

    await new userModel({
      login,
      password: hash,
    }).save();

    return res
      .status(200)
      .json({ message: 'Вы успешно зарегестрировались', type: 'success' });
  } catch (error) {
    if (error) console.log(error);

    return res.status(500).json({
      message: 'Ошибка во время регистрации',
      error: error.message,
      type: 'error',
    });
  }
};

export const login = async (req, res) => {
  const { password, login } = req.body;
  try {
    const user = await userModel.findOne({ login });

    if (!user) {
      return res
        .status(400)
        .json({ message: 'Пользователя не существует', type: 'error' });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      return res
        .status(400)
        .json({ message: 'Не верный пароль', type: 'error' });
    }

    const token = generateAccessToken(user._id, user.login);

    await user.updateOne({ authToken: token }, { new: true });

    return res.json({
      message: 'Вы успешно авторизировались',
      token,
      userId: user._id,
      type: 'success',
    });
  } catch (error) {
    if (error) console.log(error);

    return res.status(500).json({
      message: 'Ошибка во время авторизации',
      error: error.message,
      type: 'error',
    });
  }
};

export const checkAuth = async (req, res) => {
  try {
    const token = req.headers.authorization.split(' ')[1];

    if (!token) {
      return res
        .status(404)
        .json({ message: 'Токен не найден', type: 'error' });
    }
    const decodeData = jwt.verify(token, process.env.JWT_SECRET);

    const user = await userModel.findOne({ _id: decodeData.id });

    if (user) {
      if (user.authToken === token) {
        return res.status(200).json({ isAuth: true, id: decodeData.id });
      } else {
        return res.status(200).json({ isAuth: false });
      }
    } else {
      return res.status(200).json({ isAuth: false });
    }
  } catch (e) {
    res.json({ auth: false });
  }
};
