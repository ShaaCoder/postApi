const express = require('express');
const app = express();
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const dotenv = require('dotenv');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Post = require('./models/Post');

dotenv.config();

console.log("Serving static files from:", path.join(__dirname, "/images"));
app.use("/images", express.static(path.join(__dirname, "/images")));

app.use(cors({
  origin: 'http://localhost:3000/', // Replace with your frontend's domain
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Set up multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "images");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // Append unique timestamp to the file name
  }
});
const upload = multer({ storage: storage });

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log("Database connection established successfully");
  } catch (err) {
    console.log(err);
  }
};

// Image upload endpoint
app.post("/api/upload", upload.single("file"), (req, res) => {
  console.log(req.file);
  res.status(200).json("Image has been uploaded successfully");
});

// Route to serve images directly by filename
app.get('/images/:filename', (req, res) => {
  const filename = req.params.filename;
  const filepath = path.join(__dirname, 'images', filename);
  res.sendFile(filepath);
});

// Route to get all images
app.get('/images', (req, res) => {
  const imagesDirectory = path.join(__dirname, 'images');
  fs.readdir(imagesDirectory, (err, files) => {
    if (err) {
      return res.status(500).json({ message: 'Unable to scan files' });
    }
    const images = files.map(file => `/images/${file}`);
    res.status(200).json(images);
  });
});

// Create a new post
app.post('/posts', upload.single('image'), async (req, res) => {
  try {
    const newPost = new Post({
      title: req.body.title,
      desc: req.body.desc,
      username: req.body.username,
      photo: req.file ? `/images/${req.file.filename}` : ''
    });
    const savedPost = await newPost.save();
    res.status(201).json(savedPost);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Get all posts
app.get('/', async (req, res) => {
  try {
    const posts = await Post.find();
    res.status(200).json(posts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get a post by ID
app.get('/posts/:id', async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });
    res.status(200).json(post);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update a post by ID
app.put('/posts/:id', async (req, res) => {
  try {
    const updatedPost = await Post.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!updatedPost) return res.status(404).json({ message: 'Post not found' });
    res.status(200).json(updatedPost);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete a post by ID
app.delete('/posts/:id', async (req, res) => {
  try {
    const deletedPost = await Post.findByIdAndDelete(req.params.id);
    if (!deletedPost) return res.status(404).json({ message: 'Post not found' });
    res.status(200).json({ message: 'Post deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Start the server
app.listen(process.env.PORT, () => {
  connectDB();
  console.log("App listening on port", process.env.PORT);
});
