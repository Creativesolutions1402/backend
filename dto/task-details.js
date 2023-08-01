class TaskDetailsDTO{
    constructor(task){
        this._id = task._id;
        this.applicant_name = task.applicant_name;
        this.fathername = task.fathername;
        this.cnic = task.cnic;
        this.cell=task.cell;
        this.email=task.email;
        this.complaint=task.complaint;
        this.letter=task.letter;
        this.file=task.file;
        this.due=task.due;
        this.assignedUsername = task.assigneduser?.username || '';
        this.refile= task.refile;
        this.phase=task.phase;
        this.createdAt = task.createdAt;
    }
}

module.exports = TaskDetailsDTO;