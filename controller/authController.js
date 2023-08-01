const Joi = require("joi");
const User = require("../models/user");
const bcrypt = require("bcryptjs");
const UserDTO = require("../dto/user");
const JWTService = require("../services/JWTService");
const RefreshToken = require("../models/token");
const mongodbIdPattern = /^[0-9a-fA-F]{24}$/;
const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,25}$/;

const authController = {
  async register(req, res, next) {
    // 1. validate user input
    const userRegisterSchema = Joi.object({
      username: Joi.string().min(5).max(30).required(),
      name: Joi.string().max(30).required(),
      email: Joi.string().email().required(),
      password: Joi.string().pattern(passwordPattern).required(),
      confirmPassword: Joi.ref("password"),
      role: Joi.string().required(),
    });
    const { error } = userRegisterSchema.validate(req.body);

    // 2. if error in validation -> return error via middleware
    if (error) {
      return next(error);
    }

    // 3. if email or username is already registered -> return an error
    const { username, name, email, password, role } = req.body;

    try {
      const emailInUse = await User.exists({ email });

      const usernameInUse = await User.exists({ username });

      if (emailInUse) {
        const error = {
          status: 409,
          message: "Email already registered, use another email!",
        };

        return next(error);
      }

      if (usernameInUse) {
        const error = {
          status: 409,
          message: "Username not available, choose another username!",
        };

        return next(error);
      }
    } catch (error) {
      return next(error);
    }

    // 4. password hash
    const hashedPassword = await bcrypt.hash(password, 10);

    let user;

    try {
      const userToRegister = new User({
        username,
        email,
        name,
        password: hashedPassword,
        role,
      });

      user = await userToRegister.save();
      const userDto = new UserDTO(user);

      return res.status(200).json({ user: userDto })

    } catch (error) {
      return next(error);
    }
  },

  // user's info update:
  async updateuser(req, res, next) {
    // 1. validate user input
    const userUpdateSchema = Joi.object({
      userId: Joi.string().regex(mongodbIdPattern),
      username: Joi.string().min(5).max(30),
      name: Joi.string().max(30),
      email: Joi.string().email(),
      password: Joi.string().pattern(passwordPattern),
      confirmPassword: Joi.ref("password"),
      role: Joi.string(),
    });
    const { error } = userUpdateSchema.validate(req.body);

    // 2. if error in validation -> return error via middleware
    if (error) {
      return next(error);
    }

    // 3. if email or username is already registered -> return an error
    const { userId, username, name, email, password, role } = req.body;

    let hashedPassword;
    if(password){

    // 4. password hash
    hashedPassword = await bcrypt.hash(password, 10);
    }

    let user;

    try {
      user = await User.findOne({ _id: userId });
    } catch (error) {
      return next(error);
    }


    
    await User.updateOne({ _id: userId }, {
      name,
      username,
      email,
      password: hashedPassword,
      role,
      
    }) 

  return res.status(200).json({ message: "User's info has been Updated!" });
  },

  //get user by id

  async getUserById(req, res, next) {
    // validate id
    // response

    const getUserByIdSchema = Joi.object({
      id: Joi.string().regex(mongodbIdPattern).required(),
    });

    const { error } = getUserByIdSchema.validate(req.params);

    if (error) {
      return next(error);
    }

    let user;

    const { id } = req.params;

    try {
      user = await User.findOne({ _id: id });
    } catch (error) {
      return next(error);
    }

    const userDto = new UserDTO(user);

    return res.status(200).json({ user: userDto });
  },
  
  async login(req, res, next) {
    // 1. validate user input
    // 2. if validation error, return error
    // 3. match username and password
    // 4. return response

    // we expect input data to be in such shape
    const userLoginSchema = Joi.object({
      username: Joi.string().min(5).max(30).required(),
      password: Joi.string().pattern(passwordPattern),
    });

    const { error } = userLoginSchema.validate(req.body);

    if (error) {
      return next(error);
    }

    const { username, password } = req.body;

    // const username = req.body.username
    // const password = req.body.password

    let user;
    let accessToken;
    let refreshToken;
    try {
      // match username
      user = await User.findOne({ username: username });

      if (!user) {
        const error = {
          status: 401,
          message: "Invalid username",
        };

        return next(error);
      }

      // match password
      // req.body.password -> hash -> match

      const match = await bcrypt.compare(password, user.password);

      if (!match) {
        const error = {
          status: 401,
          message: "Invalid password",
        };

        return next(error);
      }
      // token generation
      accessToken = JWTService.signAccessToken({ _id: user._id }, "30m");

      refreshToken = JWTService.signRefreshToken({ _id: user._id }, "60m");
      // store refresh token in db
      await JWTService.storeRefreshToken(refreshToken, user._id);

      // send tokens in cookie
      res.cookie("accessToken", accessToken, {
        maxAge: 1000 * 60 * 60 * 24,
        httpOnly: true,
      });

      res.cookie("refreshToken", refreshToken, {
        maxAge: 1000 * 60 * 60 * 24,
        httpOnly: true,
      });
    } catch (error) {
      return next(error);
    }

    const userDto = new UserDTO(user);

    return res.status(200).json({ user: userDto, auth: true });
  },
  async logout(req, res, next) {
    // 1. delete refresh token from db
    const { refreshToken } = req.cookies;

    try {
      await RefreshToken.deleteOne({ token: refreshToken });
    } catch (error) {
      return next(error);
    }

    // delete cookies
    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");

    // 2. response
    res.status(200).json({ user: null, auth: false });
  },

  // get all user
  async getAllUser(req, res, next) {
    try {
      const users = await User.find({});

      const userDto = [];

      for (let i = 0; i < users.length; i++) {
        const dto = new UserDTO(users[i]);
        userDto.push(dto);
      }

      return res.status(200).json({ users: userDto });
    } catch (error) {
      return next(error);
    }
  },
  async refresh(req, res, next) {
    // 1. get refreshToken from cookies
    // 2. verify refreshToken
    // 3. generate new tokens
    // 4. update db, return response

    const originalRefreshToken = req.cookies.refreshToken;

    let id;

    try {
      id = JWTService.verifyRefreshToken(originalRefreshToken)._id;
    } catch (e) {
      const error = {
        status: 401,
        message: "Unauthorized",
      };

      return next(error);
    }

    try {
      const match = RefreshToken.findOne({
        _id: id,
        token: originalRefreshToken,
      });

      if (!match) {
        const error = {
          status: 401,
          message: "Unauthorized",
        };

        return next(error);
      }
    } catch (e) {
      return next(e);
    }

    try {
      const accessToken = JWTService.signAccessToken({ _id: id }, "30m");

      const refreshToken = JWTService.signRefreshToken({ _id: id }, "60m");

      await RefreshToken.updateOne({ _id: id }, { token: refreshToken });

      res.cookie("accessToken", accessToken, {
        maxAge: 1000 * 60 * 60 * 24,
        httpOnly: true,
      });

      res.cookie("refreshToken", refreshToken, {
        maxAge: 1000 * 60 * 60 * 24,
        httpOnly: true,
      });
    } catch (e) {
      return next(e);
    }

    const user = await User.findOne({ _id: id });

    const userDto = new UserDTO(user);

    return res.status(200).json({ user: userDto, auth: true });
  },
  async delete(req, res, next) {
    // validate id
    // delete blog
    // delete comments on this blog

    const deleteUserSchema = Joi.object({
      id: Joi.string().regex(mongodbIdPattern).required(),
    });

    const { error } = deleteUserSchema.validate(req.params);

    const { id } = req.params;

    try {
      await User.deleteOne({ _id: id });

    } catch (error) {
      return next(error);
    }

    return res.status(200).json({ message: "User deleted" });
  },


};

module.exports = authController;
