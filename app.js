const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");

const dbPath = path.join(__dirname, "todoApplication.db");
let db = null;

const app = express();
app.use(express.json()); // middle ware

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};
initializeDBAndServer();

const hasPriorityAndStatusProperties = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  );
};

// 1. API
const hasPriorityProperty = (requestQuery) => {
  return requestQuery.priority !== undefined;
};

const hasStatusProperty = (requestQuery) => {
  return requestQuery.status !== undefined;
};

app.get("/todos/", async (request, response) => {
  let data = null;
  let getTodosQuery = "";
  const { search_q = "", priority, status } = request.query;

  switch (true) {
    case hasPriorityAndStatusProperties(request.query): //if this is true then below query is taken in the code
      getTodosQuery = `
   SELECT
    *
   FROM
    todo 
   WHERE
    todo LIKE '%${search_q}%'
    AND status = '${status}'
    AND priority = '${priority}';`;
      break;
    case hasPriorityProperty(request.query):
      getTodosQuery = `
   SELECT
    *
   FROM
    todo 
   WHERE
    todo LIKE '%${search_q}%'
    AND priority = '${priority}';`;
      break;
    case hasStatusProperty(request.query):
      getTodosQuery = `
   SELECT
    *
   FROM
    todo 
   WHERE
    todo LIKE '%${search_q}%'
    AND status = '${status}';`;
      break;
    default:
      getTodosQuery = `
   SELECT
    *
   FROM
    todo 
   WHERE
    todo LIKE '%${search_q}%';`;
  }

  data = await db.all(getTodosQuery);
  response.send(data);
});

// 2. API
app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const getTodoQuery = `SELECT * FROM todo 
                        WHERE id = ${todoId};`;
  const todo = await db.get(getTodoQuery);
  response.send(todo);
});

//3. API
app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status } = request.body;
  const postTodoQuery = `INSERT INTO todo 
                            (id, todo, priority, status)
                            VALUES (
                                ${id},"${todo}","${priority}","${status}"
                            );`;
  await db.run(postTodoQuery);
  response.send("Todo Successfully Added");
});

//4. API
const hasStatusUpdate = (requestQuery) => {
  return requestQuery.status !== undefined;
};
const hasPriorityUpdate = (requestQuery) => {
  return requestQuery.priority !== undefined;
};

app.put("/todos/:todoId/", async (request, response) => {
  let putTodoQuery = "";
  let data = "";
  const { todoId } = request.params;
  const { status, priority, todo } = request.body;

  switch (true) {
    case hasStatusUpdate(request.body):
      putTodoQuery = `UPDATE todo
                            SET
                             status = "${status}";`;
      await db.run(putTodoQuery);
      response.send("Status Updated");
      break;
    case hasPriorityUpdate(request.body):
      putTodoQuery = `UPDATE todo
                            SET 
                             priority = "${priority}";`;
      await db.run(putTodoQuery);
      response.send("Priority Updated");
      break;

    default:
      putTodoQuery = `UPDATE todo
                            SET
                             todo = "${todo}";`;
      await db.run(putTodoQuery);
      response.send("Todo Updated");
      break;
  }
});

// 5. API
app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteQuery = `DELETE FROM todo
                            WHERE id = ${todoId};`;
  db.run(deleteQuery);
  response.send("Todo Deleted");
});

module.exports = app;
