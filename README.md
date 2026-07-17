# RTSP Livestream Overlay Application

A full-stack web application for playing RTSP livestreams with real-time custom overlay management. Built with React, Flask, and MongoDB.

<img width="1908" height="1028" alt="image" src="https://github.com/user-attachments/assets/bfc534df-63e7-4ff5-852f-6e13a399e3d7" />


## 🎯 Features

- **RTSP Livestream Playback**: Play livestreams from RTSP sources with standard video controls
- **Real-time Overlays**: Add text and image overlays on top of live video
- **Drag & Drop**: Freely move overlays across the video player
- **Persistent Storage**: All overlay configurations saved in MongoDB
- **CRUD Operations**: Full create, read, update, delete functionality via REST API
- **Responsive Design**: Professional UI built with Tailwind CSS
- **Playback Controls**: Play, pause, volume control, and mute functionality

## 🛠️ Technology Stack

### Backend
- **Python 3.8+**
- **Flask** - Web framework
- **Flask-CORS** - Cross-origin resource sharing
- **PyMongo** - MongoDB driver
- **MongoDB** - NoSQL database

### Frontend
- **React 18**
- **Tailwind CSS** - Utility-first CSS framework
- **Lucide React** - Icon library

## 📋 Prerequisites

Before you begin, ensure you have installed:

