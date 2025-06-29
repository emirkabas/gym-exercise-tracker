# Gym Exercise Tracker

A modern, sleek fitness application for tracking exercises, managing muscle groups, and creating personalized workout programs. Built with Node.js, Express, and Supabase.

## ✨ Features

- **Exercise Library**: Comprehensive database of exercises with detailed information
- **Muscle Groups**: Organized exercise categorization by muscle groups
- **Workout Programs**: Create and manage personalized workout routines
- **Modern UI**: Sleek black aesthetic with 3D interface elements and lighting effects
- **Excel Import**: Import exercises from Excel/CSV files
- **Exercise Details**: View detailed exercise information with video and image links
- **Responsive Design**: Mobile-optimized interface

## 🚀 Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Supabase account

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd no_1
```

2. Install dependencies:
```bash
npm install
```

3. Set up your Supabase database:
   - Create a new Supabase project
   - Run the SQL schema from `supabase-schema.sql` in your Supabase SQL editor
   - Add your Supabase credentials to environment variables

4. Create a `.env` file with your Supabase credentials:
```env
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
```

5. Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## 📁 Project Structure

```
no_1/
├── public/                 # Frontend files
│   ├── index.html         # Homepage
│   ├── exercises.html     # Exercises page
│   ├── muscle-groups.html # Muscle groups page
│   └── workout-programs.html # Workout programs page
├── scripts/               # Database scripts
│   └── init-database.js   # Database initialization
├── server.js              # Express server
├── package.json           # Dependencies and scripts
├── supabase-schema.sql    # Database schema
└── README.md             # This file
```

## 🛠️ API Endpoints

- `GET /api/exercises` - Get all exercises
- `POST /api/exercises` - Add new exercise
- `DELETE /api/exercises/:id` - Delete exercise
- `GET /api/muscle-groups` - Get all muscle groups
- `GET /api/workout-programs` - Get all workout programs
- `POST /api/workout-programs` - Create new workout program
- `DELETE /api/workout-programs/:id` - Delete workout program
- `POST /api/upload` - Upload Excel file for exercise import

## 🎨 UI Features

- **Hero Section**: Impactful landing page with animated elements
- **Section Layout**: Alternating content sections for visual interest
- **Feature Cards**: Glass-morphism design with hover effects
- **Stats Dashboard**: Real-time statistics display
- **Modal Popups**: Detailed exercise information display
- **Responsive Navigation**: Mobile-friendly navigation menu

## 📊 Database Schema

The application uses Supabase with the following main tables:
- `exercises`: Exercise information with links and media
- `muscle_groups`: Muscle group categorization
- `workout_programs`: Custom workout programs

## 🔧 Development

### Running in Development Mode
```bash
npm run dev
```

### Running in Production Mode
```bash
npm start
```

### Database Initialization
```bash
node scripts/init-database.js
```

## 📝 License

This project is licensed under the MIT License.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📞 Support

For support and questions, please open an issue in the repository. 