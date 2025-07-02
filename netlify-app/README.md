# Gym Exercise Tracker - Netlify App

A simplified, static version of the Gym Exercise Tracker application designed for deployment on Netlify.

## Features

- **Exercises**: Browse a comprehensive library of exercises with detailed information
- **Muscle Groups**: Explore exercises organized by muscle groups
- **Workout Programs**: View structured workout programs for different fitness levels
- **Workout Calendar**: Track your workout progress with a calendar interface

## Structure

```
netlify-app/
├── index.html          # Main HTML file
├── css/
│   └── styles.css      # All styles for the application
├── js/
│   └── app.js          # Main JavaScript functionality
├── netlify.toml        # Netlify configuration
└── README.md           # This file
```

## Technology Stack

- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Database**: Supabase (PostgreSQL)
- **Deployment**: Netlify
- **Styling**: Custom CSS with modern design principles

## Design Features

- **Dark Theme**: Sophisticated black aesthetic with subtle lighting effects
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices
- **Modern UI**: Clean, minimalist interface with smooth animations
- **Accessibility**: Proper semantic HTML and keyboard navigation support

## Deployment

### Prerequisites

1. A Netlify account
2. Your Supabase project with the database schema applied

### Deployment Steps

1. **Connect to Netlify**:
   - Go to [Netlify](https://netlify.com)
   - Click "New site from Git"
   - Connect your GitHub repository
   - Select the `netlify-app` branch

2. **Configure Build Settings**:
   - Build command: (leave empty - static site)
   - Publish directory: `netlify-app`
   - Base directory: (leave empty)

3. **Environment Variables** (if needed):
   - Add any environment variables in Netlify dashboard
   - Currently using hardcoded Supabase credentials for simplicity

4. **Deploy**:
   - Click "Deploy site"
   - Netlify will automatically build and deploy your site

### Custom Domain (Optional)

1. Go to your site settings in Netlify
2. Click "Domain settings"
3. Add your custom domain
4. Configure DNS settings as instructed

## Database Setup

Make sure your Supabase database has the following tables with RLS enabled:

- `muscle_groups`
- `exercises`
- `workout_programs`
- `workout_program_exercises`
- `user_workouts`

Run the `supabase-schema.sql` file in your Supabase SQL editor to set up the database.

## Local Development

To run the app locally:

1. Clone the repository
2. Navigate to the `netlify-app` directory
3. Open `index.html` in a web browser
4. Or use a local server:
   ```bash
   # Using Python
   python -m http.server 8000
   
   # Using Node.js
   npx serve .
   ```

## Features Overview

### Home Page
- Hero section with app introduction
- Feature cards linking to main sections
- Responsive design with smooth animations

### Exercises Page
- Search functionality
- Filter by muscle group and difficulty
- Exercise cards with detailed information
- Modal popups for exercise details

### Muscle Groups Page
- Grid layout of muscle groups
- Click to view exercises for each group
- Modal popups with exercise lists

### Workout Programs Page
- List of available workout programs
- Program details and difficulty levels
- Modal popups for program information

### Workout Calendar Page
- Monthly calendar view
- Workout day indicators
- Date selection functionality
- Responsive calendar grid

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Performance

- Optimized CSS and JavaScript
- Minimal external dependencies
- Fast loading times
- Efficient database queries

## Security

- Supabase RLS policies enabled
- Secure API endpoints
- Input validation
- XSS protection headers

## Future Enhancements

- User authentication
- Personal workout tracking
- Progress analytics
- Social features
- Mobile app version

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support or questions, please open an issue in the GitHub repository. 