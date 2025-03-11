import React from 'react';
import './App.css';
import Header from './components/Header';

function App() {
  return (
    <div className="App">
      <Header />
      <main style={{ padding: '2rem' }}>
        <h2>Welcome to Wonderfly Host Hub</h2>
        <p>The interactive control system for your events.</p>
      </main>
    </div>
  );
}

export default App;
