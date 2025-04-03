import React, { useEffect, useState } from 'react';
import './App.css';
import logo from './assets/logo_header.png';

function App() {
  const [lineups, setLineups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchLineups = async () => {
    try {
      console.log('📥 Fetching lineups...');
      const res = await fetch('http://localhost:3001/lineups');
      const players = await res.json();

      const adjusted = players.map(p => ({
        ...p,
        adjustedHR: (p.baseHR * 100).toFixed(1)
      })).sort((a, b) => b.baseHR - a.baseHR);

      console.log('📊 Lineups received:', adjusted);
      setLineups(adjusted);
      setLastUpdated(new Date());
      setLoading(false);
    } catch (err) {
      console.error('❌ Error fetching lineups:', err);
      setError('Failed to load data. Try again later.');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLineups();

    const now = new Date();
    const delayToNextHour = (60 - now.getMinutes()) * 60 * 1000 - now.getSeconds() * 1000;

    const initialTimeout = setTimeout(() => {
      fetchLineups();
      setInterval(fetchLineups, 60 * 60 * 1000); // every hour
    }, delayToNextHour);

    return () => clearTimeout(initialTimeout);
  }, []);

  const getColorDot = (value) => {
    if (value > 1.15) return <span className="dot dot-red" />;
    if (value > 1.05) return <span className="dot dot-orange" />;
    if (value > 0.95) return <span className="dot dot-yellow" />;
    if (value > 0.85) return <span className="dot dot-green" />;
    return <span className="dot dot-blue" />;
  };

  const getWeatherDisplay = (mult, emoji) => {
    const parts = (emoji || '').split(' ');
    const arrow = parts[0] || '';
    const temp = parts[1] || '';
    const humid = parts[2] || '';
    const wind = parts[3] || '';

    return (
      <div className="weather-cell">
        {getColorDot(mult)}
        <strong>{(parseFloat(mult || 1) * 100).toFixed(0)}%</strong>
        <span className="weather-emoji">
          {arrow} {temp} {humid} {wind}
        </span>
      </div>
    );
  };

  const formatPercent = (val) => `${(parseFloat(val || 1) * 100).toFixed(0)}%`;

  const formatTime = (timeStr) => {
    const [hourStr, minutePart] = timeStr.split(':');
    let hour = parseInt(hourStr);
    return `${hour}:${minutePart}`;
  };

  if (loading) return <div className="App">Loading lineups and projections...</div>;
  if (error) return <div className="App error">{error}</div>;

  return (
    <div className="App">
      <img src={logo} alt="header" className="header-image" />

      {lastUpdated && (
        <div className="update-time">Updated: {lastUpdated.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</div>
      )}

      <div className="table-container">
        <table className="styled-table">
          <thead>
            <tr>
              <th>Batter</th>
              <th>Hand</th>
              <th>Batter ×</th>
              <th>Pitcher</th>
              <th>Throws</th>
              <th>Pitcher ×</th>
              <th>Park</th>
              <th>Park ×</th>
              <th>Weather ×</th>
              <th>HR%</th>
              <th>Time</th>
            </tr>
          </thead>
          <tbody>
            {lineups.map((p, i) => (
              <tr key={i}>
                <td>{p.player}</td>
                <td>{p.batterHand}</td>
                <td>{getColorDot(p.batterMultiplier)}{formatPercent(p.batterMultiplier)}</td>
                <td>{p.pitcher}</td>
                <td>{p.pitcherHand}</td>
                <td>{getColorDot(p.pitcherMultiplier)}{formatPercent(p.pitcherMultiplier)}</td>
                <td>{p.park}</td>
                <td>{getColorDot(p.parkMultiplier)}{formatPercent(p.parkMultiplier)}</td>
                <td>{getWeatherDisplay(p.weatherMultiplier, p.weatherEmoji)}</td>
                <td>{p.adjustedHR}%</td>
                <td>{formatTime(p.gameTime)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default App;
