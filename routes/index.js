const express = require('express');
const authController = require('../controller/authController');
const taskController = require('../controller/taskController');
const commentController=require('../controller/commentController');
const auth = require('../middlewares/auth');
const checkRole= require('../middlewares/checkRole');
const UserDTO = require('../dto/user');
const user = require('../models/user');

const router = express.Router();

// user

// register
router.post('/register', auth, checkRole(['admin']), authController.register);

// login
router.post('/login', authController.login);

// logout
router.post('/logout', auth, authController.logout)

// get all users
router.get('/user/all', auth, checkRole(['admin']), authController.getAllUser)

// refresh
router.get('/refresh', authController.refresh);

//get user by id
router.get("/userinfo/:id", auth, checkRole(['admin']), authController.getUserById)

//update info of user
router.put('/updateuserinfo', auth, checkRole(['admin']), authController.updateuser)

// tasks

// create
router.post('/task', auth, checkRole(['admin']), taskController.create);

// get all
router.get('/task/all', auth, checkRole(['admin']), taskController.getAll);

// get pending tasks
router.get('/task/phase', auth, checkRole(['admin']), taskController.getTaskByStatus)

// get completed tasks
router.get('/task/completed', auth, checkRole(['admin']), taskController.getTaskByComplete) 
// get task by id
router.get('/task/:id', auth, taskController.getById);


// update the phase of task
router.put('/task/updatestatus', auth, taskController.updatestatus);

router.put('/task/updatetaskdetails', auth, checkRole(['admin']), taskController.updatetaskdetails);


//get tasks from user

router.get('/user/:id', auth,  taskController.getByUser);

// update
//router.put('/task', auth, taskController.update);

// delete
router.delete('/task/:id', auth, checkRole(['admin']), taskController.delete);


// delete
router.delete('/deleteuser/:id', auth, checkRole(['admin']), authController.delete);


//comment
//create
router.post('/task/comment', auth, commentController.create);
// get all on each task
router.get('/task/comment/:id', auth, commentController.getById);


module.exports = router;