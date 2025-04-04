import React, { useEffect, useState } from 'react';
import './App.css';
import logo from './assets/logo_header.png';

function App() {
  const [lineups, setLineups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastWeatherUpdate, setLastWeatherUpdate] = useState(null);
  const [useTestData, setUseTestData] = useState(true); // toggle for test/live

  const fetchLineups = async () => {
    try {
      setLoading(true);
      const url = useTestData
        ? 'http://localhost:3001/lineups?test=true'
        : 'http://localhost:3001/lineups';

      console.log(`📥 Fetching lineups from: ${url}`);
      const res = await fetch(url);
      const players = await res.json();

      const adjusted = players.map(p => ({
        ...p,
        adjustedHR: (p.baseHR * 100).toFixed(1),
        batterHand: p.originalBatterHand === 'S' ? `${p.batterHand} (S)` : p.batterHand
      })).sort((a, b) => b.baseHR - a.baseHR);

      console.log('📊 Lineups received:', adjusted);
      setLineups(adjusted);
      const top = players[0];
      if (top && top.weatherUpdated) {
        setLastWeatherUpdate(new Date(top.weatherUpdated));
      }
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
  }, [useTestData]);

  const getColorDot = (value) => {
    if (value >= 1.2) return <span className="dot dot-green" />;       // Great for HRs
    if (value >= 1.0) return <span className="dot dot-yellow" />;     // Around average
    return <span className="dot dot-red" />;                          // Bad for HRs
  };

  const getWeatherDisplay = (mult, emoji, batterHand, windText, windFavorability) => {
    const parts = (emoji || '').split(' ');
    const arrow = parts[0] || '';
    const temp = parts[1] || '';
    const humid = parts[2] || '';
    const wind = parts[3] || '';

    return (
      <div className="weather-cell" title={windText + ' • ' + windFavorability}>
        {getColorDot(mult)}
        <strong>{(parseFloat(mult || 1) * 100).toFixed(0)}%</strong>
        <span className="weather-emoji">
          {arrow} {temp} {humid} {wind}
        </span>
        <span className="weather-emoji">{windFavorability}</span>
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

      <div className="toggle-container">
        <label>
          <input
            type="checkbox"
            checked={useTestData}
            onChange={() => setUseTestData(!useTestData)}
          />
          Use Test Data
        </label>
      </div>

      {lastWeatherUpdate && (
        <div className="update-time">Updated: {lastWeatherUpdate.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</div>
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
                <td>{getWeatherDisplay(p.weatherMultiplier, p.weatherEmoji, p.batterHand, p.windRelativeText, p.windFavorability)}</td>
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
