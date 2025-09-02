const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// MongoDB connection
mongoose.connect('mongodb+srv://apl:apl00@gamepaymentbot.ffcsj5v.mongodb.net/pbg?retryWrites=true&w=majority', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// Post Schema
const postSchema = new mongoose.Schema({
  content: { type: String, required: true },
  mediaType: { type: String, enum: ['none', 'image', 'video'] },
  mediaPath: { type: String },
  likes: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

const Post = mongoose.model('Post', postSchema);

// Multer configuration for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let uploadPath = 'uploads/';
    if (file.mimetype.startsWith('image')) {
      uploadPath += 'images/';
    } else if (file.mimetype.startsWith('video')) {
      uploadPath += 'videos/';
    }
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // Generate unique filename
    const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname);
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image') || file.mimetype.startsWith('video')) {
      cb(null, true);
    } else {
      cb(new Error('Only images and videos are allowed!'), false);
    }
  }
});

// Middleware
app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes

// Get all posts with pagination
app.get('/api/posts', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 5;
    const skip = (page - 1) * limit;
    
    const posts = await Post.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    res.json(posts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create a new post
app.post('/api/posts', upload.single('media'), async (req, res) => {
  try {
    const { content } = req.body;
    let mediaType = 'none';
    let mediaPath = '';
    
    if (req.file) {
      mediaType = req.file.mimetype.startsWith('image') ? 'image' : 'video';
      mediaPath = req.file.path;
    }
    
    const post = new Post({
      content,
      mediaType,
      mediaPath
    });
    
    await post.save();
    res.status(201).json(post);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Like a post
app.post('/api/posts/:id/like', async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }
    
    post.likes += 1;
    await post.save();
    
    res.json({ likes: post.likes });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get post statistics
app.get('/api/stats', async (req, res) => {
  try {
    const totalPosts = await Post.countDocuments();
    const totalLikes = await Post.aggregate([
      { $group: { _id: null, total: { $sum: '$likes' } } }
    ]);
    
    const popularPosts = await Post.find().sort({ likes: -1 }).limit(5);
    
    res.json({
      totalPosts,
      totalLikes: totalLikes[0]?.total || 0,
      popularPosts
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete a post
app.delete('/api/posts/:id', async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }
    
    // Remove associated media file
    if (post.mediaPath && fs.existsSync(post.mediaPath)) {
      fs.unlinkSync(post.mediaPath);
    }
    
    await Post.findByIdAndDelete(req.params.id);
    res.json({ message: 'Post deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// server.js fayliga quyidagi endpointlarni qo'shing

// User Post Schema
const userPostSchema = new mongoose.Schema({
  authorName: { type: String, required: true },
  content: { type: String, required: true },
  mediaType: { type: String, enum: ['none', 'image', 'video'] },
  mediaPath: { type: String },
  likes: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

const UserPost = mongoose.model('UserPost', userPostSchema);

// Get all user posts with pagination
app.get('/api/user-posts', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 5;
    const skip = (page - 1) * limit;
    
    const posts = await UserPost.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    res.json(posts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create a new user post
app.post('/api/user-posts', upload.single('media'), async (req, res) => {
  try {
    const { authorName, content } = req.body;
    let mediaType = 'none';
    let mediaPath = '';
    
    if (req.file) {
      mediaType = req.file.mimetype.startsWith('image') ? 'image' : 'video';
      mediaPath = req.file.path;
    }
    
    const post = new UserPost({
      authorName,
      content,
      mediaType,
      mediaPath
    });
    
    await post.save();
    res.status(201).json(post);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Like a user post
app.post('/api/user-posts/:id/like', async (req, res) => {
  try {
    const post = await UserPost.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }
    
    post.likes += 1;
    await post.save();
    
    res.json({ likes: post.likes });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get user post statistics
app.get('/api/user-stats', async (req, res) => {
  try {
    const totalPosts = await UserPost.countDocuments();
    const totalLikes = await UserPost.aggregate([
      { $group: { _id: null, total: { $sum: '$likes' } } }
    ]);
    
    const popularPosts = await UserPost.find().sort({ likes: -1 }).limit(5);
    
    res.json({
      totalPosts,
      totalLikes: totalLikes[0]?.total || 0,
      popularPosts
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete a user post
app.delete('/api/user-posts/:id', async (req, res) => {
  try {
    const post = await UserPost.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }
    
    // Remove associated media file
    if (post.mediaPath && fs.existsSync(post.mediaPath)) {
      fs.unlinkSync(post.mediaPath);
    }
    
    await UserPost.findByIdAndDelete(req.params.id);
    res.json({ message: 'Post deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Serve user posts page
app.get('/user-posts', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'user-posts.html'));
});

// Serve index page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Serve admin page
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});