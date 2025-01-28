function toggleTheme() {
    const root = document.documentElement;
    if (root.style.getPropertyValue('--bg-color') === '#e3f2fd') {
      root.style.setProperty('--bg-color', '#000000'); // Dark Black
      root.style.setProperty('--text-color', '#00ff00'); // Greenish Text
      root.style.setProperty('--accent-color', '#00b300'); // Bright Green
      document.body.style.backgroundImage = 'none';
      document.body.style.animation = 'none';
    } else {
      root.style.setProperty('--bg-color', '#e3f2fd'); // Light Blue
      root.style.setProperty('--text-color', '#000000');
      root.style.setProperty('--accent-color', '#0d47a1'); // Blue
      document.body.style.backgroundImage = 'none';
      document.body.style.animation = 'none';
    }
  }
  
