// frontend/src/components/LiveChart.jsx
import React, { useEffect, useState } from 'react'
import './LiveChart.css'

const LiveChart = ({ data, title, type = 'line' }) => {
  const [chartData, setChartData] = useState([])

  useEffect(() => {
    // In real app, use a charting library like recharts or chart.js
    // Here we simulate a simple bar chart with divs
    if (data && data.length) {
      setChartData(data)
    }
  }, [data])

  return (
    <div className="live-chart">
      <h3>{title}</h3>
      <div className="chart-container">
        {chartData.map((item, idx) => (
          <div key={idx} className="chart-bar" style={{ height: `${item.value * 3}px` }}>
            <span className="bar-label">{item.label}</span>
            <span className="bar-value">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default LiveChart