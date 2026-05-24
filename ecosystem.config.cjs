module.exports = {
  apps: [
    {
      name: "google-form-backend",
      script: "./index.js",
      instances: "max", // Run on all available CPU cores
      exec_mode: "cluster", // Enable cluster mode for load balancing
      watch: false, // Don't restart on file changes in production
      max_memory_restart: "1G", // Restart if memory exceeds 1GB
      env: {
        NODE_ENV: "development",
      },
      env_production: {
        NODE_ENV: "production",
      }
    }
  ]
};
