module.exports = {
  apps: [{
    name: 'chester-guinness-index',
    script: 'node_modules/next/dist/bin/next',
    args: 'start',
    cwd: 'C:/Users/Administrator/chester-guinness-index',
    interpreter: 'C:/Program Files/nodejs/node.exe',
    env: {
      NODE_ENV: 'production',
      PORT: '3001',
    },
  }],
};