const express = require('express');
const app = express()
const mongoose  = require('mongoose');
const cookieParser = require('cookie-parser');
const dotenv = require('dotenv')
const cors = require('cors');
const Post = require('./models/Post');

dotenv.config()
app.use(cors());
app.use(express.json()); 
app.use(express.urlencoded({ extended: true }));
const connectDB = async()=>{
    try{
        await mongoose.connect(process.env.MONGO_URL)
        console.log("database connection established successfully");
    }
    catch(err){
        console.log(err);
    }
}
app.post('/posts', async (req, res) => {
    try {
      const newPost = new Post(req.body);
      const savedPost = await newPost.save();
      res.status(201).json(savedPost);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  });
  
  // Get all posts
  app.get('/posts', async (req, res) => {
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
  app.listen(process.env.PORT,()=>{
    connectDB()
    console.log("app listening on port",process.env.PORT);
})