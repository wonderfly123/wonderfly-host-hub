import React from 'react';

const Header = () => {
  return (
    <header style={styles.header}>
      <h1 style={styles.title}>Wonderfly Host Hub</h1>
      <p style={styles.subtitle}>Interactive Event Management</p>
    </header>
  );
};

const styles = {
  header: {
    backgroundColor: '#3f51b5',
    color: 'white',
    padding: '1rem',
    textAlign: 'center',
  },
  title: {
    margin: 0,
    fontSize: '2rem'
  },
  subtitle: {
    margin: '0.5rem 0 0',
    fontSize: '1rem'
  }
};

export default Header;
