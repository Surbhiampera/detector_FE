# Pharmacovigilance Signal Detector Dashboard

A React-based dashboard for pharmacovigilance signal detection and adverse event monitoring.

## Features

- **Real-time KPIs**: Total reports, flagged events, new signals, and top risk drugs
- **Interactive Explorer**: Filter and explore adverse event data with CSV upload capability
- **Signal Detection**: Visual heatmap and new signal identification
- **NLP Insights**: Natural language processing of narrative notes
- **Alerts & Notifications**: Configurable alert system for risk detection
- **Responsive Design**: Modern, dark-themed UI optimized for data analysis

## Getting Started

### Prerequisites

- Node.js (version 14 or higher)
- npm or yarn
- Backend API running on `http://0.0.0.0:8000`

### Installation

1. Install dependencies:

```bash
npm install
```

2. Start the development server:

```bash
npm start
```

3. Open [http://localhost:3000](http://localhost:3000) to view the application.

### Building for Production

```bash
npm run build
```

This builds the app for production to the `build` folder.

## Project Structure

```
src/
├── components/          # React components
│   ├── Header.js       # Application header
│   ├── KPIs.js         # Key Performance Indicators
│   ├── Explorer.js     # Data exploration and filtering
│   ├── Signals.js      # Signal detection and heatmap
│   ├── NLP.js          # Natural language processing insights
│   ├── Alerts.js       # Alerts and notifications
│   ├── Modal.js        # Modal dialog component
│   └── Notification.js # Toast notifications
├── services/
│   └── api.js          # API service layer and utilities
├── App.js              # Main application component
├── index.js            # Application entry point
└── index.css           # Global styles
```

## Key Components

### KPIs Component

- Displays key metrics with interactive modals
- Click on any KPI to see detailed breakdowns
- Real-time updates from the backend API

### Explorer Component

- Advanced filtering capabilities
- CSV file upload for new data
- Expandable table with show more/less functionality
- Patient report downloads

### Signals Component

- Interactive heatmap visualization
- New signal detection and tracking
- Expandable views for detailed analysis

### NLP Component

- Highlights key terms in narrative notes
- Click on highlighted terms for detailed statistics
- Patient case insights

### Alerts Component

- Configurable alert settings
- Real-time risk detection
- Client-side and server-side alert computation

## API Integration

The application expects a backend API with the following endpoints:

- `GET /api/kpis` - Key performance indicators
- `GET /api/events` - Adverse event data
- `GET /api/heatmap` - Signal detection heatmap data
- `GET /api/signals` - New signal data
- `GET /api/nlp` - NLP insights
- `GET /api/alerts` - Alert data
- `GET /api/event_stats` - Event statistics
- `GET /api/patient/{id}/report` - Patient reports
- `POST /api/upload_csv` - CSV file upload

## Configuration

The API base URL can be configured in `src/services/api.js`:

```javascript
const API_BASE = "http://0.0.0.0:8000";
```

## Features

### Data Persistence

- New signal counts and pairs are persisted in localStorage
- Alert settings are saved locally
- Baseline data for signal comparison

### Responsive Design

- Mobile-friendly interface
- Adaptive grid layouts
- Touch-friendly interactions

### Performance

- Efficient data loading with parallel API calls
- Client-side caching for improved performance
- Optimized re-rendering with React hooks

## Development

### Available Scripts

- `npm start` - Runs the app in development mode
- `npm test` - Launches the test runner
- `npm run build` - Builds the app for production
- `npm run eject` - Ejects from Create React App (one-way operation)

### Code Style

The project follows React best practices:

- Functional components with hooks
- Proper state management
- Component composition
- Error handling and loading states

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.
