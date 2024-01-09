const express = require("express");
const bodyParser = require("body-parser");
const fs = require("fs").promises;
const path = require("path");
const cookieParser = require("cookie-parser");

const app = express();
const PORT = 3000;

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cookieParser());

const messagesFilePath = path.join(__dirname, "messages.txt");

// Function to check if a file exists
const fileExists = async (filePath) => {
  try {
    await fs.access(filePath);
    return true;
  } catch (error) {
    return false;
  }
};

// Ensure the file exists, if not, create it
const initializeMessagesFile = async () => {
  if (!(await fileExists(messagesFilePath))) {
    await fs.writeFile(messagesFilePath, "");
  }
};

// Initialize the messages file on server start
initializeMessagesFile();

app.get("/login", (req, res) => {
  res.status(200).send(`
    <form action="/setUsername" method="POST">
      <label for="username">Enter your username:</label>
      <input type="text" name="username" required>
      <button type="submit">Login</button>
    </form>
  `);
});

app.post("/setUsername", (req, res) => {
  const username = req.body.username;

  // Store username in a cookie and redirect to "/"
  res.cookie("username", username);
  res.send(`
    <script>
      localStorage.setItem('username', '${username}');
      window.location.href = '/';
    </script>
  `);
});

app.get("/", async (req, res) => {
  const username = req.cookies.username || "";

  // Read existing messages from the file
  try {
    const messagesData = await fs.readFile(messagesFilePath, "utf8");
    const messages = messagesData.split("\n").filter(Boolean).map(JSON.parse);

    let chatContent = "<p>No chat exists.</p>";

    if (messages.length > 0) {
      chatContent = `
        <ul>
          ${messages
            .map(
              (message) => `<li>${message.username}: ${message.message}</li>`
            )
            .join("")}
        </ul>
      `;
    }

    // Display messages and input form
    res.status(200).send(`
      ${chatContent}
      <form action="/sendMessage" method="POST">
        <input type="text" name="message" placeholder="Write a message..." required>
        <button type="submit">Send</button>
      </form>
    `);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("Internal Server Error");
  }
});

app.post("/sendMessage", async (req, res) => {
  const username = req.cookies.username;
  const message = req.body.message;

  try {
    // Append the new message to the file
    await fs.appendFile(
      messagesFilePath,
      `${JSON.stringify({ username, message })}\n`
    );

    // Redirect to home page after sending a message
    res.redirect("/");
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("Internal Server Error");
  }
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