- **Python 3.8 or higher** - [Download](https://www.python.org/downloads/)
- **Node.js 16 or higher** - [Download](https://nodejs.org/)
- **MongoDB 4.4 or higher** - [Download](https://www.mongodb.com/try/download/community)
- **Git** - [Download](https://git-scm.com/downloads)

## 🚀 Installation

### 1. Clone the Repository

```bash
git clone <your-repository-url>
cd rtsp-livestream-overlay
```

### 2. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### 3. Frontend Setup

```bash
# Navigate to frontend directory (from project root)
cd frontend

# Install dependencies
npm install
```

### 4. Start MongoDB

**Windows:**
```bash
# MongoDB should auto-start if installed as service
# Or start manually:
net start MongoDB
```

**macOS:**
```bash
brew services start mongodb-community
```

**Linux:**
```bash
sudo systemctl start mongod
```

Verify MongoDB is running:
```bash
mongosh
# Should connect successfully
exit
```

## ▶️ Running the Application

You need to run 3 services in separate terminals:

### Terminal 1: MongoDB (if not running as service)
```bash
mongod
```

### Terminal 2: Backend
```bash
cd backend
source venv/bin/activate  # Windows: venv\Scripts\activate
python app.py
```

Backend will start on: http://localhost:5000

### Terminal 3: Frontend
```bash
cd frontend
npm start
```

Frontend will start on: http://localhost:3000

## 🎮 Usage

1. **Open the application** in your browser at http://localhost:3000

2. **Enter RTSP URL** in the input field (demo video is pre-loaded)

3. **Play the video** by clicking the Play button

4. **Create overlays:**
   - Click the **+** button
   - Select type (Text or Image)
   - Enter content
   - Click Create Overlay

5. **Move overlays:** Click and drag any overlay to reposition

6. **Delete overlays:** Click the trash icon next to any overlay

7. **Test persistence:** Refresh the page - overlays should remain

## 📁 Project Structure

```
rtsp-livestream-overlay/
├── backend/
│   ├── app.py              # Flask application
│   ├── requirements.txt    # Python dependencies
│   ├── .env               # Environment variables
│   └── venv/              # Virtual environment
│
├── frontend/
│   ├── public/
│   │   ├── index.html     # HTML template
│   │   ├── manifest.json  # PWA manifest
│   │   └── robots.txt     # Robots file
│   ├── src/
│   │   ├── App.js         # Main React component
│   │   ├── App.css        # Component styles
│   │   ├── index.js       # React entry point
│   │   └── index.css      # Global styles
│   ├── package.json       # Node dependencies
│   ├── tailwind.config.js # Tailwind configuration
│   └── postcss.config.js  # PostCSS configuration
│
├── .gitignore
└── README.md
```

## 🔌 API Endpoints

### Overlays

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/overlays` | Get all overlays |
| GET | `/api/overlays/<id>` | Get single overlay |
| POST | `/api/overlays` | Create new overlay |
| PUT | `/api/overlays/<id>` | Update overlay |
| DELETE | `/api/overlays/<id>` | Delete overlay |

### Settings

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/settings` | Get app settings |
| PUT | `/api/settings` | Update settings |

### Health Check

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Check API status |

### Example API Calls

```bash
# Get all overlays
curl http://localhost:5000/api/overlays

# Create overlay
curl -X POST http://localhost:5000/api/overlays \
  -H "Content-Type: application/json" \
  -d '{
    "type": "text",
    "content": "Breaking News",
    "position": {"x": 100, "y": 50},
    "size": {"width": 200, "height": 50}
  }'

# Health check
curl http://localhost:5000/api/health
```

## 🧪 Testing

### Verify Backend
```bash
curl http://localhost:5000/api/health
```

Expected response:
```json
{
  "status": "healthy",
  "database": "connected",
  "overlays_count": 0
}
```

### Verify Frontend
1. Open http://localhost:3000
2. Should see the application interface
3. No errors in browser console (F12)

### Test Full Workflow
1. Create a text overlay
2. Create an image overlay (use: https://upload.wikimedia.org/wikipedia/commons/thumb/2/2f/Google_2015_logo.svg/320px-Google_2015_logo.svg.png)
3. Drag overlays to different positions
4. Refresh page (F5)
5. Verify overlays are still present

## 🐛 Troubleshooting

### MongoDB Connection Failed
```bash
# Check if MongoDB is running
mongosh

# Start MongoDB
# Windows: net start MongoDB
# macOS: brew services start mongodb-community
# Linux: sudo systemctl start mongod
```

### Port Already in Use
```bash
# Backend (port 5000)
# Windows: netstat -ano | findstr :5000
# macOS/Linux: lsof -ti:5000 | xargs kill -9

# Frontend (port 3000)
# Change port: PORT=3001 npm start
```

### Module Not Found
```bash
# Backend
cd backend
pip install -r requirements.txt

# Frontend
cd frontend
rm -rf node_modules package-lock.json
npm install
```

### CORS Errors
- Verify backend is running on port 5000
- Verify frontend is running on port 3000
- Check Flask-CORS is installed: `pip list | grep Flask-CORS`

## 🔧 Configuration

### Environment Variables (backend/.env)

```env
MONGO_URI=mongodb://localhost:27017/
FLASK_ENV=development
PORT=5000
```

### Changing RTSP URL

1. Enter URL in the input field on the landing page
2. Or update via API:
```bash
curl -X PUT http://localhost:5000/api/settings \
  -H "Content-Type: application/json" \
  -d '{"rtsp_url": "rtsp://your-stream-url"}'
```

## 📝 RTSP Conversion Note

Browsers don't natively support RTSP streams. For production use:

1. **Use FFmpeg** to convert RTSP to HLS:
```bash
ffmpeg -i rtsp://your-stream-url \
  -c copy -f hls \
  -hls_time 2 -hls_list_size 3 \
  output.m3u8
```

2. **Or use WebRTC** for real-time streaming

3. **Test streams:**
   - RTSP.me: https://rtsp.me/
   - Wowza: rtsp://wowzaec2demo.streamlock.net/vod/mp4:BigBuckBunny_115k.mov

## 🚢 Deployment

### Backend (Production)
```bash
pip install gunicorn
gunicorn -w 4 -b 0.0.0.0:5000 app:app
```

### Frontend (Build)
```bash
cd frontend
npm run build
```

Deploy the `build` folder to:
- Vercel
- Netlify
- AWS S3 + CloudFront
- Any static hosting service

### Database
- Use MongoDB Atlas for cloud database
- Update MONGO_URI in .env

## 📄 License

This project is created as an assignment submission.

## 👤 Author

**Kuldeep**
- Email: rathorekuldeepsingh2691@gmail.com



**Built with ❤️ using React, Flask, and MongoDB**
