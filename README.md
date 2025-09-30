# Meetmux - Location-Based Event Meetup Platform

Meetmux is a modern web application that helps people discover and organize local events based on their location. Built with React, Node.js, MongoDB, and real-time WebSocket communication.

## 🌟 Features

### Core Features

- **Interactive Map**: View events on an interactive Leaflet map
- **Real-time Location Tracking**: Live location updates using WebSocket
- **Event Management**: Create, join, and manage events
- **Smart Filtering**: Filter events by category, date, distance, and availability
- **User Profiles**: Manage personal information and event history
- **Responsive Design**: Works seamlessly on desktop and mobile devices

### Technical Features

- **Real-time Communication**: Socket.io for live updates
- **Location Services**: Geolocation API integration
- **Authentication**: JWT-based secure authentication
- **RESTful API**: Well-structured backend API
- **Database**: MongoDB with proper indexing
- **Containerization**: Docker support for easy deployment

## 🚀 Getting Started

### Prerequisites

- Node.js (v16 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn package manager

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/yourusername/meetmux.git
   cd meetmux
   ```

2. **Backend Setup**

   ```bash
   cd backend
   npm install

   # Create environment file
   cp .env.example .env
   # Edit .env with your configuration

   # Start the backend server
   npm run dev
   ```

3. **Frontend Setup**

   ```bash
   cd frontend
   npm install

   # Start the development server
   npm run dev
   ```

4. **Database Setup**
   - Ensure MongoDB is running
   - The application will automatically create the database and collections

### Environment Variables

#### Backend (.env)

```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/meetmux
JWT_SECRET=your-super-secret-jwt-key
CLIENT_URL=http://localhost:5173
```

#### Frontend (.env)

```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_SERVER_URL=http://localhost:5000
```

## 🐳 Docker Deployment

### Development

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Production

```bash
# Start with production profile
docker-compose --profile production up -d
```

## 📁 Project Structure

```
meetmux/
│
├── backend/                 # Node.js Express backend
│   ├── src/
│   │   ├── config/         # Database configuration
│   │   ├── controllers/    # Route controllers
│   │   ├── models/         # MongoDB schemas
│   │   ├── routes/         # API routes
│   │   ├── sockets/        # WebSocket handlers
│   │   ├── utils/          # Utility functions
│   │   └── server.js       # Main server file
│   └── package.json
│
├── frontend/               # React frontend
│   ├── public/            # Static assets
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── pages/         # Page components
│   │   ├── context/       # React context
│   │   ├── hooks/         # Custom hooks
│   │   ├── utils/         # Utility functions
│   │   ├── App.jsx        # Main App component
│   │   └── main.jsx       # Entry point
│   └── package.json
│
├── docker-compose.yml     # Docker configuration
└── README.md             # This file
```

## 🛠️ API Documentation

### Authentication Endpoints

- `POST /api/users/register` - Register new user
- `POST /api/users/login` - Login user
- `GET /api/users/profile` - Get user profile (protected)
- `PUT /api/users/profile` - Update user profile (protected)

### Event Endpoints

- `GET /api/events` - Get all events
- `GET /api/events/:id` - Get event by ID
- `POST /api/events` - Create event (protected)
- `PUT /api/events/:id` - Update event (protected)
- `DELETE /api/events/:id` - Delete event (protected)
- `POST /api/events/:id/join` - Join event (protected)
- `POST /api/events/:id/leave` - Leave event (protected)

### WebSocket Events

- `updateLocation` - Update user location
- `joinEvent` - Join event room
- `leaveEvent` - Leave event room
- `eventUpdate` - Real-time event updates
- `privateMessage` - Send private messages

## 🧪 Testing

### Backend Tests

```bash
cd backend
npm test
```

### Frontend Tests

```bash
cd frontend
npm test
```

## 🚀 Deployment

### Manual Deployment

1. **Backend Deployment**

   ```bash
   cd backend
   npm run build
   npm start
   ```

2. **Frontend Deployment**
   ```bash
   cd frontend
   npm run build
   # Deploy the dist/ folder to your hosting service
   ```

### Docker Deployment

```bash
# Production deployment
docker-compose --profile production up -d
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Leaflet](https://leafletjs.com/) - Interactive maps
- [React Leaflet](https://react-leaflet.js.org/) - React components for Leaflet
- [Socket.io](https://socket.io/) - Real-time communication
- [MongoDB](https://www.mongodb.com/) - Database
- [Express.js](https://expressjs.com/) - Web framework

## 📞 Support

For support, email support@meetmux.com or create an issue in this repository.

## 🔄 Version History

- **v1.0.0** - Initial release with core features
  - User authentication
  - Event creation and management
  - Interactive map with event markers
  - Real-time location updates
  - Event filtering and search

---

**Made with ❤️ by the Meetmux Team**
