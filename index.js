const express = require('express');
const app = express();
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const dotenv = require('dotenv');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const Post = require('./models/Post');

dotenv.config();
app.use("/images", express.static(path.join(__dirname, "/images")));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Set up multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "images");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URL, {
      useUnifiedTopology: true
    });
    console.log("Database connection established successfully");
  } catch (err) {
    console.log("Error connecting to database:", err);
  }
};

// Image upload endpoint
app.post("/api/upload", upload.single("file"), (req, res) => {
  try {
    res.status(200).json("Image has been uploaded successfully");
  } catch (err) {
    console.error("Error during image upload:", err);
    res.status(500).json({ message: "Internal server error" });
  }
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
    console.error("Error creating post:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Get all posts
app.get('/posts', async (req, res) => {
  try {
    const posts = await Post.find();
    res.status(200).json(posts);
  } catch (err) {
    console.error("Error fetching posts:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Get a post by ID
app.get('/posts/:id', async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });
    res.status(200).json(post);
  } catch (err) {
    console.error("Error fetching post:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Update a post by ID
app.put('/posts/:id', upload.single('image'), async (req, res) => {
  try {
    const updatedData = req.file
      ? { ...req.body, photo: `/images/${req.file.filename}` }
      : req.body;
    const updatedPost = await Post.findByIdAndUpdate(req.params.id, updatedData, { new: true, runValidators: true });
    if (!updatedPost) return res.status(404).json({ message: 'Post not found' });
    res.status(200).json(updatedPost);
  } catch (err) {
    console.error("Error updating post:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Delete a post by ID
app.delete('/posts/:id', async (req, res) => {
  try {
    const deletedPost = await Post.findByIdAndDelete(req.params.id);
    if (!deletedPost) return res.status(404).json({ message: 'Post not found' });
    res.status(200).json({ message: 'Post deleted' });
  } catch (err) {
    console.error("Error deleting post:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Start the server
app.listen(process.env.PORT, () => {
  connectDB();
  console.log("App listening on port", process.env.PORT);
});
