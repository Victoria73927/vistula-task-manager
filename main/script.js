function addTask() {
  
    const taskInput = document.getElementById("taskInput");

  
    const taskText = taskInput.value.trim();

  
    if (taskText === "") {
        alert("Please enter a task.");
        return;
    }

  
    const li = document.createElement("li");

  
    li.textContent = taskText;

  
    li.addEventListener("click", function () {
        li.classList.toggle("completed");
    });

  
    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "Delete";

  
    deleteBtn.addEventListener("click", function (event) {
        event.stopPropagation(); 
        li.remove();
    });

  
    li.appendChild(document.createTextNode(" "));

  
    li.appendChild(deleteBtn);

  
    document.getElementById("taskList").appendChild(li);

  
    taskInput.value = "";
}