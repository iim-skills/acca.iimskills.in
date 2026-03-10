module.exports = {
  apps: [
    {
      name: "next-app",
      script: "npm",
      args: "run start",
      cwd: "/home/iimskills.com/iimskills",
      env: {
        NODE_ENV: "production",
        PORT: 3000
      }
    }
  ]
};
