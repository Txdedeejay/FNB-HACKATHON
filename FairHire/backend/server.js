require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/fairhire', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('✅ Connected to MongoDB'))
.catch(err => console.error('❌ MongoDB connection error:', err));

// Applicant Schema
const applicantSchema = new mongoose.Schema({
  anonymousId: {
    type: String,
    unique: true,
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  position: {
    type: String,
    required: true,
    trim: true
  },
  experience: {
    type: Number,
    required: true,
    min: 0
  },
  skills: [{
    type: String,
    trim: true
  }],
  education: {
    type: String,
    required: true,
    trim: true
  },
  submittedAt: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['pending', 'reviewed', 'contacted', 'rejected'],
    default: 'pending'
  }
});

// Index for better query performance
applicantSchema.index({ anonymousId: 1 });
applicantSchema.index({ submittedAt: -1 });
applicantSchema.index({ position: 1 });

const Applicant = mongoose.model('Applicant', applicantSchema);

// Utility functions
function generateAnonymousId() {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substr(2, 5);
  return `APP${timestamp}${random}`.toUpperCase();
}

function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function validatePhone(phone) {
  const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
  return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
}

// Routes

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Anonymous Applicant API is running',
    timestamp: new Date().toISOString()
  });
});

// Submit application
app.post('/api/applicants', async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      position,
      experience,
      skills,
      education
    } = req.body;

    // Validation
    if (!name || !email || !phone || !position || !experience || !skills || !education) {
      return res.status(400).json({
        success: false,
        error: 'All fields are required'
      });
    }

    if (!validateEmail(email)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid email format'
      });
    }

    if (!validatePhone(phone)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid phone number format'
      });
    }

    if (experience < 0 || experience > 50) {
      return res.status(400).json({
        success: false,
        error: 'Experience must be between 0 and 50 years'
      });
    }

    const applicantData = {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      position: position.trim(),
      experience: Number(experience),
      skills: Array.isArray(skills) ? skills : skills.split(',').map(skill => skill.trim()).filter(skill => skill.length > 0),
      education: education.trim(),
      anonymousId: generateAnonymousId()
    };

    // Check for duplicate email for the same position
    const existingApplicant = await Applicant.findOne({
      email: applicantData.email,
      position: applicantData.position
    });

    if (existingApplicant) {
      return res.status(409).json({
        success: false,
        error: 'You have already applied for this position'
      });
    }

    const applicant = new Applicant(applicantData);
    await applicant.save();

    res.status(201).json({
      success: true,
      anonymousId: applicant.anonymousId,
      message: 'Application submitted successfully'
    });

  } catch (error) {
    console.error('Application submission error:', error);
    
    if (error.code === 11000) {
      return res.status(500).json({
        success: false,
        error: 'Duplicate application detected. Please try again.'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Get all applicants (anonymous data)
app.get('/api/applicants', async (req, res) => {
  try {
    const { position, minExperience, maxExperience, skills, page = 1, limit = 10 } = req.query;

    let filter = {};
    
    // Build filter based on query parameters
    if (position) {
      filter.position = new RegExp(position, 'i');
    }
    
    if (minExperience || maxExperience) {
      filter.experience = {};
      if (minExperience) filter.experience.$gte = Number(minExperience);
      if (maxExperience) filter.experience.$lte = Number(maxExperience);
    }
    
    if (skills) {
      const skillsArray = skills.split(',').map(skill => skill.trim());
      filter.skills = { $in: skillsArray.map(skill => new RegExp(skill, 'i')) };
    }

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    const applicants = await Applicant.find(filter, {
      anonymousId: 1,
      position: 1,
      experience: 1,
      skills: 1,
      education: 1,
      submittedAt: 1,
      status: 1,
      _id: 0
    })
    .sort({ submittedAt: -1 })
    .skip(skip)
    .limit(limitNum);

    const total = await Applicant.countDocuments(filter);
    const totalPages = Math.ceil(total / limitNum);

    res.json({
      success: true,
      data: applicants,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages,
        hasNext: pageNum < totalPages,
        hasPrev: pageNum > 1
      }
    });

  } catch (error) {
    console.error('Get applicants error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Get specific applicant contact info
app.get('/api/applicants/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const applicant = await Applicant.findOne(
      { anonymousId: id },
      { name: 1, email: 1, phone: 1, _id: 0 }
    );

    if (!applicant) {
      return res.status(404).json({
        success: false,
        error: 'Applicant not found'
      });
    }

    res.json({
      success: true,
      data: applicant
    });

  } catch (error) {
    console.error('Get applicant contact error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Update applicant status
app.patch('/api/applicants/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['pending', 'reviewed', 'contacted', 'rejected'];
    
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Valid status is required: pending, reviewed, contacted, rejected'
      });
    }

    const applicant = await Applicant.findOneAndUpdate(
      { anonymousId: id },
      { status },
      { new: true, fields: { anonymousId: 1, status: 1, _id: 0 } }
    );

    if (!applicant) {
      return res.status(404).json({
        success: false,
        error: 'Applicant not found'
      });
    }

    res.json({
      success: true,
      data: applicant,
      message: 'Status updated successfully'
    });

  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Get application statistics
app.get('/api/stats', async (req, res) => {
  try {
    const totalApplications = await Applicant.countDocuments();
    const applicationsByStatus = await Applicant.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);
    const applicationsByPosition = await Applicant.aggregate([
      {
        $group: {
          _id: '$position',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    res.json({
      success: true,
      data: {
        totalApplications,
        applicationsByStatus,
        applicationsByPosition
      }
    });

  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// 404 handler
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'API endpoint not found'
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 MongoDB: ${process.env.MONGODB_URI}`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
});