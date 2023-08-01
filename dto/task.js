class TaskDTO{
    constructor(task){
        this._id = task._id;
        this.assigneduser = task.assigneduser;
        this.cnic = task.cnic;
        this.cell = task.cell;
        this.email=task.email;
        this.applicant_name = task.applicant_name;
        this.compaint=task.compaint;
        this.letter=task.letter;
        this.file = task.filePath;
        this.due=task.due;
        this.phase=task.phase;
    }
}

module.exports = TaskDTO;