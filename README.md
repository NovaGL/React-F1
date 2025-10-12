# 🏎️ React F1 Dashboard

A comprehensive, interactive Formula 1 dashboard built with React and Tailwind CSS, displaying **real-time race data** from the 2025 season using the Ergast F1 API.

## ✨ Features

### 📊 **Driver Standings**

- Live driver championship standings with real-time points
- Full season standings table with sortable columns (Position, Points, Wins, Podiums, Avg Position, Form)
- Team-colored backgrounds and logos for visual identification
- Driver headshots with smart 3-tier fallback system (2025 → 2024 → Generic → Initials)
- Mobile and desktop optimized views

### 🏆 **Season Analysis**

- **Championship Battle** - Track the championship leader, contenders, and eliminated drivers
- **Championship Scenarios** - Calculate remaining points and title possibilities
- **Monte Carlo Simulation** - Run probabilistic championship predictions (1K-100K simulations)
- **Points Progression Chart** - Interactive line chart showing driver points over the season
- **Year-over-Year Wins Comparison** - Compare 2024 vs 2025 wins for top drivers
- **Performance Matrix** - Visual cards showing top 10 drivers with performance ratings
- **Team Performance** - Constructor standings with radar chart comparisons
- **Full Season Standings** - Comprehensive sortable table with all driver statistics

### 📅 **Race Calendar**

- Complete 2025 F1 race schedule with results
- Expandable race cards showing:
  - Race results with podium finishes
  - Qualifying results
  - Lap time analysis with interactive charts
  - Circuit information and track layouts
- Search and filter by race name or location
- Status indicators (completed/upcoming)

### 🎨 **Design & UX**

- **Responsive Design** - Fully optimized for mobile, tablet, and desktop
- **Team Colors** - Dynamic team-colored elements throughout the UI
- **Interactive Charts** - Built with Chart.js for data visualization
- **Smooth Animations** - Hover effects and transitions
- **Dark Theme** - Modern F1-inspired dark UI
- **Smart Image Fallbacks** - No broken images with intelligent fallback chain

## Setup

1. Install dependencies:

```bash
npm install
```

2. Start the development server:

```bash
npm run dev
```

3. Open your browser to `http://localhost:5173`

## Build for Production

```bash
npm run build
```

The optimized build will be in the `dist/` folder.

## 🛠️ Technologies

- **React 18** - UI framework with hooks
- **Tailwind CSS** - Utility-first styling
- **Vite** - Lightning-fast build tool and dev server
- **Chart.js** - Interactive data visualization
- **React Chart.js 2** - React wrapper for Chart.js
- **Ergast F1 API** - Comprehensive F1 historical and live data

## 📡 Data Source

All race data, standings, and statistics are provided by the [Ergast F1 API](http://ergast.com/mrd/) - the most comprehensive Formula 1 data API covering all seasons from 1950 to present.

## 🚀 Deploy to Vercel

This project is ready for deployment to Vercel:

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel
```

Or connect your GitHub repository to Vercel for automatic deployments on every push.

## 📝 Project Structure

```
React-F1/
├── app.jsx              # Main app component with routing and pages
├── SeasonAnalysis.jsx   # Comprehensive season analytics and charts
├── analytics.js         # Data analysis and calculations
├── ergast-api.js        # API client for Ergast F1 data
├── theme.js             # Team colors, logos, and utility functions
├── circuit-data.js      # Circuit information and track layouts
├── nationality-flags.jsx # Flag emoji mappings
├── index.css            # Global styles and Tailwind config
├── main.jsx             # React entry point
└── index.html           # HTML template
```

## 🎯 Key Features Explained

### Smart Image Fallback System

Driver images use a 3-tier fallback:

1. Try 2025 season driver folder
2. Fall back to 2024 season folder
3. Use generic F1 fallback image
4. Show driver initials as last resort

### Dynamic Team Colors

All team colors are dynamically applied throughout the UI based on the team ID, ensuring consistent branding.

### Sortable Tables

Click any column header in the Full Season Standings table to sort by that metric (ascending/descending).

### Interactive Charts

All charts are built with Chart.js and support:

- Hover tooltips
- Responsive resizing
- Custom team-colored datasets
- Multiple driver comparisons

## 📜 License

This project is open source and available for personal and educational use.
