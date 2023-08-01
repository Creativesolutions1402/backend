const Joi = require("joi");
const fs = require("fs");
const Task = require("../models/task");
const User = require("../models/user")
const { BACKEND_SERVER_PATH } = require('../config/index')
/*const {
  BACKEND_SERVER_PATH,
  CLOUD_NAME,
  API_SECRET,
  API_KEY,
} = require("../config/index");*/
const TaskDTO = require("../dto/task");
const TaskDetailsDTO = require("../dto/task-details");

const cloudinary = require("cloudinary").v2;

// Configuration
cloudinary.config({ 
  cloud_name: 'deuad8uku', 
  api_key: '549385475782249', 
  api_secret: 'L6Uut6DR-OVdb2m_uoJCgV29EaU' 
});

const mongodbIdPattern = /^[0-9a-fA-F]{24}$/;
const mongoCnicPattern = /^\d{5}-\d{7}-\d{1}$/;
const mongoCellPattern = /^\+\d{4,5}-\d{7,8}$/;
const taskController = {
  async create(req, res, next) {
    // 1. validate req body
    // 2. handle photo storage, naming
    // 3. add to db
    // 4. return response

    // client side -> base64 encoded string -> decode -> store -> save photo's path in db

    const createTaskSchema = Joi.object({
      applicant_name: Joi.string().required(),
      fathername: Joi.string().optional().allow(''),
      cnic: Joi.string().regex(mongoCnicPattern).optional().allow(''),
      cell: Joi.string().regex(mongoCellPattern).optional().allow(''),
      email: Joi.string().optional().allow(''),
      complaint: Joi.string().required(),
      letter: Joi.string().optional().allow(''),
      file: Joi.string().required(),
      due: Joi.date().required(),
      assigneduser: Joi.string().regex(mongodbIdPattern).required(),
      phase: Joi.string().required(),
    });
    

    const { error } = createTaskSchema.validate(req.body);

    if (error) {
      return next(error);
    }

    const {
      applicant_name,
      fathername = '',
      cnic = '',
      cell = '',
      email = '',
      complaint,
      letter = '',
      file,
      due,
      assigneduser,
      phase,
    } = req.body;
    

    // read as buffer
//    const buffer = Buffer.from(file.replace(/^data:image\/(png|jpg|jpeg);base64,/, ""), "base64");
    //const bufferr = Buffer.from(refile.replace(/^data:image\/(png|jpg|jpeg);base64,/, ""),"base64");
    // allot a random name
  //  const filePath = `${Date.now()}-${assigneduser}.png`;

    // save to cloudinary
    let response;

    try {
      response = await cloudinary.uploader.upload(file, { secure: true });
    //  fs.writeFileSync(`storage/${filePath}`, buffer);
    } catch (error) {
      return next(error);
    }

    // save blog in db
    let newTask;
    try {
      newTask = new Task({
        applicant_name,
        fathername,
        cnic,
        cell,
        email,
        complaint,
        letter,
        file: response.url,
        due,
        assigneduser,
        phase,
      });

      await newTask.save();
    } catch (error) {
      return next(error);
    }

    const taskDto = new TaskDTO(newTask);

    return res.status(201).json({ Task: taskDto });
  },
  async getAll(req, res, next) {
    try {
      const tasks = await Task.find({}).populate('assigneduser');

      const tasksDto = [];

      for (let i = 0; i < tasks.length; i++) {
        const dto = new TaskDetailsDTO(tasks[i]);
        tasksDto.push(dto);
      }

      return res.status(200).json({ tasks: tasksDto });
    } catch (error) {
      return next(error);
    }
  },
  //get tasks with pending status
  async getTaskByStatus(req, res, next) {
    try {
      const tasks = await Task.find({ phase: { $in: ['created', 'pending'] } }).populate('assigneduser');

      const tasksDto = [];

      for (let i = 0; i < tasks.length; i++) {
        const dto = new TaskDetailsDTO(tasks[i]);
        tasksDto.push(dto);
      }

      return res.status(200).json({ tasks: tasksDto });
    } catch (error) {
      return next(error);
    }
  },
  // get task with complete status
  async getTaskByComplete(req, res, next) {
    try {
      const tasks = await Task.find({ phase: ['completed'] }).populate('assigneduser');

      const tasksDto = [];

      for (let i = 0; i < tasks.length; i++) {
        const dto = new TaskDetailsDTO(tasks[i]);
        tasksDto.push(dto);
      }

      return res.status(200).json({ tasks: tasksDto });
    } catch (error) {
      return next(error);
    }
  },

  async getById(req, res, next) {
    // validate id
    // response

    const getByIdSchema = Joi.object({
      id: Joi.string().regex(mongodbIdPattern).required(),
    });

    const { error } = getByIdSchema.validate(req.params);

    if (error) {
      return next(error);
    }

    let task;

    const { id } = req.params;

    try {
      task = await Task.findOne({ _id: id }).populate("assigneduser");
    } catch (error) {
      return next(error);
    }

    const taskDto = new TaskDetailsDTO(task);

    return res.status(200).json({ task: taskDto });
  },


  //get tasks by user:
  async getByUser(req, res, next) {

    // validate id
    // response

    const getByIdSchema = Joi.object({
      id: Joi.string().regex(mongodbIdPattern).required(),
    });

    const { error } = getByIdSchema.validate(req.params);

    if (error) {
      return next(error);
    }

    let tasks;

    const { id } = req.params;

    try {
      tasks = await Task.find({ assigneduser: id }).populate("assigneduser");
    } catch (error) {
      return next(error);
    }


    const tasksDto = [];

    for (let j = 0; j < tasks.length; j++) {
      const dto = new TaskDetailsDTO(tasks[j]);
      tasksDto.push(dto);
    }

    return res.status(200).json({ tasks: tasksDto });


  },

  // update task status
  async updatetaskdetails(req, res, next) {
    // validate
    //

    const updateTaskSchema = Joi.object({
      taskId: Joi.string().regex(mongodbIdPattern).required(),
      refile: Joi.string(),
      file: Joi.string(),
      phase: Joi.string().required(),
      applicant_name: Joi.string(),
      fathername: Joi.string(),
      cnic: Joi.string().regex(mongoCnicPattern),
      cell: Joi.string().regex(mongoCellPattern),
      email: Joi.string(),
      complaint: Joi.string(),
      letter: Joi.string(),
      due: Joi.date(),
      assigneduser: Joi.string().regex(mongodbIdPattern),
    });

    const { error } = updateTaskSchema.validate(req.body);

    const { taskId, applicant_name, file, fathername, cnic, cell, email, complaint, letter, due, assigneduser, refile, phase } = req.body;

    let responded;
    // read as buffer
      //const bufferr = Buffer.from(refile.replace(/^data:image\/(png|jpg|jpeg);base64,/, ""), "base64");
      //const bufferr = Buffer.from(refile.replace(/^data:image\/(png|jpg|jpeg);base64,/, ""),"base64");
      // allot a random name
      //const filePathh = `${Date.now()}-${taskId}.png`;
      // delete previous photo
      // save new photo
      // save to cloudinary
      //let response;

     // save to cloudinary
    

    try {
      responded = await cloudinary.uploader.upload(file);
    //  fs.writeFileSync(`storage/${filePath}`, buffer);
    } catch (error) {
      return next(error);
    }
    if (refile) {
    let respond;
    // read as buffer
      //const bufferr = Buffer.from(refile.replace(/^data:image\/(png|jpg|jpeg);base64,/, ""), "base64");
      //const bufferr = Buffer.from(refile.replace(/^data:image\/(png|jpg|jpeg);base64,/, ""),"base64");
      // allot a random name
      //const filePathh = `${Date.now()}-${taskId}.png`;
      // delete previous photo
      // save new photo
      // save to cloudinary
      //let response;

     // save to cloudinary
     

    try {
      respond = await cloudinary.uploader.upload(refile);
    //  fs.writeFileSync(`storage/${filePath}`, buffer);
    } catch (error) {
      return next(error);
    }


    


      let task;

      try {
        task = await Task.findOne({ _id: taskId });
      } catch (error) {
        return next(error);
      }


      
      await Task.updateOne({ _id: taskId }, {
        refile: respond.url,
        file: responded.url,
        phase,
        applicant_name,
        fathername,
        cnic,
        cell,
        email,
        complaint,
        letter,
        due,
        assigneduser
      }); } else {
        await Task.updateOne({ _id: taskId }, {
        file: responded.url,
        phase,
        applicant_name,
        fathername,
        cnic,
        cell,
        email,
        complaint,
        letter,
        due,
        assigneduser
        })
      } 

    return res.status(200).json({ message: "task status Updated!" });
  },

  // update task status
  async updatestatus(req, res, next) {
    // validate
    //

    const updateTaskSchema = Joi.object({
      taskId: Joi.string().regex(mongodbIdPattern).required(),
      refile: Joi.string(),
      phase: Joi.string().required(),

    });

    const { error } = updateTaskSchema.validate(req.body);

    const { taskId, refile, phase } = req.body;


    // read as buffer
    if (refile) {
      //const bufferr = Buffer.from(refile.replace(/^data:image\/(png|jpg|jpeg);base64,/, ""), "base64");
      //const bufferr = Buffer.from(refile.replace(/^data:image\/(png|jpg|jpeg);base64,/, ""),"base64");
      // allot a random name
      //const filePathh = `${Date.now()}-${taskId}.png`;
      // delete previous photo
      // save new photo
      // save to cloudinary
      let response;

      try {
        response = await cloudinary.uploader.upload(refile);
        //fs.writeFileSync(`storage/${filePathh}`, bufferr);
      } catch (error) {
        return next(error);
      }


      let task;

      try {
        task = await Task.findOne({ _id: taskId });
      } catch (error) {
        return next(error);
      }

      await Task.updateOne({ _id: taskId }, {
        refile: response.url,
        phase
      });
    } else {
      await Task.updateOne({ _id: taskId }, {
        phase
      });

    }

    return res.status(200).json({ message: "task status Updated!" });
  },


  /*
    async update(req, res, next) {
      // validate
      //
  
      const updateTaskSchema = Joi.object({
        applicant_name: Joi.string().required(),
        fathername: Joi.string().required(),
        cnic:Joi.string().regex(mongoCnicPattern).required(),
        cell:Joi.string().regex(mongoCellPattern).required(),
        email: Joi.string().required(),
        complaint:Joi.string().required(),
        file: Joi.string().required(),
        due:Joi.date().required(),
        assigneduser: Joi.string().regex(mongodbIdPattern).required(),
        refile:Joi.string(),
        comment:Joi.string(),
        phase:Joi.string().required(),
        taskId: Joi.string().regex(mongodbIdPattern).required(),
      });
  
      const { error } = updateTaskSchema.validate(req.body);
  
      const { applicant_name, fathername, cnic, cell, email, complaint, file, due, assigneduser,refile, comment, phase, taskId } = req.body;
  
      // delete previous photo
      // save new photo
  
      let task;
  
      try {
        task = await Task.findOne({ _id: taskId });
      } catch (error) {
        return next(error);
      }
  
      if (file || refile) {
        let previousFile = task.file;
        let previousRefile=task.refile;
  
        previousFile = previousFile.split("/").at(-1);
        previousRefile=previousRefile.split("/").at(-1);
  
        // delete photo
        fs.unlinkSync(`storage/${previousFile}`);
        fs.unlinkSync(`storage/${previousRefile}`)
  
        // read as buffer
        // const buffer = Buffer.from(
        //   photo.replace(/^data:image\/(png|jpg|jpeg);base64,/, ""),
        //   "base64"
        // );
  
        // allot a random name
        // const imagePath = `${Date.now()}-${author}.png`;
  
        // save locally
        let response;
        try {
          response = await cloudinary.uploader.upload(file);
          response = await cloudinary.uploader.upload(refile);
          // fs.writeFileSync(`storage/${imagePath}`, buffer);
        } catch (error) {
          return next(error);
        }
  
        await Task.updateOne(
          { _id: taskId },
          {
            applicant_name,
            fathername,
            cnic,
            cell,
            email,
            complaint,
            file: response.url,
            due,
            assigneduser,
            phase,
          }
        );
      } else {
        await Task.updateOne({ _id: taskId }, { applicant_name, fathername, cnic, cell, email, complaint, due, assigneduser, phase });
      }
  
      return res.status(200).json({ message: "task updated!" });
    },*/
  async delete(req, res, next) {
    // validate id
    // delete blog
    // delete comments on this blog

    const deleteTaskSchema = Joi.object({
      id: Joi.string().regex(mongodbIdPattern).required(),
    });

    const { error } = deleteTaskSchema.validate(req.params);

    const { id } = req.params;

    // delete blog
    // delete comments
    try {
      await Task.deleteOne({ _id: id });

    } catch (error) {
      return next(error);
    }

    return res.status(200).json({ message: "Task deleted" });
  },
};

module.exports = taskController;
